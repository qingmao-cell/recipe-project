"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface DynamicField {
  id: string;
  value: string;
}

export default function CreateRecipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 基础字段
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  // 动态数组字段
  const [ingredients, setIngredients] = useState<DynamicField[]>([
    { id: "1", value: "" }
  ]);
  const [seasonings, setSeasonings] = useState<DynamicField[]>([
    { id: "1", value: "" }
  ]);
  const [tools, setTools] = useState<DynamicField[]>([
    { id: "1", value: "" }
  ]);
  const [tags, setTags] = useState<DynamicField[]>([
    { id: "1", value: "" }
  ]);
  
  // 步骤（多行文本）
  const [steps, setSteps] = useState("");
  
  // 获取所有已有标签用于自动补全
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // 从 OCR 或其他来源加载数据
  useEffect(() => {
    const from = searchParams.get("from");
    if (from === "ocr") {
      const ocrData = sessionStorage.getItem("ocrRecipeData");
      if (ocrData) {
        try {
          const data = JSON.parse(ocrData);
          setTitle(data.title || "");
          setIngredients(
            data.ingredients?.length > 0
              ? data.ingredients.map((v: string, i: number) => ({ id: String(i + 1), value: v }))
              : [{ id: "1", value: "" }]
          );
          setSeasonings(
            data.seasonings?.length > 0
              ? data.seasonings.map((v: string, i: number) => ({ id: String(i + 1), value: v }))
              : [{ id: "1", value: "" }]
          );
          setTools(
            data.tools?.length > 0
              ? data.tools.map((v: string, i: number) => ({ id: String(i + 1), value: v }))
              : [{ id: "1", value: "" }]
          );
          setTags(
            data.tags?.length > 0
              ? data.tags.map((v: string, i: number) => ({ id: String(i + 1), value: v }))
              : [{ id: "1", value: "" }]
          );
          setSteps(Array.isArray(data.steps) ? data.steps.join("\n") : data.steps || "");
          
          // 清除 sessionStorage
          sessionStorage.removeItem("ocrRecipeData");
        } catch (e) {
          console.error("Failed to parse OCR data:", e);
        }
      }
    }
  }, [searchParams]);

  // 获取已有标签
  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.recipes) {
          const allTags = new Set<string>();
          data.recipes.forEach((recipe: any) => {
            if (Array.isArray(recipe.tags)) {
              recipe.tags.forEach((tag: string) => allTags.add(tag));
            }
          });
          setAvailableTags(Array.from(allTags).sort());
        }
      })
      .catch((err) => console.error("Failed to fetch tags:", err));
  }, []);

  // 动态字段管理函数
  const addField = (
    fields: DynamicField[],
    setFields: React.Dispatch<React.SetStateAction<DynamicField[]>>
  ) => {
    const newId = String(Math.max(...fields.map((f) => parseInt(f.id))) + 1);
    setFields([...fields, { id: newId, value: "" }]);
  };

  const removeField = (
    id: string,
    fields: DynamicField[],
    setFields: React.Dispatch<React.SetStateAction<DynamicField[]>>
  ) => {
    if (fields.length > 1) {
      setFields(fields.filter((f) => f.id !== id));
    }
  };

  const updateField = (
    id: string,
    value: string,
    fields: DynamicField[],
    setFields: React.Dispatch<React.SetStateAction<DynamicField[]>>
  ) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, value } : f)));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("请输入菜谱名称");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 过滤空值
      const filteredIngredients = ingredients
        .map((f) => f.value.trim())
        .filter(Boolean);
      const filteredSeasonings = seasonings
        .map((f) => f.value.trim())
        .filter(Boolean);
      const filteredTools = tools.map((f) => f.value.trim()).filter(Boolean);
      const filteredTags = tags.map((f) => f.value.trim()).filter(Boolean);
      const stepsArray = steps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim() || null,
          ingredients: filteredIngredients,
          steps: stepsArray,
          tags: filteredTags,
          // 这些会在后端通过 enrichRecipe 自动填充
          // seasonings 和 tools 会从 ingredients 和 steps 中提取
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/recipes");
      } else {
        throw new Error(data.error || "创建失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-800 text-center mb-2">
            创建新菜谱
          </h1>
          <p className="text-center text-orange-600">
            填写菜谱信息，系统会自动识别和补充相关标签
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基础信息卡片 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-orange-700 mb-4">
              基础信息
            </h2>
            
            {/* 标题 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                菜谱名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="例如：青椒土豆丝"
                required
              />
            </div>

            {/* 描述 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                菜谱描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="简单描述这道菜的特色..."
                rows={2}
              />
            </div>

            {/* 图片链接 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图片链接
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="https://example.com/image.jpg（可选）"
              />
            </div>
          </div>

          {/* 食材配料卡片 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-orange-700 mb-4">
              食材配料
            </h2>

            {/* 原材料 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                原材料
              </label>
              <div className="space-y-2">
                {ingredients.map((field) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) =>
                        updateField(field.id, e.target.value, ingredients, setIngredients)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="例如：土豆、青椒、鸡肉"
                    />
                    <button
                      type="button"
                      onClick={() => removeField(field.id, ingredients, setIngredients)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={ingredients.length === 1}
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addField(ingredients, setIngredients)}
                  className="px-4 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  + 添加原材料
                </button>
              </div>
            </div>

            {/* 调味料 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                调味料
              </label>
              <div className="space-y-2">
                {seasonings.map((field) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) =>
                        updateField(field.id, e.target.value, seasonings, setSeasonings)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="例如：盐、生抽、糖"
                    />
                    <button
                      type="button"
                      onClick={() => removeField(field.id, seasonings, setSeasonings)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={seasonings.length === 1}
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addField(seasonings, setSeasonings)}
                  className="px-4 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  + 添加调味料
                </button>
              </div>
            </div>

            {/* 厨具 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                厨具
              </label>
              <div className="space-y-2">
                {tools.map((field) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) =>
                        updateField(field.id, e.target.value, tools, setTools)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="例如：炒锅、蒸锅、烤箱"
                    />
                    <button
                      type="button"
                      onClick={() => removeField(field.id, tools, setTools)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={tools.length === 1}
                    >
                      删除
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addField(tools, setTools)}
                  className="px-4 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  + 添加厨具
                </button>
              </div>
            </div>
          </div>

          {/* 制作步骤卡片 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-orange-700 mb-4">
              制作步骤
            </h2>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="每行一个步骤，例如：&#10;1. 土豆去皮切丝&#10;2. 青椒洗净切丝&#10;3. 热锅放油..."
              rows={8}
            />
          </div>

          {/* 标签卡片 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-orange-700 mb-4">
              标签
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              系统会自动识别营养成分、口味等标签，你也可以手动添加
            </p>
            <div className="space-y-2">
              {tags.map((field) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) =>
                      updateField(field.id, e.target.value, tags, setTags)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="例如：家常菜、快手菜、下饭菜"
                    list={`tag-suggestions-${field.id}`}
                  />
                  <datalist id={`tag-suggestions-${field.id}`}>
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={() => removeField(field.id, tags, setTags)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={tags.length === 1}
                  >
                    删除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addField(tags, setTags)}
                className="px-4 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                + 添加标签
              </button>
            </div>
            
            {/* 显示可用标签 */}
            {availableTags.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">常用标签（点击添加）：</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 20).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        // 找到第一个空的标签字段，或添加新字段
                        const emptyField = tags.find((f) => !f.value.trim());
                        if (emptyField) {
                          updateField(emptyField.id, tag, tags, setTags);
                        } else {
                          const newId = String(Math.max(...tags.map((f) => parseInt(f.id))) + 1);
                          setTags([...tags, { id: newId, value: tag }]);
                        }
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
            >
              {loading ? "创建中..." : "创建菜谱"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}