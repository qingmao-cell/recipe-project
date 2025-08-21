import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import axios from "axios";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { z } from "zod";
import OpenAI from "openai";
import { enrichRecipe } from "@/lib/enrichRecipe";

import { config } from "@/lib/config";

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Request validation schema
const collectSchema = z.object({
  url: z.string().url("请输入有效的URL"),
});

interface ParseResult {
  title: string;
  imageUrl: string | null;
  description: string | null;
  ingredients: string[];
  steps: string[];
  tags: string[];
  parseSource:
    | "jsonld"
    | "microdata"
    | "readability"
    | "ai-refine"
    | "fallback";
  warning?: string;
}

// 解析 JSON-LD 结构化数据
function parseJsonLD(html: string): Partial<ParseResult> | null {
  try {
    console.log("尝试解析 JSON-LD...");
    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');

    for (let i = 0; i < scripts.length; i++) {
      const scriptContent = $(scripts[i]).html();
      if (!scriptContent) continue;

      try {
        const data = JSON.parse(scriptContent);
        const recipes = Array.isArray(data) ? data : [data];

        for (const item of recipes) {
          if (
            item["@type"]?.includes?.("Recipe") ||
            item["@type"] === "Recipe"
          ) {
            console.log("找到 Recipe JSON-LD:", item.name);

            // 解析配料
            const ingredients = Array.isArray(item.recipeIngredient)
              ? item.recipeIngredient.filter(
                  (ing: any) => typeof ing === "string"
                )
              : [];

            // 解析步骤
            let steps: string[] = [];
            if (Array.isArray(item.recipeInstructions)) {
              steps = item.recipeInstructions
                .map((inst: any) => {
                  if (typeof inst === "string") return inst;
                  if (inst.text) return inst.text;
                  if (inst.name) return inst.name;
                  return String(inst);
                })
                .filter(Boolean);
            }

            // 解析图片
            let imageUrl: string | null = null;
            if (item.image) {
              if (typeof item.image === "string") {
                imageUrl = item.image;
              } else if (Array.isArray(item.image) && item.image.length > 0) {
                imageUrl =
                  typeof item.image[0] === "string"
                    ? item.image[0]
                    : item.image[0].url;
              } else if (item.image.url) {
                imageUrl = item.image.url;
              }
            }

            // 解析标签
            const tags: string[] = [];
            if (item.keywords) {
              if (typeof item.keywords === "string") {
                tags.push(
                  ...item.keywords.split(",").map((k: string) => k.trim())
                );
              } else if (Array.isArray(item.keywords)) {
                tags.push(
                  ...item.keywords.filter((k: any) => typeof k === "string")
                );
              }
            }
            if (item.recipeCuisine) {
              tags.push(item.recipeCuisine);
            }

            return {
              title: item.name || "",
              imageUrl,
              description: item.description || null,
              ingredients,
              steps,
              tags,
              parseSource: "jsonld" as const,
            };
          }
        }
      } catch (jsonError) {
        console.log("JSON-LD 解析错误:", jsonError);
      }
    }
  } catch (error) {
    console.log("JSON-LD 解析失败:", error);
  }
  return null;
}

// 解析 Microdata
function parseMicrodata(html: string): Partial<ParseResult> | null {
  try {
    console.log("尝试解析 Microdata...");
    const $ = cheerio.load(html);
    const recipeElements = $('[itemscope][itemtype*="Recipe"]');

    if (recipeElements.length === 0) return null;

    const recipeEl = recipeElements.first();
    console.log("找到 Recipe Microdata");

    // 提取配料
    const ingredients: string[] = [];
    recipeEl.find('[itemprop="recipeIngredient"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(text);
    });

    // 提取步骤
    const steps: string[] = [];
    recipeEl.find('[itemprop="recipeInstructions"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text) steps.push(text);
    });

    // 提取其他信息
    const title = recipeEl.find('[itemprop="name"]').first().text().trim();
    const imageUrl =
      recipeEl.find('[itemprop="image"]').first().attr("src") || null;
    const description =
      recipeEl.find('[itemprop="description"]').first().text().trim() || null;

    return {
      title: title || "",
      imageUrl,
      description,
      ingredients,
      steps,
      tags: [],
      parseSource: "microdata" as const,
    };
  } catch (error) {
    console.log("Microdata 解析失败:", error);
  }
  return null;
}

