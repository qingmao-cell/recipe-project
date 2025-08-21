/**
 * 标签工具函数 - PostgreSQL String[] 版本
 */

/**
 * 标签标准化映射表
 */
const TAG_NORMALIZATION_MAP: Record<string, string> = {
  维生素: "维生素",
  蔬菜: "维生素",
  蛋白: "蛋白质",
  高蛋白: "蛋白质",
  主食: "淀粉",
  淀粉: "淀粉",
  米饭: "淀粉",
  面条: "淀粉",
  炸物: "炸物",
  酸: "酸",
  辣: "辣",
  咸: "咸",
  甜: "甜",
  快手菜: "快手菜",
  // 可继续补充同义词
};

/**
 * 标准化标签数组
 * @param input 原始标签数组
 * @returns 标准化后的标签数组
 */
export function normalizeTags(input: string[] = []): string[] {
  const normalized = input
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => TAG_NORMALIZATION_MAP[s] ?? s);

  return Array.from(new Set(normalized));
}

/**
 * 安全解析标签（兼容旧的JSON格式和新的数组格式）
 * @param s 标签数据（可能是JSON字符串或数组）
 * @returns 标签数组
 */
export function parseTags(s?: string | string[] | null): string[] {
  if (!s) return [];

  // 如果已经是数组，直接返回
  if (Array.isArray(s)) {
    return s.filter((tag) => typeof tag === "string" && tag.trim().length > 0);
  }

  // 兼容旧的JSON字符串格式
  if (typeof s === "string") {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (tag) => typeof tag === "string" && tag.trim().length > 0
        );
      }
      return [];
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * 清理并标准化标签数组
 * @param arr 标签数组
 * @returns 清理后的标签数组
 */
export function cleanTags(arr: string[]): string[] {
  if (!Array.isArray(arr)) return [];

  // 去重、去空、排序
  const cleanTags = [...new Set(arr)]
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .sort();

  return normalizeTags(cleanTags);
}

/**
 * 格式化标签数组为JSON字符串（向后兼容）
 * @param arr 标签数组
 * @returns 格式化后的JSON字符串
 */
export function stringifyTags(arr: string[]): string {
  return JSON.stringify(cleanTags(arr));
}

/**
 * 预设标签分类 - 使用key值，由组件负责翻译
 */
export const PRESET_TAGS = {
  // 场景/心情
  scenario: ["quickDish", "riceFriend", "highProtein", "lowFat", "vegetarian", "soup", "dessert"],
  // 风味
  flavor: ["sour", "spicy", "salty", "sweet", "numbing", "light", "heavy"],
  // 主食/能量  
  staple: ["stapleFood", "starch", "noodles", "rice", "roots"],
  // 厨具
  cookware: ["wok", "oven", "steamer", "microwave", "riceCooker"],
};

/**
 * 原始中文标签映射（保持向后兼容）
 */
export const CHINESE_TAG_MAP: Record<string, string> = {
  "快手菜": "quickDish",
  "下饭菜": "riceFriend",
  "高蛋白": "highProtein",
  "低脂": "lowFat",
  "素食": "vegetarian",
  "汤": "soup",
  "甜品": "dessert",
  "酸": "sour",
  "辣": "spicy",
  "咸": "salty",
  "甜": "sweet",
  "麻": "numbing",
  "清淡": "light",
  "重口": "heavy",
  "主食": "stapleFood",
  "淀粉": "starch",
  "面": "noodles",
  "米饭": "rice",
  "根茎类": "roots",
  "炒锅": "wok",
  "烤箱": "oven",
  "蒸锅": "steamer",
  "微波炉": "microwave",
  "电饭煲": "riceCooker",
};

/**
 * 获取所有预设标签
 */
export function getAllPresetTags(): string[] {
  return Object.values(PRESET_TAGS).flat();
}
