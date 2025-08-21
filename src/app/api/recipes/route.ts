import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { autoTag, mergeTags } from "@/lib/autoTag";
import { cleanTags } from "@/lib/tagUtils";
import { enrichRecipe } from "@/lib/enrichRecipe";

// 创建菜谱验证schema（PostgreSQL版本）
const createRecipeSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  ingredients: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sourceUrl: z.string().optional(),
  domain: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  fieldConfidence: z
    .object({
      title: z.number(),
      ingredients: z.number(),
      steps: z.number(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 解析查询参数
    const split = (k: string) => 
      searchParams.get(k)?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
    
    const search = searchParams.get("search"); // 标题搜索（向后兼容）
    const ing = split('ing');        // 原材料筛选
    const seas = split('seas');       // 调味料筛选  
    const tools = split('tools');     // 厨具筛选
    const tags = split('tags');       // 标签筛选
    const mode = searchParams.get('mode') === 'or' ? 'or' : 'and'; // 筛选模式
    const like = searchParams.get('like')?.toLowerCase() || ''; // 模糊匹配
    const q = searchParams.get('q')?.toLowerCase() || ''; // 全文搜索

    // 构建条件函数
    const buildArrayCondition = (arr: string[], field: string) => {
      if (arr.length === 0) return {};
      return mode === 'or' 
        ? { [field]: { hasSome: arr } }  // OR: 包含任意一个
        : { [field]: { hasEvery: arr } }; // AND: 包含所有
    };

    // 构建 WHERE 条件
    const andConditions: any[] = [];
    
    // 标题搜索（向后兼容）
    if (search) {
      andConditions.push({
        title: {
          contains: search,
          mode: "insensitive",
        },
      });
    }

    // 数组字段筛选
    const ingCond = buildArrayCondition(ing, 'ingredients');
    const seasCond = buildArrayCondition(seas, 'seasonings');
    const toolsCond = buildArrayCondition(tools, 'tools');
    const tagsCond = buildArrayCondition(tags, 'tags');
    
    [ingCond, seasCond, toolsCond, tagsCond].forEach(cond => {
      if (Object.keys(cond).length > 0) {
        andConditions.push(cond);
      }
    });

    // 构建最终的 WHERE 子句
    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    // 查询数据库
    let recipes = await prisma.recipe.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        domain: true,
        createdAt: true,
        ingredients: true,
        seasonings: true,
        tools: true,
        tags: true,
        parseSource: true,
        description: true,
        steps: true,
      },
    });

    // 前端模糊过滤（like 参数）
    if (like) {
      const hasLike = (xs?: string[]) => 
        (xs ?? []).some(x => x.toLowerCase().includes(like));
      
      recipes = recipes.filter(r => 
        hasLike(r.ingredients) || 
        hasLike(r.seasonings) || 
        hasLike(r.tools) || 
        hasLike(r.tags)
      );
    }

    // 全文搜索（q 参数）
    if (q) {
      const hasQ = (s?: string | null) => 
        (s ?? '').toLowerCase().includes(q);
      
      recipes = recipes.filter(r => 
        hasQ(r.title) ||
        hasQ(r.description) ||
        (r.ingredients ?? []).join(' ').toLowerCase().includes(q) ||
        (r.seasonings ?? []).join(' ').toLowerCase().includes(q) ||
        (r.steps ? JSON.stringify(r.steps).toLowerCase().includes(q) : false)
      );
    }

    return NextResponse.json({
      success: true,
      recipes,
      filters: {
        search,
        ing: ing.join(','),
        seas: seas.join(','),
        tools: tools.join(','),
        tags: tags.join(','),
        mode,
        like,
        q,
        total: recipes.length,
      },
    });
  } catch (error) {
    console.error("获取菜谱失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取菜谱失败",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createRecipeSchema.parse(body);

    // 使用 enrichRecipe 进行数据富化
    const enriched = await enrichRecipe({
      title: validatedData.title,
      rawIngredients: validatedData.ingredients,
      rawSteps: validatedData.steps,
      fallbackText: validatedData.description,
      userTags: validatedData.tags || [],
    });

    // 创建菜谱记录（使用富化后的结构化字段）
    const recipe = await prisma.recipe.create({
      data: {
        title: validatedData.title,
        imageUrl: validatedData.imageUrl || null,
        sourceUrl: validatedData.sourceUrl || `manual-${Date.now()}`,
        domain: validatedData.domain || "手动创建",
        description: validatedData.description || null,
        ingredients: enriched.ingredients, // 使用富化后的规范化食材
        seasonings: enriched.seasonings,   // 新增调味料字段
        tools: enriched.tools,             // 新增厨具字段
        steps: validatedData.steps ? { data: validatedData.steps } : undefined, // 保存为 JSON
        tags: enriched.tags,               // 使用富化后的标签
      },
    });

    console.log("菜谱创建成功:", {
      id: recipe.id,
      title: recipe.title,
      ingredients: enriched.ingredients.length,
      seasonings: enriched.seasonings.length,
      tools: enriched.tools.length,
      tags: enriched.tags.length,
    });

    return NextResponse.json({
      success: true,
      recipe,
      enriched: {
        ingredients: enriched.ingredients,
        seasonings: enriched.seasonings,
        tools: enriched.tools,
        tags: enriched.tags,
      },
      message: "菜谱创建成功！",
    });
  } catch (error) {
    console.error("创建菜谱失败:", error);

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
        error: "创建菜谱失败",
      },
      { status: 500 }
    );
  }
}
