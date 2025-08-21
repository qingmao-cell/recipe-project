"use client";

import Link from "next/link";
import { ENABLE_LABS } from "@/lib/supabase";

export default function LabPage() {
  if (!ENABLE_LABS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-orange-900 mb-4">
            实验室未开放
          </h1>
          <p className="text-orange-600 mb-6">实验室功能当前未启用。</p>
          <Link
            href="/"
            className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const labFeatures = [
    {
      title: "🚀 菜谱生成器",
      description: "一键生成20道常见菜谱，包含完整的食材、步骤和标签",
      href: "/generate-recipes",
      status: "stable",
    },
    {
      title: "🧠 AI菜谱助手",
      description: "使用AI智能整理和优化菜谱内容",
      href: "/test-ai",
      status: "experimental",
    },
    {
      title: "📱 OCR菜谱识别",
      description: "拍照识别菜谱，自动提取食材和步骤",
      href: "/test-ocr",
      status: "experimental",
    },
    {
      title: "🍽️ 餐饮管理",
      description: "高级餐饮规划和营养分析功能",
      href: "/meals",
      status: "beta",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "stable":
        return "px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full";
      case "beta":
        return "px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full";
      case "experimental":
        return "px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full";
      default:
        return "px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* 头部 */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🧪</div>
            <h1 className="text-4xl font-bold text-orange-900 mb-4">实验室</h1>
            <p className="text-lg text-orange-700 mb-8">
              探索最新的菜谱管理功能和AI实验性特性
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/"
                className="px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
              >
                ← 返回首页
              </Link>
              <Link
                href="/recipes"
                className="px-6 py-3 border border-orange-300 text-orange-700 rounded-full hover:bg-orange-100 transition-colors"
              >
                查看菜谱收藏
              </Link>
            </div>
          </div>

          {/* 功能列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {labFeatures.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-orange-900 group-hover:text-orange-700 transition-colors">
                      {feature.title}
                    </h3>
                    <span className={getStatusBadge(feature.status)}>
                      {feature.status}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-orange-600 group-hover:text-orange-700 transition-colors">
                    <span className="text-sm font-medium">探索功能</span>
                    <span className="ml-2 transform group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 警告信息 */}
          <div className="mt-12 bg-orange-100 border border-orange-300 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                  实验性功能说明
                </h3>
                <p className="text-orange-700 text-sm leading-relaxed">
                  实验室中的功能仍在开发和测试阶段，可能存在不稳定或不完整的情况。
                  使用这些功能时请注意保存重要数据，并随时向我们反馈问题和建议。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



