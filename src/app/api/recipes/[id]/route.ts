import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 更新菜谱的验证schema
const updateRecipeSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().nullable().optional(),
  ingredients: z.string().nullable().optional(),
  steps: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
    });

    if (!recipe) {
      return NextResponse.json(
        {
          success: false,
          error: "菜谱不存在",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      recipe,
    });
  } catch (error) {
    console.error("获取菜谱详情失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取菜谱详情失败",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateRecipeSchema.parse(body);

    // 检查菜谱是否存在
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: params.id },
    });

    if (!existingRecipe) {
      return NextResponse.json(
        {
          success: false,
          error: "菜谱不存在",
        },
        { status: 404 }
      );
    }

    // 更新菜谱
    const updatedRecipe = await prisma.recipe.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        // ingredients: validatedData.ingredients,
        // steps: validatedData.steps,
        // tags: validatedData.tags,
        updatedAt: new Date(),
      },
    });

    console.log("菜谱更新成功:", updatedRecipe.id, updatedRecipe.title);

    return NextResponse.json({
      success: true,
      recipe: updatedRecipe,
      message: "菜谱更新成功！",
    });
  } catch (error) {
    console.error("更新菜谱失败:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.errors[0].message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "更新菜谱失败",
      },
      { status: 500 }
    );
  }
}
