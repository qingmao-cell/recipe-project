import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 获取冰箱食材列表
export async function GET() {
  try {
    const items = await prisma.fridgeItem.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("获取冰箱食材失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取食材失败",
      },
      { status: 500 }
    );
  }
}

// 添加食材到冰箱
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, quantity, expiryDate } = body;

    if (!name || !quantity) {
      return NextResponse.json(
        {
          success: false,
          error: "食材名称和数量不能为空",
        },
        { status: 400 }
      );
    }

    const item = await prisma.fridgeItem.create({
      data: {
        name,
        quantity,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      item,
      message: "食材添加成功",
    });
  } catch (error) {
    console.error("添加食材失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "添加食材失败",
      },
      { status: 500 }
    );
  }
}

// 更新食材信息
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, quantity, expiryDate } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "食材ID不能为空",
        },
        { status: 400 }
      );
    }

    const item = await prisma.fridgeItem.update({
      where: { id },
      data: {
        name,
        quantity,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      item,
      message: "食材更新成功",
    });
  } catch (error) {
    console.error("更新食材失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "更新食材失败",
      },
      { status: 500 }
    );
  }
}

// 删除食材
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "食材ID不能为空",
        },
        { status: 400 }
      );
    }

    await prisma.fridgeItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "食材删除成功",
    });
  } catch (error) {
    console.error("删除食材失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "删除食材失败",
      },
      { status: 500 }
    );
  }
}



