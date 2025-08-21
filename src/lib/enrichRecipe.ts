/**
 * 菜谱数据富化工具
 * 结合规则抽取和LLM智能识别
 */

import OpenAI from "openai";
import { config } from "./config";
import {
  normalizeList,
  deriveMacroTags,
  deriveFlavorTags,
  mergeTags,
  cleanTags,
} from "./normalize";
import { canonical } from "@/data/lexicons";

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * 使用LLM抽取结构化信息
 */
export async function extractByLLM(text: string): Promise<{
  ingredients: string[];
  seasonings: string[];
  tools: string[];
}> {
  try {
    const prompt = `你是一个结构化信息抽取器。请从下面这份菜谱文本中抽取 3 类信息：
- ingredients: 原材料（只要食材名，去掉用量/单位）
- seasonings: 调味（盐、糖、生抽、老抽、醋、辣椒、豆瓣酱、花椒、蒜、姜等）
- tools: 厨具（烤箱、空气炸锅、微波炉、蒸锅、炒锅、高压锅等）

只返回 JSON，不要多余文字。例：{"ingredients":["鸡肉"],"seasonings":["盐"],"tools":["炒锅"]}

文本：${text}`;

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: config.openai.maxTokens,
      temperature: config.openai.temperature,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("LLM返回空内容");
    }

    const result = JSON.parse(content);
    return {
      ingredients: Array.isArray(result.ingredients) ? result.ingredients : [],
      seasonings: Array.isArray(result.seasonings) ? result.seasonings : [],
      tools: Array.isArray(result.tools) ? result.tools : [],
    };
  } catch (error) {
    console.error("LLM抽取失败:", error);
    return {
      ingredients: [],
      seasonings: [],
      tools: [],
    };
  }
}

/**
 * 菜谱数据富化主函数
 */
export async function enrichRecipe({
  title,
  rawIngredients,
  rawSteps,
  fallbackText,
  userTags = [],
}: {
  title?: string;
  rawIngredients?: string[] | string | null;
  rawSteps?: string[] | string | null;
  fallbackText?: string;
  userTags?: string[];
}): Promise<{
  ingredients: string[];
  seasonings: string[];
  tools: string[];
  tags: string[];
}> {
  // 1. 规则抽取 + 规范化
  const ruleIngredients = normalizeList(rawIngredients, canonical.ingredients);
  const stepsArr = Array.isArray(rawSteps)
    ? rawSteps
    : rawSteps
    ? String(rawSteps).split(/[。.\n]/)
    : [];
  const stepsText = stepsArr.join("。");

  // 2. LLM 抽取（可选兜底）
  let llm = {
    ingredients: [] as string[],
    seasonings: [] as string[],
    tools: [] as string[],
  };
  if (fallbackText && fallbackText.length > 20) {
    try {
      llm = await extractByLLM(fallbackText);
    } catch (error) {
      console.log("LLM抽取跳过，使用规则抽取结果");
    }
  }

  // 3. 合并去重
  const ingredients = Array.from(
    new Set([
      ...ruleIngredients,
      ...normalizeList(llm.ingredients, canonical.ingredients),
    ])
  );

  const seasonings = normalizeList(llm.seasonings, canonical.seasonings);
  const tools = normalizeList(llm.tools, canonical.tools);

  // 4. 推导标签
  const baseText = [title, stepsText, fallbackText].filter(Boolean).join("。");
  const derivedTags = mergeTags(
    deriveMacroTags(ingredients),
    deriveFlavorTags(baseText, stepsArr.length),
    userTags
  );

  const tags = cleanTags(derivedTags);

  return { ingredients, seasonings, tools, tags };
}

/**
 * 批量富化菜谱数据
 */
export async function enrichRecipes(
  recipes: Array<{
    title?: string;
    rawIngredients?: string[] | string | null;
    rawSteps?: string[] | string | null;
    fallbackText?: string;
    userTags?: string[];
  }>
): Promise<
  Array<{
    ingredients: string[];
    seasonings: string[];
    tools: string[];
    tags: string[];
  }>
> {
  const results = [];

  for (const recipe of recipes) {
    try {
      const enriched = await enrichRecipe(recipe);
      results.push(enriched);
    } catch (error) {
      console.error("富化菜谱失败:", error);
      // 返回空数组作为fallback
      results.push({
        ingredients: [],
        seasonings: [],
        tools: [],
        tags: [],
      });
    }
  }

  return results;
}




