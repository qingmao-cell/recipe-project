"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
// import LocaleSwitcher from "@/components/LocaleSwitcher"; // 暂时隐藏语言切换

interface Recipe {
  id: string;
  title: string;
  imageUrl: string | null;
  domain: string | null;
  createdAt: string;
  ingredients?: string[];
  seasonings?: string[];
  tools?: string[];
  tags?: string[];
  parseSource: string | null;
  description?: string | null;
}

interface FridgeItem {
  id: string;
  name: string;
  quantity: string;
  expiryDate: string | null;
}

export default function RecommendPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchData();
    // 从localStorage恢复选中状态
    const saved = localStorage.getItem("selectedIngredients");
    if (saved) {
      try {
        const savedArray = JSON.parse(saved);
        if (Array.isArray(savedArray)) {
          setSelectedIngredients(new Set(savedArray));
        }
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  // 同步选中状态到localStorage
  useEffect(() => {
    localStorage.setItem(
      "selectedIngredients",
      JSON.stringify(Array.from(selectedIngredients))
    );
  }, [selectedIngredients]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recipesRes, fridgeRes] = await Promise.all([
        fetch("/api/recipes"),
        fetch("/api/fridge"),
      ]);

      const recipesData = await recipesRes.json();
      const fridgeData = await fridgeRes.json();

      if (recipesData.success) {
        setRecipes(recipesData.recipes);
      }
      if (fridgeData.success) {
        setFridgeItems(fridgeData.items);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 随机选择菜谱
  const getRandomRecipe = () => {
    if (recipes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * recipes.length);
    return recipes[randomIndex];
  };

  // 处理随机推荐点击
  const handleRandomRecommend = () => {
    const random = getRandomRecipe();
    if (random) {
      setSelectedRecipe(random);
    } else {
      alert('暂无菜谱可推荐');
    }
  };

  // 基于食材匹配度推荐（使用新的结构化字段）
  const getRecommendationsByIngredients = () => {
    if (recipes.length === 0 || selectedIngredients.size === 0) return [];

    const selectedNames = Array.from(selectedIngredients).map((name) =>
      name.toLowerCase()
    );

    return recipes
      .map((recipe) => {
        // 合并所有相关字段进行匹配
        const allIngredients = [
          ...(recipe.ingredients || []),
          ...(recipe.seasonings || []),
        ];
        
        if (allIngredients.length === 0) return { recipe, matchRate: 0, matchScore: 0 };

        let matchCount = 0;
        let matchScore = 0;
        
        allIngredients.forEach((ingredient: string) => {
          const ingLower = ingredient.toLowerCase();
          if (
            selectedNames.some(
              (name) => ingLower.includes(name) || name.includes(ingLower)
            )
          ) {
            matchCount++;
            // 精确匹配得分更高
            if (selectedNames.includes(ingLower)) {
              matchScore += 2;
            } else {
              matchScore += 1;
            }
          }
        });

        // 额外加分：如果标签或厨具也匹配
        const allTags = recipe.tags || [];
        const allTools = recipe.tools || [];
        
        allTags.forEach((tag: string) => {
          if (selectedNames.some(name => tag.toLowerCase().includes(name))) {
            matchScore += 0.5;
          }
        });
        
        allTools.forEach((tool: string) => {
          if (selectedNames.some(name => tool.toLowerCase().includes(name))) {
            matchScore += 0.3;
          }
        });

        const matchRate =
          allIngredients.length > 0
            ? matchCount / allIngredients.length
            : 0;
        return { recipe, matchRate, matchScore };
      })
      .filter((item) => item.matchRate > 0 || item.matchScore > 0)
      .sort((a, b) => {
        // 先按匹配分数排序，再按匹配率排序
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return b.matchRate - a.matchRate;
      })
      .slice(0, 5); // 显示前5个推荐
  };

  // 切换食材选中状态
  const toggleIngredient = useCallback((name: string) => {
    setSelectedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  }, []);

  // 优化的标签按钮组件
  const TagButton = memo(
    ({
      name,
      isSelected,
      onToggle,
    }: {
      name: string;
      isSelected: boolean;
      onToggle: (name: string) => void;
    }) => (
      <button
        onClick={() => onToggle(name)}
        className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-200 ${
          isSelected
            ? "bg-orange-50 text-orange-700 border-orange-300"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        {name}
        {isSelected && <span className="ml-1">✓</span>}
      </button>
    )
  );

  TagButton.displayName = "TagButton";

  const randomRecipe = getRandomRecipe();
  const ingredientRecommendations = getRecommendationsByIngredients();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-orange-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: `url('/images/vegetables_bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}>
      <div className="container mx-auto px-4 py-8">
        {/* 语言切换 - 暂时隐藏 */}
        {/* <div className="absolute top-6 left-6 z-20">
          <LocaleSwitcher />
        </div> */}

        {/* 头部 */}
        <div className="text-center mb-12">
          <div className="inline-block bg-white/95 backdrop-blur-md rounded-2xl px-8 py-6 shadow-lg">
            <h1 className="text-4xl md:text-5xl font-bold text-orange-900 mb-4">
              今天吃什么
            </h1>
            <p className="text-lg text-orange-700">
              基于你的食材智能推荐菜谱
            </p>
          </div>

          {/* 快速操作按钮 */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button
              onClick={handleRandomRecommend}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              随机推荐
            </button>

            <Link
              href="/recipes"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full hover:from-green-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              浏览收藏
            </Link>
          </div>
        </div>

        {/* 今日推荐 */}
        {selectedRecipe && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-orange-800 mb-6 text-center">
              今日推荐
            </h2>
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="relative h-64 bg-orange-100">
                  {selectedRecipe.imageUrl ? (
                    <Image
                      src={selectedRecipe.imageUrl}
                      alt={selectedRecipe.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-orange-300">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🍽️</div>
                        <div className="text-lg">暂无图片</div>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-orange-500 text-white text-sm rounded-full">
                      随机推荐
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-orange-900 mb-3">
                    {selectedRecipe.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-orange-600 mb-4">
                    <span>来源: {selectedRecipe.domain || '未知'}</span>
                    <span>
                      {new Date(selectedRecipe.createdAt).toLocaleDateString(
                        "zh-CN"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Link
                      href={`/recipes/${selectedRecipe.id}`}
                      className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                    >
                      查看详情 →
                    </Link>
                    <button
                      onClick={() => setSelectedRecipe(null)}
                      className="px-4 py-2 text-orange-600 hover:text-orange-800 transition-colors"
                    >
                      换一个
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 基于食材的推荐 */}
        {ingredientRecommendations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-orange-800 mb-6 text-center">
              基于食材的推荐
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ingredientRecommendations.map(({ recipe, matchRate }) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-48 bg-orange-100">
                    {recipe.imageUrl ? (
                      <Image
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-orange-300">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🍽️</div>
                          <div className="text-sm">暂无图片</div>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        {Math.round(matchRate * 100)}% 匹配
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-orange-900 mb-2 line-clamp-2">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-orange-600 mb-3">
                      <span>{recipe.domain || '未知'}</span>
                      <span>
                        {Math.round(matchRate * 100)}% 匹配
                      </span>
                    </div>
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="block w-full text-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      查看菜谱
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 食材选择区域 */}
        <div className="mb-12 relative">
          {/* 顶部已选择反馈 */}
          {selectedIngredients.size > 0 && (
            <div className="mb-6 text-center relative z-10">
              <h3 className="text-base font-medium text-orange-800 mb-3">
                📋 已选择（{selectedIngredients.size}）
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from(selectedIngredients).map((name) => (
                  <TagButton
                    key={name}
                    name={name}
                    isSelected={true}
                    onToggle={toggleIngredient}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 食材选择 */}
          <div className="rounded-xl bg-white/90 backdrop-blur-sm p-6 shadow-sm space-y-6">
            {/* 蔬菜/维生素 */}
            <div>
              <h3 className="mb-2 text-green-700 font-semibold">
                🥦 蔬菜
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  '土豆',
                  '胡萝卜',
                  '洋葱',
                  '青椒',
                  '西红柿',
                  '黄瓜',
                  '包菜',
                  '菠菜',
                  '芹菜',
                  '韭菜',
                  '茄子',
                  '冬瓜',
                  '西兰花',
                  '菜心',
                  '小白菜',
                  '豆芽菜',
                  '韭黄',
                  '蒜苗',
                ].map((name) => (
                  <TagButton
                    key={name}
                    name={name}
                    isSelected={selectedIngredients.has(name)}
                    onToggle={toggleIngredient}
                  />
                ))}
              </div>
            </div>

            {/* 蛋白质 */}
            <div>
              <h3 className="mb-2 text-red-700 font-semibold">🥩 蛋白质</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  '鸡蛋',
                  '鸡肉',
                  '猪肉',
                  '牛肉',
                  '鱼肉',
                  '虾仁',
                  '豆腐',
                  '牵奶',
                  '豆干',
                  '香肠',
                  '培根',
                  '火腿',
                ].map((name) => (
                  <TagButton
                    key={name}
                    name={name}
                    isSelected={selectedIngredients.has(name)}
                    onToggle={toggleIngredient}
                  />
                ))}
              </div>
            </div>

            {/* 淀粉/主食 */}
            <div>
              <h3 className="mb-2 text-yellow-700 font-semibold">
                🍚 主食
              </h3>
              <div className="flex flex-wrap gap-2">
                {['米饭', '面条', '面包', '方便面', '馁头', '饺子', '年糕'].map(
                  (name) => (
                    <TagButton
                      key={name}
                      name={name}
                      isSelected={selectedIngredients.has(name)}
                      onToggle={toggleIngredient}
                    />
                  )
                )}
              </div>
            </div>

            {/* 调味 */}
            <div>
              <h3 className="mb-2 text-purple-700 font-semibold">🧂 调味料</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  '大蒜',
                  '生姜',
                  '大葱',
                  '生抽',
                  '盐',
                  '糖',
                  '醉',
                  '料酒',
                  '辣椒',
                  '花椒',
                  '八角',
                  '桂皮',
                  '香菜',
                ].map((name) => (
                  <TagButton
                    key={name}
                    name={name}
                    isSelected={selectedIngredients.has(name)}
                    onToggle={toggleIngredient}
                  />
                ))}
              </div>
            </div>

            {/* 厨具 */}
            <div>
              <h3 className="mb-2 text-gray-700 font-semibold">🍳 厨具</h3>
              <div className="flex flex-wrap gap-2">
                {['烒锅', '蒸锅', '烤箱', '微波炉', '电饭煯', '空气炸锅'].map(
                  (name) => (
                    <TagButton
                      key={name}
                      name={name}
                      isSelected={selectedIngredients.has(name)}
                      onToggle={toggleIngredient}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 来看看组合出的菜谱吧！ */}
        {selectedIngredients.size > 0 && (
          <div className="text-center py-12">
            <div className="inline-block bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-sm">
              <div className="text-6xl mb-4">👨‍🍳</div>
              <h3 className="text-xl font-medium text-orange-800 mb-4">
                来看看组合出的菜谱吧！
              </h3>
              <p className="text-orange-600">
                {ingredientRecommendations.length > 0
                  ? `找到 ${ingredientRecommendations.length} 道相关菜谱`
                  : '试试选择更多食材吧！'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
