/**
 * 自动标签生成工具
 * 基于菜谱的标题、食材和步骤自动生成相关标签
 */

import { normalizeTags } from "./tagUtils";

export interface AutoTagInput {
  title?: string;
  ingredients?: string[] | string | null;
  steps?: string[] | string | null;
}

/**
 * 自动生成标签
 * @param input 菜谱信息
 * @returns 生成的标签数组
 */
export function autoTag({ title, ingredients, steps }: AutoTagInput): string[] {
  // 将所有文本合并
  const text = [
    title ?? "",
    Array.isArray(ingredients) ? ingredients.join("，") : ingredients ?? "",
    Array.isArray(steps) ? steps.join("，") : steps ?? "",
  ]
    .join("。")
    .toLowerCase();

  const tags: string[] = [];

  // 场景标签
  const stepCount = Array.isArray(steps)
    ? steps.length
    : String(steps || "")
        .split(/[。\.]/)
        .filter((s) => s.trim()).length;

  if (stepCount <= 5) {
    tags.push("快手菜");
  }

  // 营养类型标签（粗粒度）
  // 维生素类（蔬菜）
  if (
    /(菠菜|西兰花|番茄|黄瓜|生菜|青椒|彩椒|胡萝卜|白菜|卷心菜|韭菜|芹菜|豆芽|冬瓜|丝瓜|茄子|土豆|洋葱|蒜|姜)/.test(
      text
    )
  ) {
    tags.push("维生素");
  }

  // 蛋白质类
  if (
    /(鸡胸|鸡肉|猪肉|牛肉|羊肉|鱼|虾|蟹|豆腐|鸡蛋|牛奶|酸奶|豆浆|腐竹|豆皮|肉丝|肉片|排骨|五花肉)/.test(
      text
    )
  ) {
    tags.push("蛋白质");
  }

  // 淀粉类（主食）
  if (
    /(米饭|米|面条|面|土豆|马铃薯|红薯|年糕|馒头|面包|包子|饺子|意面|粉丝|粉条|燕麦|小米|玉米)/.test(
      text
    )
  ) {
    tags.push("淀粉");
  }

  // 风味标签
  if (/(醋|柠檬|酸菜|酸辣|山楂|酸梅)/.test(text)) {
    tags.push("酸");
  }

  if (/(辣椒|花椒|麻辣|小米辣|青椒|红椒|胡椒|芥末|咖喱)/.test(text)) {
    tags.push("辣");
  }

  if (/(糖|蜂蜜|甜味|冰糖|红糖|白糖|枣|水果|苹果|香蕉|草莓)/.test(text)) {
    tags.push("甜");
  }

  if (/(盐|咸|腌|酱油|生抽|老抽|味精|鸡精)/.test(text)) {
    tags.push("咸");
  }

  // 厨具标签
  if (/(烤箱|空气炸|焗|烘烤|烤制)/.test(text)) {
    tags.push("烤箱");
  }

  if (/(蒸|蒸锅|蒸箱|蒸蛋|蒸鱼)/.test(text)) {
    tags.push("蒸锅");
  }

  if (/(微波|微波炉)/.test(text)) {
    tags.push("微波炉");
  }

  if (/(炒|炒锅|起锅|热锅|爆炒|小炒)/.test(text)) {
    tags.push("炒锅");
  }

  if (/(煮|炖|焖|煲|砂锅|电饭煲|高压锅)/.test(text)) {
    tags.push("煮锅");
  }

  // 特殊类型标签
  if (/(汤|汤水|清汤|浓汤|骨头汤)/.test(text)) {
    tags.push("汤");
  }

  if (/(素|素食|无肉|蔬菜)/.test(text) && !/(肉|鱼|虾|蛋|奶)/.test(text)) {
    tags.push("素食");
  }

  if (/(油炸|炸|油炸|炸鸡|炸鱼|炸虾)/.test(text)) {
    tags.push("炸物");
  }

  if (/(凉拌|凉菜|冷菜|沙拉)/.test(text)) {
    tags.push("凉菜");
  }

  if (/(下饭|配饭|拌饭)/.test(text)) {
    tags.push("下饭菜");
  }

  if (/(低脂|减肥|健身|轻食)/.test(text)) {
    tags.push("低脂");
  }

  if (/(甜品|甜点|蛋糕|布丁|果冻|冰淇淋)/.test(text)) {
    tags.push("甜品");
  }

  // 清理并标准化标签
  return normalizeTags(tags);
}

/**
 * 合并用户标签和自动生成的标签
 * @param userTags 用户手动添加的标签
 * @param autoTags 自动生成的标签
 * @returns 合并后的标签数组
 */
export function mergeTags(
  userTags: string[] = [],
  autoTags: string[] = []
): string[] {
  const combined = [...userTags, ...autoTags];
  return normalizeTags(combined);
}




