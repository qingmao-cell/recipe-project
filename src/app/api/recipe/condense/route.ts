import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  CondenseRequestSchema,
  CondenseRequest,
  CondenseResponse,
} from "@/types/condense";
import { normalizeCondenseResponse } from "@/lib/normalizeCondense";

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 生成System提示词
function generateSystemPrompt(locale: "zh" | "ja"): string {
  if (locale === "ja") {
    return `あなたは専門的な料理編集者です。入力されたレシピを工芸や配合比を変えることなく「動作の統合と順序最適化」を行い、厳密なJSONを出力してください。
規則：
1. 「並行または連続可能」な些細な手順の統合を許可（例：「ボウルを取る/卵を割る/混ぜる」→「卵を割って混ぜる」）
2. 温度/時間/重要なポイントを含む手順の統合は禁止（例：「キャラメルが琥珀色になったら火を止める」「オーブンを180℃に予熱」）
3. すべての数値（g、ml、温度、時間）を保持
4. 原文に「キャラメル/プリン」等の節があれば節を保持
5. 「並行タイムライン」生成：並行可能な段階を交互配置（例：「キャラメル冷却中→卵液調整」）
6. warnings で危険点をまとめる：高温シロップは離れない、熱い液体はゆっくり注ぐ等
7. 出力言語はlocaleに従う`;
  }

  return `你是专业烘焙/中餐编辑。把输入菜谱在不改变工艺与配比的前提下进行"动作合并和顺序优化"。输出严格 JSON。
规则：
1. 允许合并"可并行或可连续"的琐碎步骤（如"取碗/打蛋/混匀"→"打蛋并混匀"）。
2. 不得合并含温度/时间/关键节点的步骤（如"焦糖变琥珀色关火""烤箱预热到180℃"）。
3. 保留所有数值（克、ml、温度、时间）。
4. 若原文存在"焦糖/布丁"等分节，保持分节。
5. 生成"并行时间线"：把可并行的阶段交错排布（如"焦糖冷却时→调蛋奶液"）。
6. warnings 汇总危险点：高温糖浆不可离人、热液倒入需缓慢等。
7. 输出语言依据 locale。`;
}

// 生成User提示词
function generateUserPrompt(request: CondenseRequest): string {
  const { title, rawText, phases, locale, maxSteps } = request;

  let prompt = `菜谱标题: ${title}\n`;
  prompt += `最大步骤数: ${maxSteps}\n`;
  prompt += `语言: ${locale}\n\n`;

  if (rawText) {
    prompt += `原始文本:\n${rawText}\n\n`;
  }

  if (phases && phases.length > 0) {
    prompt += `分节信息:\n`;
    phases.forEach((phase) => {
      prompt += `== ${phase.name} ==\n`;
      if (phase.ingredients.length > 0) {
        prompt += `食材: ${phase.ingredients
          .map((ing) => `${ing.name}${ing.amount ? ` ${ing.amount}` : ""}`)
          .join(", ")}\n`;
      }
      if (phase.steps.length > 0) {
        prompt += `步骤:\n`;
        phase.steps.forEach((step) => {
          prompt += `${step.order}. ${step.text}\n`;
        });
      }
      prompt += `\n`;
    });
  }

  prompt += `要求: 步骤总数≤${maxSteps}，若超则合并但不得丢失关键参数。只输出JSON，不要其他文字。`;

  return prompt;
}

// 调用OpenAI并处理响应
async function callOpenAI(
  request: CondenseRequest,
  retryCount = 0
): Promise<CondenseResponse> {
  const systemPrompt = generateSystemPrompt(request.locale || "zh");
  const userPrompt = generateUserPrompt(request);

  console.log("发送AI整理请求:", {
    title: request.title,
    maxSteps: request.maxSteps,
    hasRawText: !!request.rawText,
    phasesCount: request.phases?.length || 0,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2000,
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 返回空内容");
  }

  console.log("OpenAI 原始响应:", content.slice(0, 500) + "...");

  // 解析 JSON 响应
  let aiData: any;
  try {
    // 尝试直接解析
    aiData = JSON.parse(content);
  } catch {
    // 提取 JSON 块
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("无法从响应中提取 JSON");
    }
    aiData = JSON.parse(jsonMatch[0]);
  }

  // 标准化和验证数据
  try {
    return normalizeCondenseResponse(aiData);
  } catch (error) {
    console.error("数据验证失败:", error);

    // 重试一次
    if (retryCount < 1) {
      console.log("进行重试...");
      return callOpenAI(request, retryCount + 1);
    }

    throw new Error("数据格式验证失败");
  }
}

export async function POST(req: NextRequest) {
  try {
    // 检查 OpenAI API Key
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
      return NextResponse.json(
        {
          error: "未配置 OPENAI_API_KEY 环境变量",
          reason: "missing_api_key",
        },
        { status: 502 }
      );
    }

    // 解析和验证请求数据
    const body = await req.json();
    const request = CondenseRequestSchema.parse(body);

    console.log("AI整理请求:", {
      title: request.title,
      maxSteps: request.maxSteps,
      locale: request.locale,
    });

    // 调用AI进行整理
    const result = await callOpenAI(request);

    console.log("AI整理成功:", {
      originalSteps: result.diffMeta.originalStepCount,
      conciseSteps: result.diffMeta.conciseStepCount,
      confidence: result.diffMeta.confidence,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI整理API错误:", error);

    // OpenAI错误
    if (error instanceof Error && error.message.includes("OpenAI")) {
      return NextResponse.json(
        {
          error: "OpenAI服务错误",
          suggest: "请稍后重试",
          reason: "openai_error",
        },
        { status: 502 }
      );
    }

    // 验证错误
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        {
          error: "数据格式错误",
          suggest: "降低maxSteps或检查原文分节",
          reason: "validation_error",
        },
        { status: 400 }
      );
    }

    // JSON解析错误
    if (error instanceof Error && error.message.includes("JSON")) {
      return NextResponse.json(
        {
          error: "AI响应格式错误",
          suggest: "降低maxSteps或检查原文分节",
          reason: "json_parse_error",
        },
        { status: 502 }
      );
    }

    // 其他错误
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "未知错误",
        suggest: "请检查输入参数并重试",
        reason: "unknown_error",
      },
      { status: 500 }
    );
  }
}
