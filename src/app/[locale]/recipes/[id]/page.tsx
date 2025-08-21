"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { CondenseResponse } from "@/types/condense";
import {
  buildCondenseRequest,
  calculateCondenseStats,
} from "@/lib/normalizeCondense";
import { parseTags } from "@/lib/tagUtils";
import { TagListDisplay } from "@/components/TagDisplay";

interface Recipe {
  id: string;
  title: string;
  imageUrl: string | null;
  sourceUrl: string;
  domain: string | null;
  description: string | null;
  ingredients: string | null;
  steps: string | null;
  tags: string | null;
  createdAt: string;
}

export default function RecipeDetailPage() {
  const params = useParams();
  const t = useTranslations('RecipeDetail');
  const locale = useLocale();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [viewMode, setViewMode] = useState<"original" | "concise">("original");
  const [condensedData, setCondensedData] = useState<CondenseResponse | null>(
    null
  );
  const [condensing, setCondensing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchRecipe(params.id as string);
    }
  }, [params.id]);

  const fetchRecipe = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/recipes/${id}`);
      const data = await response.json();
      if (data.success) {
        setRecipe(data.recipe);
      } else {
        setError(data.error || "获取菜谱详情失败");
      }
    } catch (err) {
      setError("网络错误，无法获取菜谱详情");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 获取标签
  const getTags = (): string[] => {
    return parseTags(recipe?.tags);
  };

  // AI整理菜谱
  const condenseRecipe = async () => {
    if (!recipe || condensing) return;

    try {
      setCondensing(true);

      const request = buildCondenseRequest(
        recipe.title,
        recipe.ingredients || undefined,
        recipe.steps || undefined,
        recipe.description || undefined,
        "zh",
        12
      );

      console.log("发送AI整理请求:", request);

      const response = await fetch("/api/recipe/condense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI整理失败");
      }

      setCondensedData(result);
      setViewMode("concise");

      console.log("AI整理成功:", result);
    } catch (error) {
      console.error("AI整理失败:", error);
      setError(error instanceof Error ? error.message : "AI整理失败");
    } finally {
      setCondensing(false);
    }
  };

  const getIngredients = (): string[] => {
    if (!recipe?.ingredients) return [];
    // ingredients is already an array from PostgreSQL
    if (Array.isArray(recipe.ingredients)) {
      return recipe.ingredients;
    }
    // Fallback for old JSON string format
    try {
      return JSON.parse(recipe.ingredients);
    } catch {
      return [];
    }
  };

  const getSteps = (): string[] => {
    if (!recipe?.steps) return [];
    // steps is stored as JSON type in PostgreSQL
    if (Array.isArray(recipe.steps)) {
      return recipe.steps;
    }
    if (typeof recipe.steps === 'object' && recipe.steps !== null) {
      // Handle structured steps format
      if (recipe.steps.steps) {
        return recipe.steps.steps;
      }
      // Handle array-like object
      return Object.values(recipe.steps);
    }
    // Fallback for string format
    if (typeof recipe.steps === 'string') {
      try {
        const parsed = JSON.parse(recipe.steps);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (parsed.steps) {
          return parsed.steps;
        }
        return [];
      } catch {
        return [];
      }
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍳</div>
          <div className="text-xl text-orange-800">正在加载菜谱...</div>
        </div>
      </div>
    );
  }

  if (error && !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <Link
            href="/recipes"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full"
          >
            返回菜谱列表
          </Link>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 头部信息 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="md:flex">
              <div className="md:w-1/2">
                <div className="relative h-64 md:h-full bg-orange-100">
                  {recipe.imageUrl && !imageError ? (
                    <Image
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-orange-300">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🍽️</div>
                        <div className="text-lg">暂无图片</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:w-1/2 p-6 md:p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  {recipe.title}
                </h1>

                {recipe.description && (
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {recipe.description}
                  </p>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">🌐</span>
                    <span>{recipe.domain || "未知来源"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">📅</span>
                    <span>收藏于 {formatDate(recipe.createdAt)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full transition-colors"
                  >
                    查看原文 ↗
                  </a>

                  <button
                    onClick={condenseRecipe}
                    disabled={condensing}
                    className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-6 py-2 rounded-full transition-colors"
                  >
                    {condensing ? "🤖 AI整理中..." : "🤖 AI精简"}
                  </button>
                </div>

                {getTags().length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {t('tags')}
                    </h4>
                    <TagListDisplay 
                      tags={getTags()}
                      itemClassName="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full border border-orange-200 hover:bg-orange-200 hover:scale-105 transition-all duration-200 cursor-pointer"
                    />
                  </div>
                )}

                {/* 视图切换 */}
                {condensedData && (
                  <div className="mt-6 flex bg-orange-50 rounded-full p-1">
                    <button
                      onClick={() => setViewMode("original")}
                      className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                        viewMode === "original"
                          ? "bg-orange-500 text-white shadow-sm"
                          : "text-orange-600 hover:text-orange-700"
                      }`}
                    >
                      📄 原文
                    </button>
                    <button
                      onClick={() => setViewMode("concise")}
                      className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                        viewMode === "concise"
                          ? "bg-orange-500 text-white shadow-sm"
                          : "text-orange-600 hover:text-orange-700"
                      }`}
                    >
                      🤖 AI精简
                      {(() => {
                        const stats = calculateCondenseStats(condensedData);
                        return stats.hasSignificantSaving ? (
                          <span className="ml-1 text-xs">
                            (-{stats.stepsSaved}步)
                          </span>
                        ) : null;
                      })()}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* 内容区域 */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* 精简视图 */}
            {viewMode === "concise" && condensedData ? (
              <>
                {/* 警告信息 */}
                {condensedData.concise.warnings.length > 0 && (
                  <div className="md:col-span-3 mb-6">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                      <h3 className="text-lg font-medium text-red-900 mb-3 flex items-center">
                        ⚠️ 安全提醒
                      </h3>
                      <ul className="space-y-2">
                        {condensedData.concise.warnings.map(
                          (warning, index) => (
                            <li
                              key={index}
                              className="text-red-700 flex items-start"
                            >
                              <span className="text-red-500 mr-2">•</span>
                              {warning}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 备料清单 */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-medium text-orange-900 mb-4 flex items-center">
                      📝 备料清单
                    </h2>
                    {condensedData.concise.checklist.length > 0 ? (
                      <ul className="space-y-2">
                        {condensedData.concise.checklist.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">AI未生成备料清单</p>
                    )}
                  </div>
                </div>

                {/* 精简步骤 */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-medium text-orange-900 mb-4 flex items-center">
                      🤖 AI精简步骤
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {condensedData.diffMeta.conciseStepCount}步
                      </span>
                    </h2>

                    {condensedData.concise.phases.map((phase, phaseIndex) => (
                      <div key={phaseIndex} className="mb-6 last:mb-0">
                        <h3 className="text-lg font-medium text-orange-800 mb-3 border-l-4 border-orange-400 pl-3">
                          {phase.name}
                        </h3>
                        <ol className="space-y-3">
                          {phase.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start">
                              <span className="bg-orange-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                {stepIndex + 1}
                              </span>
                              <span className="text-gray-700 leading-relaxed">
                                {step}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 时间线 */}
                {condensedData.concise.timeline.length > 0 && (
                  <div className="md:col-span-3 mt-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <h2 className="text-xl font-medium text-orange-900 mb-4 flex items-center">
                        ⏱️ 并行时间线
                      </h2>
                      <div className="space-y-4">
                        {condensedData.concise.timeline.map(
                          (timeEntry, index) => (
                            <div
                              key={index}
                              className="border-l-4 border-blue-400 pl-4"
                            >
                              <h4 className="font-medium text-blue-800 mb-2">
                                {timeEntry.at}
                              </h4>
                              <div className="space-y-1">
                                {timeEntry.actions.map(
                                  (action, actionIndex) => (
                                    <div
                                      key={actionIndex}
                                      className="text-gray-700 text-sm"
                                    >
                                      <span className="text-blue-600 font-medium">
                                        {action.phase}
                                      </span>
                                      <span className="mx-2">
                                        步骤{action.step}
                                      </span>
                                      <span>{action.text}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 小贴士 */}
                {condensedData.concise.notes &&
                  condensedData.concise.notes.length > 0 && (
                    <div className="md:col-span-3">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                        <h3 className="text-lg font-medium text-yellow-900 mb-3 flex items-center">
                          💡 小贴士
                        </h3>
                        <ul className="space-y-2">
                          {condensedData.concise.notes.map((note, index) => (
                            <li
                              key={index}
                              className="text-yellow-800 flex items-start"
                            >
                              <span className="text-yellow-600 mr-2">💡</span>
                              {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
              </>
            ) : (
              /* 原始视图 */
              <>
                {/* 配料 */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-medium text-orange-900 mb-4 flex items-center">
                      🥬 配料清单
                    </h2>
                    {getIngredients().length > 0 ? (
                      <ul className="space-y-2">
                        {getIngredients().map(
                          (ingredient: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-orange-400 rounded-full mr-3 flex-shrink-0"></span>
                              <span className="text-gray-700">
                                {ingredient}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-orange-500 text-center py-8">
                        暂无配料信息
                      </p>
                    )}
                  </div>
                </div>

                {/* 制作步骤 */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-medium text-orange-900 mb-4 flex items-center">
                      👩‍🍳 制作步骤
                    </h2>
                    {getSteps().length > 0 ? (
                      <ol className="space-y-4">
                        {getSteps().map((step: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="bg-orange-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              {index + 1}
                            </span>
                            <div className="flex-1 text-orange-700 pt-1">
                              {(() => {
                                // 确保 step 是字符串
                                const stepText = String(step || '');
                                
                                // 检查是否包含编号格式（如 1. 2. 或 1、2、等）
                                const numberedPattern = /(?:^|\n)(?:\d+[\.、。]|第[一二三四五六七八九十\d]+步)/;
                                
                                if (numberedPattern.test(stepText)) {
                                  // 如果包含编号，按编号分割
                                  const subSteps = stepText.split(/(?=\d+[\.、。]|第[一二三四五六七八九十\d]+步)/g);
                                  
                                  return (
                                    <div className="space-y-2">
                                      {subSteps.map((subStep, idx) => {
                                        const trimmed = subStep.trim();
                                        if (!trimmed) return null;
                                        return (
                                          <div key={idx} className="text-orange-700">
                                            {trimmed}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                } else {
                                  // 如果没有编号，直接显示
                                  return <span className="whitespace-pre-wrap">{stepText}</span>;
                                }
                              })()}
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-orange-500 text-center py-8">
                        暂无制作步骤
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 底部操作 */}
          <div className="mt-8 text-center">
            <Link
              href="/recipes"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full transition-colors inline-block"
            >
              返回菜谱列表
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
