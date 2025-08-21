"use client";

import { useState } from "react";
import Link from "next/link";

export default function GenerateRecipesPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const generateRecipes = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/recipes/seed", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
      } else {
        setError(data.error || "生成失败");
      }
    } catch (error) {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-orange-900 mb-6">
            一键生成菜谱
          </h1>

          <p className="text-lg text-orange-700 mb-8">
            点击下面的按钮，系统会自动生成20道常见菜谱，包含完整的食材、步骤和标签。
            这样你就不用手动录入菜谱了！
          </p>

          <div className="space-y-6">
            <button
              onClick={generateRecipes}
              disabled={loading}
              className="px-8 py-4 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:bg-orange-300 transition-colors text-lg font-medium"
            >
              {loading ? "生成中..." : "🚀 生成20道菜谱"}
            </button>

            {message && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {message}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="pt-8">
              <Link
                href="/recipes"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                查看菜谱列表 →
              </Link>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold text-orange-900 mb-4">
              包含的菜谱类型
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-orange-800 mb-2">家常菜</h4>
                <ul className="space-y-1">
                  <li>• 番茄炒蛋</li>
                  <li>• 蛋炒饭</li>
                  <li>• 青椒土豆丝</li>
                  <li>• 红烧茄子</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-orange-800 mb-2">硬菜</h4>
                <ul className="space-y-1">
                  <li>• 红烧肉</li>
                  <li>• 宫保鸡丁</li>
                  <li>• 糖醋里脊</li>
                  <li>• 水煮鱼</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