// 使用 Readability 解析
function parseWithReadability(
  html: string,
  url: string
): Partial<ParseResult> | null {
  try {
    console.log("尝试使用 Readability 解析...");
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) return null;

    console.log("Readability 解析成功:", article.title);
    const $ = cheerio.load(article.content);

    // 在清理后的内容中查找配料和步骤
    const ingredients: string[] = [];
    const steps: string[] = [];

    // 配料关键词
    const ingredientKeywords = [
      "材料",
      "配料",
      "用料",
      "食材",
      "ingredients",
      "materials",
    ];

    // 步骤关键词
    const stepKeywords = [
      "步骤",
      "做法",
      "制法",
      "instructions",
      "steps",
      "方法",
    ];

    // 查找配料段落
    $("h1, h2, h3, h4, h5, h6, strong, b").each((_, el) => {
      const heading = $(el).text().toLowerCase();
      if (ingredientKeywords.some((keyword) => heading.includes(keyword))) {
        // 查找后续的列表或段落
        let next = $(el).next();
        while (next.length && !next.is("h1, h2, h3, h4, h5, h6")) {
          if (next.is("ul, ol")) {
            next.find("li").each((_, li) => {
              const text = $(li).text().trim();
              if (text && text.length > 2 && text.length < 100) {
                ingredients.push(text);
              }
            });
            break;
          } else if (next.is("p")) {
            const lines = next.text().split("\n");
            lines.forEach((line) => {
              line = line.trim();
              if (line && line.length > 2 && line.length < 100) {
                ingredients.push(line);
              }
            });
          }
          next = next.next();
        }
      }
    });

    // 查找步骤段落
    $("h1, h2, h3, h4, h5, h6, strong, b").each((_, el) => {
      const heading = $(el).text().toLowerCase();
      if (stepKeywords.some((keyword) => heading.includes(keyword))) {
        let next = $(el).next();
        while (next.length && !next.is("h1, h2, h3, h4, h5, h6")) {
          if (next.is("ol")) {
            next.find("li").each((_, li) => {
              const text = $(li).text().trim();
              if (text && text.length > 5 && text.length < 300) {
                steps.push(text);
              }
            });
            break;
          } else if (next.is("p, div")) {
            const text = next.text();
            // 查找编号步骤
            const numberedSteps = text.match(
              /(\d+[.、)）]|第[一二三四五六七八九十\d]+步)[^。\n]*[。]?/g
            );
            if (numberedSteps) {
              numberedSteps.forEach((step) => {
                const cleaned = step
                  .replace(
                    /^(\d+[.、)）]|第[一二三四五六七八九十\d]+步)\s*/,
                    ""
                  )
                  .trim();
                if (cleaned && cleaned.length > 5) {
                  steps.push(cleaned);
                }
              });
            }
          }
          next = next.next();
        }
      }
    });

    return {
      title: article.title || "",
      imageUrl: null, // Readability 不提供图片
      description: article.textContent?.slice(0, 200) || null,
      ingredients,
      steps,
      tags: [],
      parseSource: "readability" as const,
    };
  } catch (error) {
    console.log("Readability 解析失败:", error);
  }
  return null;
}

// 获取 Open Graph 数据作为兜底
function parseOpenGraph(html: string): Partial<ParseResult> {
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text() ||
    $("h1").first().text() ||
    "未获取到标题";

  let imageUrl = $('meta[property="og:image"]').attr("content") || null;
  if (!imageUrl) {
    const firstImg = $("img").first().attr("src");
    if (firstImg) {
      imageUrl = firstImg.startsWith("http")
        ? firstImg
        : new URL(firstImg, "https://example.com").href;
    }
  }

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    null;

  return {
    title: title.slice(0, 200),
    imageUrl,
    description: description?.slice(0, 500) || null,
    ingredients: [],
    steps: [],
    tags: [],
    parseSource: "fallback" as const,
  };
}

