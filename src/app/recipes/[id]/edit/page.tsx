"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TagEditor from "@/components/TagEditor";
import { parseTags, stringifyTags } from "@/lib/tagUtils";

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
}

export default function RecipeEditPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 编辑状态
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [tags, setTags] = useState<string[]>([]);
  const [fieldConfidence, setFieldConfidence] = useState<{
    title: number;
    ingredients: number;
    steps: number;
  } | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchRecipe(params.id as string);
    }
  }, [params.id]);

  const fetchRecipe = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recipes/${id}`);
      const data = await response.json();

      if (data.success) {
        const recipe = data.recipe;
        setRecipe(recipe);
        setTitle(recipe.title);
        setDescription(recipe.description || "");

        // 解析JSON数据
        try {
          setIngredients(
            recipe.ingredients ? JSON.parse(recipe.ingredients) : [""]
          );
        } catch {
          setIngredients([""]);
        }

        try {
          setSteps(recipe.steps ? JSON.parse(recipe.steps) : [""]);
        } catch {
          setSteps([""]);
        }

        // 使用工具函数解析标签
        setTags(parseTags(recipe.tags));
      } else {
        setError("菜谱不存在");
      }
    } catch (error) {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("标题不能为空");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/recipes/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          ingredients:
            ingredients.filter((i) => i.trim()).length > 0
              ? JSON.stringify(ingredients.filter((i) => i.trim()))
              : null,
          steps:
            steps.filter((s) => s.trim()).length > 0
              ? JSON.stringify(steps.filter((s) => s.trim()))
              : null,
          tags: tags.length > 0 ? stringifyTags(tags) : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/recipes/${params.id}`);
      } else {
        setError(data.error || "保存失败");
      }
    } catch (error) {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 处理标签变化
  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
  };

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

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-orange-900 mb-4">
              菜谱不存在
            </h1>
            <Link
              href="/recipes"
              className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
            >
              返回菜谱列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-orange-900">编辑菜谱</h1>
          <Link
            href={`/recipes/${params.id}`}
            className="px-4 py-2 text-orange-600 hover:text-orange-800 transition-colors"
          >
            ← 返回详情
          </Link>
        </div>

        {/* 编辑表单 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* 标题 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="输入菜谱标题"
            />
          </div>

          {/* 描述 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="输入菜谱描述（可选）"
            />
          </div>

          {/* 标签编辑器 */}
          <div className="mb-6">
            <TagEditor tags={tags} onChange={handleTagsChange} />
          </div>

          {/* 食材 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              食材
            </label>
            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={`食材 ${index + 1}`}
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="px-4 py-3 text-red-600 hover:text-red-800 transition-colors"
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="w-full px-4 py-3 border-2 border-dashed border-orange-300 text-orange-600 hover:border-orange-400 hover:text-orange-700 transition-colors rounded-lg"
              >
                + 添加食材
              </button>
            </div>
          </div>

          {/* 步骤 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              步骤
            </label>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <textarea
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    rows={2}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={`步骤 ${index + 1}`}
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="px-4 py-3 text-red-600 hover:text-red-800 transition-colors"
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addStep}
                className="w-full px-4 py-3 border-2 border-dashed border-orange-300 text-orange-600 hover:border-orange-400 hover:text-orange-700 transition-colors rounded-lg"
              >
                + 添加步骤
              </button>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-300 transition-colors"
            >
              {saving ? "保存中..." : "保存菜谱"}
            </button>
            <Link
              href={`/recipes/${params.id}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </Link>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
