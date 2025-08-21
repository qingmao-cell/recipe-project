import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 菜谱数据结构验证
const RecipeSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, "食材名称不能为空"),
      amount: z.string().nullable(),
    })
  ),
  steps: z.array(z.string()),
  tags: z.array(z.string()),
  confidence: z.number().min(0).max(1).optional(),
});

type RecipeData = z.infer<typeof RecipeSchema>;

interface FieldConfidence {
  title: number;
  ingredients: number;
  steps: number;
}

// 计算字段置信度
function calculateFieldConfidence(data: RecipeData): FieldConfidence {
  return {
    title: 0.8,
    ingredients: 0.6,
    steps: 0.7,
  };
}

// 模拟图片识别 - 返回测试数据
function simulateImageRecognition(fileName: string): RecipeData {
  // 根据文件名和时间生成不同的测试数据
  const recipes = [
    {
      title: "红烧肉",
      ingredients: [
        { name: "五花肉", amount: "500g" },
        { name: "冰糖", amount: "30g" },
        { name: "生抽", amount: "2勺" },
        { name: "老抽", amount: "1勺" },
        { name: "料酒", amount: "1勺" },
      ],
      steps: [
        "五花肉洗净切块，冷水下锅焯水",
        "热锅下肉块煸炒出油",
        "加入冰糖炒糖色",
        "倒入生抽、老抽、料酒调色",
        "加开水没过肉块，大火烧开转小火炖40分钟",
        "大火收汁即可",
      ],
      tags: ["红烧菜", "家常菜", "下饭菜"],
      confidence: 0.9,
    },
    {
      title: "番茄鸡蛋面",
      ingredients: [
        { name: "面条", amount: "200g" },
        { name: "鸡蛋", amount: "2个" },
        { name: "番茄", amount: "2个" },
        { name: "葱花", amount: "适量" },
        { name: "盐", amount: "适量" },
      ],
      steps: [
        "番茄切块，鸡蛋打散",
        "热锅炒鸡蛋盛起",
        "下番茄块炒出汁水",
        "加水煮开，下面条",
        "面条熟后加入鸡蛋，调味即可",
      ],
      tags: ["面食", "快手菜", "营养"],
      confidence: 0.85,
    },
    {
      title: "蒜蓉西兰花",
      ingredients: [
        { name: "西兰花", amount: "1个" },
        { name: "大蒜", amount: "4瓣" },
        { name: "生抽", amount: "1勺" },
        { name: "盐", amount: "适量" },
        { name: "油", amount: "适量" },
      ],
      steps: [
        "西兰花洗净切小朵，焯水备用",
        "大蒜切末爆香",
        "下西兰花翻炒",
        "调入生抽和盐炒匀即可",
      ],
      tags: ["素菜", "清淡", "健康"],
      confidence: 0.8,
    },
    {
      title: "可乐鸡翅",
      ingredients: [
        { name: "鸡翅", amount: "8个" },
        { name: "可乐", amount: "1罐" },
        { name: "生抽", amount: "2勺" },
        { name: "姜片", amount: "3片" },
        { name: "盐", amount: "少许" },
      ],
      steps: [
        "鸡翅洗净打花刀，焯水去腥",
        "热锅煎鸡翅至两面金黄",
        "倒入可乐没过鸡翅",
        "加生抽和姜片大火烧开",
        "转小火焖煮15分钟收汁即可",
      ],
      tags: ["荤菜", "下饭菜", "甜味"],
      confidence: 0.9,
    },
  ];

  // 根据文件名哈希和时间选择不同菜谱
  const hash = fileName.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const index = (hash + Math.floor(Date.now() / 10000)) % recipes.length;
  return recipes[index];
}

export async function POST(request: NextRequest) {
  try {
    console.log("测试OCR API 被调用");

    // 解析上传的文件
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: "未找到图片文件",
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        {
          success: false,
          error: "不支持的文件类型，请上传图片",
        },
        { status: 400 }
      );
    }

    console.log("接收到图片文件:", imageFile.name, "大小:", imageFile.size);

    // 模拟处理时间
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 生成测试数据
    const result = simulateImageRecognition(imageFile.name);
    const fieldConfidence = calculateFieldConfidence(result);

    console.log("模拟识别成功:", {
      title: result.title,
      ingredientsCount: result.ingredients.length,
      stepsCount: result.steps.length,
      fieldConfidence,
    });

    return NextResponse.json({
      data: result,
      source: "test-simulation",
      cacheHit: false,
      fieldConfidence,
    });
  } catch (error) {
    console.error("测试OCR API 错误:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "数据格式验证失败: " + error.errors[0].message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