// 确保图片URL是绝对路径
function resolveImageUrl(
  imageUrl: string | null,
  baseUrl: string
): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith("//")) return "https:" + imageUrl;
  try {
    return new URL(imageUrl, baseUrl).href;
  } catch {
    return imageUrl;
  }
}

// AI 清洗和补全内容
async function refineWithAI(
  rawText: string,
  existingData: Partial<ParseResult>
): Promise<Partial<ParseResult> | null> {
  try {
    console.log("开始AI清洗，rawText长度:", rawText.length);

    if (!config.openai.apiKey) {
      console.log("未配置OPENAI_API_KEY，跳过AI清洗");
      return null;
    }

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: "user",
          content: `请从以下网页文本中提取菜谱信息，返回JSON格式。已有部分信息：${JSON.stringify(
            existingData
          )}

网页文本：
${rawText.slice(0, 3000)}

请返回格式：
{
  "title": "菜谱名称（如果已有则保持不变）",
  "ingredients": ["食材1", "食材2"],
  "steps": ["步骤1", "步骤2"],
  "tags": ["标签1", "标签2"],
  "description": "菜谱描述"
}

要求：
1. 只返回JSON，不要其他文字
2. 优先保留已有信息，只补全缺失的ingredients和steps
3. 如果无法识别菜谱信息，返回空数组
4. 标签应包含菜系、难度、特色等`,
        },
      ],
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log("AI清洗：OpenAI返回空内容");
      return null;
    }

    console.log("AI清洗结果:", content);

    // 尝试解析JSON
    let aiData;
    try {
      // 首先尝试直接解析
      aiData = JSON.parse(content);
    } catch {
      // 如果失败，尝试提取JSON块
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log("AI清洗：无法提取JSON");
        return null;
      }
      aiData = JSON.parse(jsonMatch[0]);
    }

    return {
      title: existingData.title || aiData.title || "",
      ingredients: aiData.ingredients || [],
      steps: aiData.steps || [],
      tags: [...(existingData.tags || []), ...(aiData.tags || [])],
      description: existingData.description || aiData.description || null,
      parseSource: "ai-refine",
    };
  } catch (error) {
    console.error("AI清洗失败:", error);
    return null;
  }
}

