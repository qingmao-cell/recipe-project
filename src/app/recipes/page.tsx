"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Fuse from "fuse.js";
import { useTranslations, useLocale } from "next-intl";
import { parseTags } from "@/lib/tagUtils";
import { TagListDisplay, TagDisplay } from "@/components/TagDisplay";

interface Recipe {
  id: string;
  title: string;
  imageUrl: string | null;
  domain: string | null;
  createdAt: string;
  ingredients?: string[];
  seasonings?: string[];
  tools?: string[];
  tags: string[] | null;
  parseSource: string | null;
  description?: string | null;
  steps?: any;
}

function RecipeCard({ recipe, locale }: { recipe: Recipe; locale: string }) {
  const [imageError, setImageError] = useState(false);
  const t = useTranslations('RecipeList');

  // 占位插画列表 - 前端运行时随机选择
  const placeholders = [
    "/placeholders/cat.jpg",
    "/placeholders/dog.jpg",
    "/placeholders/curry.jpg",
    "/placeholders/fan.jpg",
    "/placeholders/cai.JPG",
  ];

  // 随机选择占位插画
  const getRandomPlaceholder = () => {
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  };

  // 确定最终显示的图片源
  const imageSrc =
    recipe.imageUrl && !imageError ? recipe.imageUrl : getRandomPlaceholder();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getTags = () => {
    // 支持新的PostgreSQL String[]格式
    if (Array.isArray(recipe.tags)) {
      return recipe.tags;
    }
    // 向后兼容旧的JSON字符串格式
    return parseTags(recipe.tags);
  };

  const getParseSourceLabel = () => {
    switch (recipe.parseSource) {
      case "jsonld":
        return { label: "结构化", color: "bg-green-100 text-green-800" };
      case "microdata":
        return { label: "元数据", color: "bg-blue-100 text-blue-800" };
      case "readability":
        return { label: "智能解析", color: "bg-purple-100 text-purple-800" };
      case "ai-refine":
        return { label: "AI优化", color: "bg-orange-100 text-orange-800" };
      case "fallback":
        return { label: "基础解析", color: "bg-gray-100 text-gray-800" };
      default:
        return null;
    }
  };

  const hasAIRefine = getTags().includes("ai_refined");
  const parseSourceInfo = getParseSourceLabel();

  return (
    <Link href={`/${locale}/recipes/${recipe.id}`}>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden cursor-pointer h-84">
        {/* 图片 */}
        <div className="relative h-48 bg-orange-100">
          {/* 解析来源徽章 */}
          {parseSourceInfo && (
            <div className="absolute top-3 left-3 z-10">
              <span
                className={`px-2 py-1 text-xs rounded-full ${parseSourceInfo.color}`}
                title={`解析方式: ${parseSourceInfo.label}${
                  hasAIRefine ? " (AI增强)" : ""
                }`}
              >
                {parseSourceInfo.label}
              </span>
            </div>
          )}

          {/* AI增强徽章 */}
          {hasAIRefine && (
            <div className="absolute top-3 right-3 z-10">
              <span
                className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs rounded-full flex items-center gap-1"
                title="内容经过AI智能优化"
              >
                🤖 AI
              </span>
            </div>
          )}

          {/* 图片显示 */}
          <Image
            src={imageSrc}
            alt={recipe.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        </div>

        {/* 内容 */}
        <div className="p-6 h-36 flex flex-col">
          <h3 className="text-lg font-medium text-orange-900 mb-2 line-clamp-2 h-12">
            {recipe.title}
          </h3>

          <div className="flex items-center justify-between text-sm text-orange-600 mb-3">
            <span>来源: {recipe.domain || "未知"}</span>
            <span>{formatDate(recipe.createdAt)}</span>
          </div>

          {/* 标签 */}
          {getTags().length > 0 && (
            <TagListDisplay 
              tags={getTags()} 
              maxItems={3}
              className="mt-auto"
            />
          )}
        </div>
      </div>
    </Link>
  );
}

export default function RecipesPage() {
  const t = useTranslations('RecipeList');
  const tDetail = useTranslations('RecipeDetail');
  const tIngredients = useTranslations('Ingredients');
  const locale = useLocale();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedSeasonings, setSelectedSeasonings] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"and" | "or">("and");
  const [error, setError] = useState("");

  // 使用 Fuse.js 创建搜索索引
  const fuse = useMemo(() => {
    return new Fuse(recipes, {
      includeScore: true,
      keys: [
        { name: "title", weight: 0.5 },
        { name: "ingredients", weight: 0.3 },
        { name: "seasonings", weight: 0.15 },
        { name: "tools", weight: 0.1 },
        { name: "tags", weight: 0.2 },
        { name: "description", weight: 0.1 },
      ],
      threshold: 0.35, // 模糊强度，0.0 严格 ~ 1.0 宽松
      ignoreLocation: true,
      minMatchCharLength: 1,
      useExtendedSearch: true,
    });
  }, [recipes]);

  useEffect(() => {
    fetchRecipes();
    // 从URL参数中读取筛选条件
    const urlParams = new URLSearchParams(window.location.search);
    const tagsParam = urlParams.get("tags");
    const ingParam = urlParams.get("ing");
    const seasParam = urlParams.get("seas");
    const toolsParam = urlParams.get("tools");
    const modeParam = urlParams.get("mode");
    const searchParam = urlParams.get("q");

    if (tagsParam) setSelectedTags(tagsParam.split(","));
    if (ingParam) setSelectedIngredients(ingParam.split(","));
    if (seasParam) setSelectedSeasonings(seasParam.split(","));
    if (toolsParam) setSelectedTools(toolsParam.split(","));
    if (modeParam === "or") setFilterMode("or");
    if (searchParam) setSearchTerm(searchParam);
  }, []);

  const fetchRecipes = async (filters?: {
    search?: string;
    ing?: string[];
    seas?: string[];
    tools?: string[];
    tags?: string[];
    mode?: string;
    q?: string;
  }) => {
    try {
      setLoading(true);

      // 构建查询参数
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.ing && filters.ing.length > 0)
        params.append("ing", filters.ing.join(","));
      if (filters?.seas && filters.seas.length > 0)
        params.append("seas", filters.seas.join(","));
      if (filters?.tools && filters.tools.length > 0)
        params.append("tools", filters.tools.join(","));
      if (filters?.tags && filters.tags.length > 0)
        params.append("tags", filters.tags.join(","));
      if (filters?.mode) params.append("mode", filters.mode);
      if (filters?.q) params.append("q", filters.q);

      const url = `/api/recipes${
        params.toString() ? "?" + params.toString() : ""
      }`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setRecipes(data.recipes);
      } else {
        setError(t('noRecipes'));
      }
    } catch (error) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有可用的选项（使用原始数据，不受筛选影响）
  const [allOptions, setAllOptions] = useState<{
    ingredients: string[];
    seasonings: string[];
    tools: string[];
    tags: string[];
  }>({ ingredients: [], seasonings: [], tools: [], tags: [] });

  // 初始化时获取所有选项
  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.recipes) {
          const allIngredients = new Set<string>();
          const allSeasonings = new Set<string>();
          const allTools = new Set<string>();
          const allTags = new Set<string>();

          data.recipes.forEach((recipe: Recipe) => {
            recipe.ingredients?.forEach((ing) => allIngredients.add(ing));
            recipe.seasonings?.forEach((seas) => allSeasonings.add(seas));
            recipe.tools?.forEach((tool) => allTools.add(tool));
            const tags = Array.isArray(recipe.tags)
              ? recipe.tags
              : parseTags(recipe.tags);
            tags.forEach((tag) => allTags.add(tag));
          });

          setAllOptions({
            ingredients: Array.from(allIngredients).sort(),
            seasonings: Array.from(allSeasonings).sort(),
            tools: Array.from(allTools).sort(),
            tags: Array.from(allTags).sort(),
          });
        }
      })
      .catch((err) => console.error("Failed to fetch all options:", err));
  }, []);

  // 前端模糊搜索 + 筛选
  const filteredRecipes = useMemo(() => {
    let result = recipes;

    // 先进行模糊搜索
    if (searchTerm) {
      const searchResult = fuse.search(searchTerm);
      result = searchResult.map((item) => item.item);
    }

    // 再进行精确筛选（前端补充，主要依赖后端）
    const hasFilters =
      selectedIngredients.length > 0 ||
      selectedSeasonings.length > 0 ||
      selectedTools.length > 0 ||
      selectedTags.length > 0;

    if (hasFilters && filterMode === "and") {
      // AND 模式：必须包含所有选中项
      result = result.filter((recipe) => {
        const ingMatch =
          selectedIngredients.length === 0 ||
          selectedIngredients.every((ing) =>
            recipe.ingredients?.includes(ing)
          );
        const seasMatch =
          selectedSeasonings.length === 0 ||
          selectedSeasonings.every((seas) =>
            recipe.seasonings?.includes(seas)
          );
        const toolsMatch =
          selectedTools.length === 0 ||
          selectedTools.every((tool) => recipe.tools?.includes(tool));
        const tagsMatch =
          selectedTags.length === 0 ||
          selectedTags.every((tag) => {
            const recipeTags = Array.isArray(recipe.tags)
              ? recipe.tags
              : parseTags(recipe.tags);
            return recipeTags.includes(tag);
          });

        return ingMatch && seasMatch && toolsMatch && tagsMatch;
      });
    }

    return result;
  }, [recipes, searchTerm, selectedIngredients, selectedSeasonings, selectedTools, selectedTags, filterMode, fuse]);

  // 切换选项
  const toggleOption = (
    type: "ingredients" | "seasonings" | "tools" | "tags",
    value: string
  ) => {
    // 根据类型更新对应的选中状态
    switch (type) {
      case "ingredients":
        setSelectedIngredients(prev => {
          const newSelection = prev.includes(value)
            ? prev.filter(item => item !== value)
            : [...prev, value];
          
          // 延迟更新URL和获取数据
          setTimeout(() => {
            const params = new URLSearchParams();
            if (searchTerm) params.append("q", searchTerm);
            if (newSelection.length > 0) params.append("ing", newSelection.join(","));
            if (selectedSeasonings.length > 0) params.append("seas", selectedSeasonings.join(","));
            if (selectedTools.length > 0) params.append("tools", selectedTools.join(","));
            if (selectedTags.length > 0) params.append("tags", selectedTags.join(","));
            if (filterMode === "or") params.append("mode", "or");
            
            window.history.pushState({}, "", `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`);
            
            fetchRecipes({
              q: searchTerm,
              ing: newSelection,
              seas: selectedSeasonings,
              tools: selectedTools,
              tags: selectedTags,
              mode: filterMode,
            });
          }, 0);
          
          return newSelection;
        });
        break;
        
      case "seasonings":
        setSelectedSeasonings(prev => {
          const newSelection = prev.includes(value)
            ? prev.filter(item => item !== value)
            : [...prev, value];
          
          setTimeout(() => {
            const params = new URLSearchParams();
            if (searchTerm) params.append("q", searchTerm);
            if (selectedIngredients.length > 0) params.append("ing", selectedIngredients.join(","));
            if (newSelection.length > 0) params.append("seas", newSelection.join(","));
            if (selectedTools.length > 0) params.append("tools", selectedTools.join(","));
            if (selectedTags.length > 0) params.append("tags", selectedTags.join(","));
            if (filterMode === "or") params.append("mode", "or");
            
            window.history.pushState({}, "", `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`);
            
            fetchRecipes({
              q: searchTerm,
              ing: selectedIngredients,
              seas: newSelection,
              tools: selectedTools,
              tags: selectedTags,
              mode: filterMode,
            });
          }, 0);
          
          return newSelection;
        });
        break;
        
      case "tools":
        setSelectedTools(prev => {
          const newSelection = prev.includes(value)
            ? prev.filter(item => item !== value)
            : [...prev, value];
          
          setTimeout(() => {
            const params = new URLSearchParams();
            if (searchTerm) params.append("q", searchTerm);
            if (selectedIngredients.length > 0) params.append("ing", selectedIngredients.join(","));
            if (selectedSeasonings.length > 0) params.append("seas", selectedSeasonings.join(","));
            if (newSelection.length > 0) params.append("tools", newSelection.join(","));
            if (selectedTags.length > 0) params.append("tags", selectedTags.join(","));
            if (filterMode === "or") params.append("mode", "or");
            
            window.history.pushState({}, "", `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`);
            
            fetchRecipes({
              q: searchTerm,
              ing: selectedIngredients,
              seas: selectedSeasonings,
              tools: newSelection,
              tags: selectedTags,
              mode: filterMode,
            });
          }, 0);
          
          return newSelection;
        });
        break;
        
      case "tags":
        setSelectedTags(prev => {
          const newSelection = prev.includes(value)
            ? prev.filter(item => item !== value)
            : [...prev, value];
          
          setTimeout(() => {
            const params = new URLSearchParams();
            if (searchTerm) params.append("q", searchTerm);
            if (selectedIngredients.length > 0) params.append("ing", selectedIngredients.join(","));
            if (selectedSeasonings.length > 0) params.append("seas", selectedSeasonings.join(","));
            if (selectedTools.length > 0) params.append("tools", selectedTools.join(","));
            if (newSelection.length > 0) params.append("tags", newSelection.join(","));
            if (filterMode === "or") params.append("mode", "or");
            
            window.history.pushState({}, "", `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`);
            
            fetchRecipes({
              q: searchTerm,
              ing: selectedIngredients,
              seas: selectedSeasonings,
              tools: selectedTools,
              tags: newSelection,
              mode: filterMode,
            });
          }, 0);
          
          return newSelection;
        });
        break;
    }
  };


  // 清除所有筛选
  const clearAllFilters = () => {
    setSelectedIngredients([]);
    setSelectedSeasonings([]);
    setSelectedTools([]);
    setSelectedTags([]);
    setSearchTerm("");
  };

  // 更新URL并获取数据（使用当前状态的引用）
  const updateURLAndFetch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("q", searchTerm);
    if (selectedIngredients.length > 0)
      params.append("ing", selectedIngredients.join(","));
    if (selectedSeasonings.length > 0)
      params.append("seas", selectedSeasonings.join(","));
    if (selectedTools.length > 0)
      params.append("tools", selectedTools.join(","));
    if (selectedTags.length > 0)
      params.append("tags", selectedTags.join(","));
    if (filterMode === "or") params.append("mode", "or");

    // 更新URL（不刷新页面）
    const newUrl = `${window.location.pathname}${
      params.toString() ? "?" + params.toString() : ""
    }`;
    window.history.pushState({}, "", newUrl);

    // 获取新数据
    fetchRecipes({
      q: searchTerm,
      ing: selectedIngredients,
      seas: selectedSeasonings,
      tools: selectedTools,
      tags: selectedTags,
      mode: filterMode,
    });
  }, [searchTerm, selectedIngredients, selectedSeasonings, selectedTools, selectedTags, filterMode]);

  const hasActiveFilters =
    selectedIngredients.length > 0 ||
    selectedSeasonings.length > 0 ||
    selectedTools.length > 0 ||
    selectedTags.length > 0 ||
    searchTerm.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-orange-600">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-light text-orange-800 mb-4">
            {t('title')}
          </h1>
          <p className="text-orange-600">
            {t('totalRecipes', { count: recipes.length })}
          </p>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          {/* 搜索框 */}
          <div className="mb-6">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // 实时搜索（防抖处理可以后续优化）
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateURLAndFetch();
                }
              }}
              className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* 筛选模式切换 */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-gray-600">{t('filterMode')}:</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterMode("and");
                  updateURLAndFetch();
                }}
                className={`px-3 py-1 text-sm rounded-full ${
                  filterMode === "and"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                AND
              </button>
              <button
                onClick={() => {
                  setFilterMode("or");
                  updateURLAndFetch();
                }}
                className={`px-3 py-1 text-sm rounded-full ${
                  filterMode === "or"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                OR
              </button>
            </div>
          </div>

          {/* 筛选选项 */}
          <div className="space-y-4">
            {/* 食材筛选 */}
            {allOptions.ingredients.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {t('ingredients')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allOptions.ingredients.slice(0, 20).map((ing) => {
                    // Try to translate ingredient name, fallback to original
                    let displayName = ing;
                    try {
                      const translated = tIngredients(ing as any);
                      if (translated && !translated.startsWith('Ingredients.')) {
                        displayName = translated;
                      }
                    } catch {
                      // Keep original name if translation fails
                    }
                    return (
                      <button
                        key={ing}
                        onClick={() => toggleOption("ingredients", ing)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedIngredients.includes(ing)
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 调味料筛选 */}
            {allOptions.seasonings.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {t('seasonings')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allOptions.seasonings.slice(0, 15).map((seas) => {
                    // Try to translate seasoning name, fallback to original
                    let displayName = seas;
                    try {
                      const translated = tIngredients(seas as any);
                      if (translated && !translated.startsWith('Ingredients.')) {
                        displayName = translated;
                      }
                    } catch {
                      // Keep original name if translation fails
                    }
                    return (
                      <button
                        key={seas}
                        onClick={() => toggleOption("seasonings", seas)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedSeasonings.includes(seas)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 厨具筛选 */}
            {allOptions.tools.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {t('tools')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allOptions.tools.map((tool) => {
                    // Try to translate tool name, fallback to original
                    let displayName = tool;
                    try {
                      const translated = tIngredients(tool as any);
                      if (translated && !translated.startsWith('Ingredients.')) {
                        displayName = translated;
                      }
                    } catch {
                      // Keep original name if translation fails
                    }
                    return (
                      <button
                        key={tool}
                        onClick={() => toggleOption("tools", tool)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          selectedTools.includes(tool)
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 标签筛选 */}
            {allOptions.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {t('tags')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allOptions.tags.slice(0, 20).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleOption("tags", tag)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <TagDisplay tag={tag} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 清除筛选按钮 */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('clearAllFilters')}
              </button>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-orange-700">
            {hasActiveFilters && (
              <span>{t('foundRecipes', { count: filteredRecipes.length })}</span>
            )}
          </div>
          <div className="flex gap-4">
            <Link href={`/${locale}/recipes/create`}>
              <button className="px-6 py-3 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-full hover:from-orange-500 hover:to-amber-500 transition-all duration-300 shadow-md hover:shadow-lg">
                ✨ {t('createRecipe')}
              </button>
            </Link>
          </div>
        </div>

        {/* 菜谱列表 */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-orange-600 text-xl">
              {hasActiveFilters
                ? t('noMatchingRecipes')
                : t('noRecipesYet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} locale={locale} />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}