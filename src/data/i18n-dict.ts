// 食材、调味料、厨具、标签的中日文映射字典

type DictGroup = 'ingredients' | 'seasonings' | 'tools' | 'tags';
type Locale = 'zh' | 'ja';

interface I18nDict {
  ingredients: Record<string, { zh: string; ja: string }>;
  seasonings: Record<string, { zh: string; ja: string }>;
  tools: Record<string, { zh: string; ja: string }>;
  tags: Record<string, { zh: string; ja: string }>;
}

export const i18nDict: I18nDict = {
  // 食材
  ingredients: {
    // 肉类
    '五花肉': { zh: '五花肉', ja: '豚バラ肉' },
    '猪肉': { zh: '猪肉', ja: '豚肉' },
    '牛肉': { zh: '牛肉', ja: '牛肉' },
    '鸡肉': { zh: '鸡肉', ja: '鶏肉' },
    '鸡胸肉': { zh: '鸡胸肉', ja: '鶏むね肉' },
    '排骨': { zh: '排骨', ja: 'スペアリブ' },
    '牛肉末': { zh: '牛肉末', ja: '牛ひき肉' },
    
    // 蔬菜
    '土豆': { zh: '土豆', ja: 'じゃがいも' },
    '青椒': { zh: '青椒', ja: 'ピーマン' },
    '番茄': { zh: '番茄', ja: 'トマト' },
    '西兰花': { zh: '西兰花', ja: 'ブロッコリー' },
    '黄瓜': { zh: '黄瓜', ja: 'きゅうり' },
    '胡萝卜': { zh: '胡萝卜', ja: 'にんじん' },
    '木耳': { zh: '木耳', ja: 'きくらげ' },
    '笋丝': { zh: '笋丝', ja: '筍の細切り' },
    '韭菜': { zh: '韭菜', ja: 'ニラ' },
    
    // 主食
    '面条': { zh: '面条', ja: '麺' },
    '面粉': { zh: '面粉', ja: '小麦粉' },
    
    // 蛋奶
    '鸡蛋': { zh: '鸡蛋', ja: '卵' },
    '牛奶': { zh: '牛奶', ja: '牛乳' },
    
    // 豆制品
    '豆腐': { zh: '豆腐', ja: '豆腐' },
    
    // 海鲜
    '鲈鱼': { zh: '鲈鱼', ja: 'スズキ' },
    
    // 其他
    '花生': { zh: '花生', ja: 'ピーナッツ' },
    '花生米': { zh: '花生米', ja: '落花生' },
    '冰糖': { zh: '冰糖', ja: '氷砂糖' },
  },

  // 调味料
  seasonings: {
    // 基础调味
    '盐': { zh: '盐', ja: '塩' },
    '糖': { zh: '糖', ja: '砂糖' },
    '醋': { zh: '醋', ja: '酢' },
    '生抽': { zh: '生抽', ja: '薄口醤油' },
    '老抽': { zh: '老抽', ja: '濃口醤油' },
    '料酒': { zh: '料酒', ja: '料理酒' },
    '蒸鱼豉油': { zh: '蒸鱼豉油', ja: '蒸し魚醤油' },
    '香油': { zh: '香油', ja: 'ごま油' },
    
    // 香料
    '葱': { zh: '葱', ja: 'ねぎ' },
    '姜': { zh: '姜', ja: '生姜' },
    '蒜': { zh: '蒜', ja: 'にんにく' },
    '大葱': { zh: '大葱', ja: '長ねぎ' },
    '生姜': { zh: '生姜', ja: '生姜' },
    '大蒜': { zh: '大蒜', ja: 'にんにく' },
    '花椒': { zh: '花椒', ja: '花椒' },
    '八角': { zh: '八角', ja: '八角' },
    '桂皮': { zh: '桂皮', ja: 'シナモン' },
    '干辣椒': { zh: '干辣椒', ja: '乾燥唐辛子' },
    '辣椒': { zh: '辣椒', ja: '唐辛子' },
    
    // 酱料
    '豆瓣酱': { zh: '豆瓣酱', ja: '豆板醤' },
    '辣椒油': { zh: '辣椒油', ja: 'ラー油' },
    
    // 其他
    '淀粉': { zh: '淀粉', ja: '片栗粉' },
  },

  // 厨具
  tools: {
    '炒锅': { zh: '炒锅', ja: '中華鍋' },
    '蒸锅': { zh: '蒸锅', ja: '蒸し器' },
    '汤锅': { zh: '汤锅', ja: 'スープ鍋' },
    '砂锅': { zh: '砂锅', ja: '土鍋' },
    '烤箱': { zh: '烤箱', ja: 'オーブン' },
    '菜刀': { zh: '菜刀', ja: '包丁' },
  },

  // 标签
  tags: {
    // 营养
    '蛋白质': { zh: '蛋白质', ja: 'タンパク質' },
    '维生素': { zh: '维生素', ja: 'ビタミン' },
    '淀粉': { zh: '淀粉', ja: 'でんぷん' },
    '脂肪': { zh: '脂肪', ja: '脂肪' },
    
    // 口味
    '酸': { zh: '酸', ja: '酸味' },
    '甜': { zh: '甜', ja: '甘味' },
    '辣': { zh: '辣', ja: '辛味' },
    '咸': { zh: '咸', ja: '塩味' },
    '鲜': { zh: '鲜', ja: 'うま味' },
    '麻': { zh: '麻', ja: '痺れ' },
    '清淡': { zh: '清淡', ja: 'あっさり' },
    '嫩滑': { zh: '嫩滑', ja: 'なめらか' },
    
    // 菜系
    '家常菜': { zh: '家常菜', ja: '家庭料理' },
    '川菜': { zh: '川菜', ja: '四川料理' },
    '粤菜': { zh: '粤菜', ja: '広東料理' },
    '江浙菜': { zh: '江浙菜', ja: '江浙料理' },
    '传统菜': { zh: '传统菜', ja: '伝統料理' },
    
    // 类型
    '快手菜': { zh: '快手菜', ja: '時短料理' },
    '下饭菜': { zh: '下饭菜', ja: 'ご飯のおかず' },
    '硬菜': { zh: '硬菜', ja: 'メイン料理' },
    '宴客菜': { zh: '宴客菜', ja: 'おもてなし料理' },
    '素食': { zh: '素食', ja: 'ベジタリアン' },
    '主食': { zh: '主食', ja: '主食' },
    '凉菜': { zh: '凉菜', ja: '前菜' },
    '蒸菜': { zh: '蒸菜', ja: '蒸し料理' },
    '招牌菜': { zh: '招牌菜', ja: '看板料理' },
    '经典菜': { zh: '经典菜', ja: 'クラシック' },
    
    // 其他
    '健康': { zh: '健康', ja: 'ヘルシー' },
    '营养': { zh: '营养', ja: '栄養豊富' },
    '夏日': { zh: '夏日', ja: '夏向き' },
    '清爽': { zh: '清爽', ja: 'さっぱり' },
    
    // 系统标签
    'ai_refined': { zh: 'AI优化', ja: 'AI最適化' },
  },
};

/**
 * 获取指定组和键的本地化标签
 * @param group - 字典组（ingredients/seasonings/tools/tags）
 * @param key - 标准键
 * @param locale - 语言（zh/ja）
 * @returns 本地化的标签文本
 */
export function labelOf(group: DictGroup, key: string, locale: Locale): string {
  const dict = i18nDict[group];
  const entry = dict[key];
  
  if (!entry) {
    // 如果没有找到映射，返回原始键
    return key;
  }
  
  return entry[locale] || key;
}

/**
 * 批量转换标签
 * @param group - 字典组
 * @param keys - 标准键数组
 * @param locale - 语言
 * @returns 本地化的标签数组
 */
export function labelsOf(group: DictGroup, keys: string[], locale: Locale): string[] {
  return keys.map(key => labelOf(group, key, locale));
}

/**
 * 获取所有可用的标签键
 * @param group - 字典组
 * @returns 所有标准键数组
 */
export function getKeys(group: DictGroup): string[] {
  return Object.keys(i18nDict[group]);
}

/**
 * 检查键是否存在于字典中
 * @param group - 字典组
 * @param key - 标准键
 * @returns 是否存在
 */
export function hasKey(group: DictGroup, key: string): boolean {
  return key in i18nDict[group];
}