// 获取域名
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "未知来源";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = collectSchema.parse(body);

    // 检查是否已存在
    const existingRecipe = await prisma.recipe.findUnique({
      where: { sourceUrl: url },
    });

    if (existingRecipe) {
      return NextResponse.json({
        success: true,
        recipe: existingRecipe,
        message: "该菜谱已收藏过了",
      });
    }

    console.log("正在抓取URL:", url);
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RecipeCollector/1.0)",
      },
    });

    const html = response.data;
    let parseResult: ParseResult;
    let needsAIRefine = false;

    // 1. 尝试 JSON-LD 结构化解析
    const jsonldResult = parseJsonLD(html);
    if (
      jsonldResult &&
      (jsonldResult.ingredients?.length || jsonldResult.steps?.length)
    ) {
      parseResult = {
        ...parseOpenGraph(html),
        ...jsonldResult,
      } as ParseResult;
    } else {
      // 2. 尝试 Microdata 解析
      const microdataResult = parseMicrodata(html);
      if (
        microdataResult &&
        (microdataResult.ingredients?.length || microdataResult.steps?.length)
      ) {
        parseResult = {
          ...parseOpenGraph(html),
          ...microdataResult,
        } as ParseResult;
      } else {
        // 3. 尝试 Readability 解析
        const readabilityResult = parseWithReadability(html, url);
        if (
          readabilityResult &&
          (readabilityResult.ingredients?.length ||
            readabilityResult.steps?.length)
        ) {
          parseResult = {
            ...parseOpenGraph(html),
            ...readabilityResult,
          } as ParseResult;
        } else {
          // 4. 兜底方案：仅保存基本信息，标记需要AI清洗
          console.log("所有解析方法都未成功，使用兜底方案");
          parseResult = {
            ...parseOpenGraph(html),
            warning: "content-partial",
          } as ParseResult;
          needsAIRefine = true;
        }
      }
    }

    // 检查是否需要AI清洗（ingredients或steps缺失/过短）
    if (!needsAIRefine) {
      needsAIRefine =
        !parseResult.ingredients?.length ||
        !parseResult.steps?.length ||
        parseResult.ingredients.length < 2 ||
        parseResult.steps.length < 2;
    }

    // 5. AI清洗步骤
    if (needsAIRefine) {
      console.log("需要AI清洗，开始提取原始文本...");

      // 使用Readability提取原始文本
      try {
        const dom = new JSDOM(html, { url });
        const article = new Readability(dom.window.document, {
          debug: false,
        }).parse();

        if (article?.textContent) {
          const aiResult = await refineWithAI(article.textContent, parseResult);

          if (
            aiResult &&
            (aiResult.ingredients?.length || aiResult.steps?.length)
          ) {
            console.log("AI清洗成功，合并结果");

            // 合并结果：保留原有的好数据，用AI补全缺失部分
            parseResult = {
              ...parseResult,
              title: parseResult.title || aiResult.title || parseResult.title,
              ingredients: parseResult.ingredients?.length
                ? parseResult.ingredients
                : aiResult.ingredients || [],
              steps: parseResult.steps?.length
                ? parseResult.steps
                : aiResult.steps || [],
              tags: [...(parseResult.tags || []), ...(aiResult.tags || [])],
              description:
                parseResult.description || aiResult.description || null,
              parseSource: "ai-refine",
            };

            // 在tags中添加ai_refined标记
            if (!parseResult.tags.includes("ai_refined")) {
              parseResult.tags.push("ai_refined");
            }
          }
        }
      } catch (error) {
        console.error("AI清洗过程失败:", error);
      }
    }

    // 确保图片URL是绝对路径
    parseResult.imageUrl = resolveImageUrl(parseResult.imageUrl, url);

    // 使用新的富化系统处理菜谱数据
    const enriched = await enrichRecipe({
      title: parseResult.title,
      rawIngredients: parseResult.ingredients,
      rawSteps: parseResult.steps,
      fallbackText: parseResult.description || undefined,
      userTags: parseResult.tags,
    });

    // 保存到数据库（使用新的结构化字段）
    const recipe = await prisma.recipe.create({
      data: {
        title: parseResult.title,
        imageUrl: parseResult.imageUrl,
        sourceUrl: url,
        description: parseResult.description,
        ingredients: enriched.ingredients,
        seasonings: enriched.seasonings,
        tools: enriched.tools,
        steps: parseResult.steps.length > 0 ? parseResult.steps : undefined,
        tags: enriched.tags,
        domain: getDomain(url),
        parseSource: parseResult.parseSource,
      },
    });

    console.log(
      "收藏成功:",
      recipe.id,
      recipe.title,
      "解析方式:",
      parseResult.parseSource,
      "结构化数据:",
      {
        ingredients: enriched.ingredients.length,
        seasonings: enriched.seasonings.length,
        tools: enriched.tools.length,
        tags: enriched.tags.length,
      }
    );

    return NextResponse.json({
      success: true,
      recipe,
      message: parseResult.warning
        ? "菜谱收藏成功！但内容需要完善，请点击编辑补充。"
        : parseResult.parseSource === "ai-refine"
        ? "菜谱收藏成功！AI已自动优化内容。"
        : "菜谱收藏成功！",
      parseSource: parseResult.parseSource,
      warning: parseResult.warning,
    });
  } catch (error) {
    console.error("收藏失败:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.errors[0].message,
        },
        { status: 400 }
      );
    }

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: "无法访问该网页，请检查URL是否正确",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "收藏失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}
