import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// 菜谱数据类型定义
interface RecipeData {
  title: string;
  ingredients: Array<{
    name: string;
    amount: string | null;
  }>;
  steps: string[];
  tags: string[];
}

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // 检查 OpenAI API Key
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
      return NextResponse.json(
        { error: "未配置 OPENAI_API_KEY 环境变量" },
        { status: 500 }
      );
    }

    // 解析上传的文件
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "未找到图片文件" }, { status: 400 });
    }

    // 验证文件类型
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "不支持的文件类型，请上传图片" },
        { status: 400 }
      );
    }

    console.log(
      `接收到图片文件: ${imageFile.name}, 大小: ${imageFile.size} bytes`
    );

    // 转换为 base64
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = imageBuffer.toString("base64");

    console.log("开始调用 OpenAI Vision API...");

    // 调用 OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `你是菜谱识别助手，从图片中提取菜谱信息，并返回合法 JSON：
{
  "title": string,
  "ingredients": [{"name": string, "amount": string|null}],
  "steps": string[],
  "tags": string[]
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请分析这张图片中的菜谱信息，严格按照要求的JSON格式返回，不要包含其他文字。",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI 返回空内容");
    }

    console.log("OpenAI 响应:", content);

    // 解析 JSON 响应
    let recipeData: RecipeData;
    try {
      // 尝试直接解析
      recipeData = JSON.parse(content);
    } catch {
      // 如果失败，尝试提取 JSON 块
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("无法从响应中提取 JSON");
      }
      recipeData = JSON.parse(jsonMatch[0]);
    }

    // 验证数据格式
    if (
      !recipeData.title ||
      !Array.isArray(recipeData.ingredients) ||
      !Array.isArray(recipeData.steps)
    ) {
      throw new Error("返回的数据格式不正确");
    }

    console.log("菜谱解析成功:", {
      title: recipeData.title,
      ingredientsCount: recipeData.ingredients.length,
      stepsCount: recipeData.steps.length,
      tags: recipeData.tags,
    });

    // 返回标准格式的 JSON 数据
    return NextResponse.json(recipeData);
  } catch (error) {
    console.error("OCR API 错误:", error);

    // 统一错误格式
    return NextResponse.json({ error: "解析失败" }, { status: 500 });
  }
}
