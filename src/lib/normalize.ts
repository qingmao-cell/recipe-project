/**
 * 菜谱数据规范化工具
 */

import { canonical, macroCategory, flavorHints } from "@/data/lexicons";

/**
 * 规范化单个项目
 */
const normOne = (m: Map<string, string>, s: string): string => {
  const key = s.trim().toLowerCase();
  for (const [k, v] of m) {
    if (k.toLowerCase() === key) return v;
  }
  return s.trim();
};

/**
 * 规范化列表（食材、调味料、厨具）
 */
export function normalizeList(
  raw: string[] | string | null | undefined,
  dict: Map<string, string>
): string[] {
  const arr = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
    ? raw.split(/[，,;；\n]/).map((s) => s.trim())
    : [];

  const cleaned = arr.filter(Boolean).map((s) => normOne(dict, s));

  return Array.from(new Set(cleaned));
}

/**
 * 根据食材推导宏观营养标签
 */
export function deriveMacroTags(ingredients: string[]): string[] {
  const tags: string[] = [];

  if (ingredients.some((i) => macroCategory.vitamin.has(i))) {
    tags.push("维生素");
  }
  if (ingredients.some((i) => macroCategory.protein.has(i))) {
    tags.push("蛋白质");
  }
  if (ingredients.some((i) => macroCategory.starch.has(i))) {
    tags.push("淀粉");
  }

  return tags;
}

/**
 * 根据文本和步骤数量推导风味标签
 */
export function deriveFlavorTags(text: string, stepsCount: number): string[] {
  const tags: string[] = [];

  // 快手菜判断
  if (stepsCount > 0 && stepsCount <= flavorHints.quickStepsMax) {
    tags.push("快手菜");
  }

  // 风味判断
  if (flavorHints.acid.test(text)) tags.push("酸");
  if (flavorHints.spicy.test(text)) tags.push("辣");
  if (flavorHints.sweet.test(text)) tags.push("甜");
  if (flavorHints.salty.test(text)) tags.push("咸");

  return tags;
}

/**
 * 合并并去重标签数组
 */
export function mergeTags(...tagArrays: string[][]): string[] {
  const allTags = tagArrays.flat();
  return Array.from(new Set(allTags)).filter(Boolean);
}

/**
 * 清理标签数组（去空、去重、排序）
 */
export function cleanTags(tags: string[]): string[] {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .sort();
}




