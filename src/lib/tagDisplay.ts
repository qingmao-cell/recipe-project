/**
 * Tag display utilities for handling localized tag display
 */

import { PRESET_TAGS } from './tagUtils';

// All possible tag values (Chinese and Japanese) mapped to their keys
const ALL_TAG_MAPPINGS: Record<string, string> = {
  // Chinese translations
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
  
  // Japanese translations
  "簡単料理": "quickDish",
  "ご飯のお供": "riceFriend",
  "高タンパク": "highProtein",
  "低脂肪": "lowFat",
  "ベジタリアン": "vegetarian",
  "スープ": "soup",
  "デザート": "dessert",
  "酸っぱい": "sour",
  "辛い": "spicy",
  "しょっぱい": "salty",
  "甘い": "sweet",
  "しびれる": "numbing",
  "あっさり": "light",
  "こってり": "heavy",
  "でんぷん": "starch",
  "麺": "noodles",
  "ご飯": "rice",
  "根菜類": "roots",
  "中華鍋": "wok",
  "オーブン": "oven",
  "蒸し器": "steamer",
  "電子レンジ": "microwave",
  "炊飯器": "riceCooker",
  
  // Additional common tags that might exist in database
  "家常菜": "homeCooking",
  "川菜": "sichuanCuisine",
  "粤菜": "cantoneseCuisine",
  "江浙菜": "jiangzheCuisine",
  "嫩滑": "tender",
  "愛客菜": "guestDish",
  "传统菜": "traditionalDish",
  "健康": "healthy",
  "硬菜": "hardDish",
  "経典菜": "classicDish",
  "招牌菜": "signatureDish",
  "簡単料理": "easyDish",
  "日本料理": "japaneseCuisine",
  "中華料理": "chineseCuisine",
  "西洋料理": "westernCuisine",
  "韓国料理": "koreanCuisine",
  "タイ料理": "thaiCuisine",
  "インド料理": "indianCuisine",
  "ニンニクの芽": "garlicSprouts",
  "黄ニラ": "yellowChives",
  "もやし": "beanSprouts",
  "チンゲンサイ": "bokChoy",
  "ブロッコリー": "broccoli",
  "冬瓜": "winterMelon",
  "なす": "eggplant",
  "ニラ": "chives",
  "セロリ": "celery",
  "ほうれん草": "spinach",
  "キャベツ": "cabbage",
  "きゅうり": "cucumber",
  "トマト": "tomato",
  "ピーマン": "greenPepper",
  "玉ねぎ": "onion",
  "にんじん": "carrot",
  "じゃがいも": "potato"
};

/**
 * Get the key for a translated tag value
 */
export function getTagKey(tagValue: string): string | null {
  return ALL_TAG_MAPPINGS[tagValue] || null;
}

/**
 * Check if a tag is a preset tag (has a translation key)
 */
export function isPresetTag(tagValue: string): boolean {
  return !!ALL_TAG_MAPPINGS[tagValue];
}

/**
 * Get display value for a tag
 * If it's a preset tag stored as translated value, return the key for translation
 * Otherwise return the original value
 */
export function getTagDisplayKey(tagValue: string): { isPreset: boolean; key: string } {
  const tagKey = getTagKey(tagValue);
  if (tagKey) {
    return { isPreset: true, key: tagKey };
  }
  return { isPreset: false, key: tagValue };
}

/**
 * Process tags array for display
 * Returns array of objects with display information
 */
export function processTagsForDisplay(tags: string[]): Array<{ isPreset: boolean; key: string; original: string }> {
  return tags.map(tag => ({
    ...getTagDisplayKey(tag),
    original: tag
  }));
}