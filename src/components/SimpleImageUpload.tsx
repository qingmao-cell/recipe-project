"use client";

import { useState, useRef } from "react";
import { compressImage, getCompressionInfo } from "@/utils/compressImage";

interface RecipeData {
  title: string;
  ingredients: Array<{
    name: string;
    amount: string | null;
  }>;
  steps: string[];
  tags: string[];
}

export default function SimpleImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<RecipeData | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }

    // 验证文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("图片文件不能超过 10MB");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setResult(null);

      console.log(`开始处理图片: ${file.name}`);
      console.log(`原始文件大小: ${(file.size / 1024).toFixed(1)}KB`);

      // 压缩图片
      const compressedBlob = await compressImage(file, 1280, 0.8);

      // 显示压缩信息
      const compressionInfo = getCompressionInfo(file, compressedBlob);
      console.log("压缩信息:", compressionInfo);

      // 上传到API
      const formData = new FormData();
      formData.append("image", compressedBlob, file.name);

      console.log("开始上传到 OCR API...");
      const response = await fetch("/api/ocr-recipe-standard", {
        method: "POST",
        body: formData,
      });

      const resultData = await response.json();

      if (!response.ok) {
        throw new Error(resultData.error || "上传失败");
      }

      console.log("🎉 OCR 识别结果:", resultData);
      setResult(resultData);
    } catch (error) {
      console.error("❌ 上传失败:", error);
      setError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          🤖 AI 菜谱识别测试
        </h2>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {/* 上传按钮 */}
        <div className="text-center mb-6">
          <button
            onClick={triggerFileSelect}
            disabled={uploading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {uploading ? "📤 识别中..." : "📸 选择图片识别菜谱"}
          </button>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            ❌ {error}
          </div>
        )}

        {/* 识别结果 */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              ✅ 识别成功！
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">菜谱名称:</h4>
                <p className="text-gray-900">{result.title}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">食材清单:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.ingredients.map((ing, index) => (
                    <li key={index} className="text-gray-900">
                      {ing.name} {ing.amount && `- ${ing.amount}`}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">制作步骤:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  {result.steps.map((step, index) => (
                    <li key={index} className="text-gray-900">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">标签:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 说明文字 */}
        <div className="mt-6 text-sm text-gray-600 space-y-2">
          <p>📱 支持手机拍照和相册选择</p>
          <p>🖼️ 支持 JPEG/PNG 格式，自动压缩至 1280px</p>
          <p>🤖 使用 OpenAI Vision 识别菜谱内容</p>
          <p>📝 识别结果会在控制台详细显示</p>
        </div>
      </div>
    </div>
  );
}
