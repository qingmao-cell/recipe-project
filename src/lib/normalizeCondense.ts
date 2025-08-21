import {
  CondenseRequest,
  CondenseResponse,
  CondenseResponseSchema,
} from "@/types/condense";

/**
 * 标准化和验证AI整理响应数据
 */
export function normalizeCondenseResponse(data: any): CondenseResponse {
  // 预处理数据，确保基本结构
  const normalized = {
    concise: {
      title: data.concise?.title || "未知菜谱",
      phases: Array.isArray(data.concise?.phases) ? data.concise.phases : [],
      checklist: Array.isArray(data.concise?.checklist)
        ? data.concise.checklist
        : [],
      timeline: Array.isArray(data.concise?.timeline)
        ? data.concise.timeline
        : [],
      warnings: Array.isArray(data.concise?.warnings)
        ? data.concise.warnings
        : [],
      notes: Array.isArray(data.concise?.notes)
        ? data.concise.notes
        : undefined,
    },
    diffMeta: {
      originalStepCount: Number(data.diffMeta?.originalStepCount) || 0,
      conciseStepCount: Number(data.diffMeta?.conciseStepCount) || 0,
      mergeHints: Array.isArray(data.diffMeta?.mergeHints)
        ? data.diffMeta.mergeHints
        : [],
      lostInfo: Array.isArray(data.diffMeta?.lostInfo)
        ? data.diffMeta.lostInfo
        : undefined,
      confidence: Math.max(
        0,
        Math.min(1, Number(data.diffMeta?.confidence) || 0.5)
      ),
    },
    source: "ai-condense" as const,
  };

  // 标准化phases结构
  normalized.concise.phases = normalized.concise.phases.map((phase: any) => ({
    name: String(phase.name || "未知阶段"),
    steps: Array.isArray(phase.steps)
      ? phase.steps.filter((step: any) => step && step.trim())
      : [],
  }));

  // 标准化timeline结构
  normalized.concise.timeline = normalized.concise.timeline.map(
    (timeEntry: any) => ({
      at: String(timeEntry.at || ""),
      actions: Array.isArray(timeEntry.actions)
        ? timeEntry.actions.map((action: any) => ({
            phase: String(action.phase || ""),
            step: Number(action.step) || 0,
            text: String(action.text || ""),
          }))
        : [],
    })
  );

  // 使用Zod验证最终数据
  return CondenseResponseSchema.parse(normalized);
}

/**
 * 从菜谱数据构建CondenseRequest
 */
export function buildCondenseRequest(
  title: string,
  ingredients?: string,
  steps?: string,
  rawText?: string,
  locale: "zh" | "ja" = "zh",
  maxSteps: number = 12
): CondenseRequest {
  const request: CondenseRequest = {
    title,
    locale,
    maxSteps,
  };

  // 添加原始文本
  if (rawText) {
    request.rawText = rawText;
  }

  // 解析ingredients和steps为phases格式
  if (ingredients || steps) {
    const parsedIngredients = ingredients ? JSON.parse(ingredients) : [];
    const parsedSteps = steps ? JSON.parse(steps) : [];

    // 简单的phase构建（可以根据实际需求优化）
    request.phases = [
      {
        name: "制作过程",
        ingredients: Array.isArray(parsedIngredients)
          ? parsedIngredients.map((ing, index) => {
              if (typeof ing === "string") {
                return { name: ing, amount: null };
              }
              return {
                name: ing.name || ing,
                amount: ing.amount || null,
              };
            })
          : [],
        steps: Array.isArray(parsedSteps)
          ? parsedSteps.map((step, index) => ({
              order: index + 1,
              text: typeof step === "string" ? step : String(step),
            }))
          : [],
      },
    ];
  }

  return request;
}

/**
 * 计算步骤精简统计
 */
export function calculateCondenseStats(response: CondenseResponse) {
  const { originalStepCount, conciseStepCount } = response.diffMeta;
  const stepsSaved = originalStepCount - conciseStepCount;
  const savingRate =
    originalStepCount > 0
      ? ((stepsSaved / originalStepCount) * 100).toFixed(1)
      : "0";

  return {
    stepsSaved,
    savingRate: `${savingRate}%`,
    hasSignificantSaving: stepsSaved >= 3,
    confidenceLevel:
      response.diffMeta.confidence >= 0.8
        ? "high"
        : response.diffMeta.confidence >= 0.6
        ? "medium"
        : "low",
  };
}
