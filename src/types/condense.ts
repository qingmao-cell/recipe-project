import { z } from "zod";

// 输入类型定义
export const CondenseRequestSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  rawText: z.string().optional(),
  phases: z
    .array(
      z.object({
        name: z.string(),
        ingredients: z.array(
          z.object({
            name: z.string(),
            amount: z.string().nullable(),
          })
        ),
        steps: z.array(
          z.object({
            order: z.number(),
            text: z.string(),
          })
        ),
      })
    )
    .optional(),
  locale: z.enum(["zh", "ja"]).default("zh"),
  maxSteps: z.number().min(1).max(50).default(12),
});

// 输出类型定义
export const CondenseResponseSchema = z.object({
  concise: z.object({
    title: z.string(),
    phases: z.array(
      z.object({
        name: z.string(),
        steps: z.array(z.string()),
      })
    ),
    checklist: z.array(z.string()),
    timeline: z.array(
      z.object({
        at: z.string(),
        actions: z.array(
          z.object({
            phase: z.string(),
            step: z.number(),
            text: z.string(),
          })
        ),
      })
    ),
    warnings: z.array(z.string()),
    notes: z.array(z.string()).optional(),
  }),
  diffMeta: z.object({
    originalStepCount: z.number(),
    conciseStepCount: z.number(),
    mergeHints: z.array(z.string()),
    lostInfo: z.array(z.string()).optional(),
    confidence: z.number().min(0).max(1),
  }),
  source: z.literal("ai-condense"),
});

// TypeScript 类型导出
export type CondenseRequest = z.infer<typeof CondenseRequestSchema>;
export type CondenseResponse = z.infer<typeof CondenseResponseSchema>;

// 错误响应类型
export const CondenseErrorSchema = z.object({
  error: z.string(),
  suggest: z.string().optional(),
  reason: z.string().optional(),
});

export type CondenseError = z.infer<typeof CondenseErrorSchema>;
