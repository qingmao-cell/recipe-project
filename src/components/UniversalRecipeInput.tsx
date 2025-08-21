"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { compressImage, getCompressionInfo } from "@/utils/compressImage";

interface UniversalRecipeInputProps {
  onSuccess?: (recipeId: string) => void;
  onError?: (error: string) => void;
}

interface OCRResult {
  data?: {
    title: string;
    ingredients: { name: string; amount: string | null }[];
    steps: string[];
    tags: string[];
    confidence?: number;
  };
  source: "vision" | "ocr+llm" | "test-simulation";
  cacheHit: boolean;
  fieldConfidence: {
    title: number;
    ingredients: number;
    steps: number;
  };
  error?: string;
}

export default function UniversalRecipeInput({
  onSuccess,
  onError,
}: UniversalRecipeInputProps) {
  const [inputType, setInputType] = useState<"url" | "image">("url");

  // URL 相关状态
  const [url, setUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);

  // 图片相关状态
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 通用状态
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 粘贴事件监听
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // 检查是否有图片
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          setInputType("image");
          const file = item.getAsFile();
          if (file) {
            await processImageFile(file);
          }
          return;
        }
      }

      // 检查是否有文本（可能是URL）
      try {
        const text = await navigator.clipboard.readText();
        if (
          text &&
          (text.startsWith("http://") || text.startsWith("https://"))
        ) {
          setInputType("url");
          setUrl(text);
        }
      } catch (error) {
        // 忽略剪贴板权限错误
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [uploading, urlLoading]);

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setInputType("image");
        await processImageFile(file);
      } else {
        onError?.("请拖拽图片文件");
      }
    }
  };

  // URL 提交处理
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || urlLoading) return;

    try {
      setUrlLoading(true);
      setError("");

      console.log("开始收藏URL:", url);

      const response = await fetch("/api/collect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.recipe.id);
        if (data.warning === "content-partial") {
          router.push(`/recipes/${data.recipe.id}/edit`);
        } else {
          router.push("/recipes");
        }
      } else {
        throw new Error(data.error || "收藏失败");
      }
    } catch (error) {
      console.error("URL收藏失败:", error);
      const errorMsg = error instanceof Error ? error.message : "收藏失败";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUrlLoading(false);
    }
  };

  // 图片处理
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError?.("请选择图片文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onError?.("图片文件不能超过 10MB");
      return;
    }

    try {
      setUploading(true);
      setProgress(10);
      setError("");

      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      setProgress(20);

      console.log(
        `开始压缩图片: ${file.name}, 原始大小: ${(file.size / 1024).toFixed(
          1
        )}KB`
      );
      const compressedBlob = await compressImage(file, 1280, 0.8);

      const compressionInfo = getCompressionInfo(file, compressedBlob);
      console.log("压缩完成:", compressionInfo);

      setProgress(40);

      const formData = new FormData();
      formData.append("image", compressedBlob, file.name);

      setProgress(60);

      const response = await fetch("/api/ocr-recipe", {
        method: "POST",
        body: formData,
      });

      const ocrResult: OCRResult = await response.json();
      setProgress(80);

      if (!response.ok) {
        console.error("OCR API 错误响应:", ocrResult);
        throw new Error(ocrResult.error || "图片识别失败");
      }

      if (!ocrResult.data) {
        console.error("OCR API 响应格式错误:", ocrResult);
        throw new Error("图片识别响应格式错误");
      }

      // 保存菜谱到数据库
      const createResponse = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: ocrResult.data.title,
          ingredients: JSON.stringify(
            ocrResult.data.ingredients.map((ing: any) =>
              typeof ing === "string"
                ? ing
                : `${ing.name}${ing.amount ? " " + ing.amount : ""}`
            )
          ),
          steps: JSON.stringify(ocrResult.data.steps),
          tags: JSON.stringify(ocrResult.data.tags),
          sourceUrl: `ocr-upload-${Date.now()}`,
          domain: "OCR识别",
          description: `通过${
            ocrResult.source === "vision" ? "AI视觉" : "OCR文字"
          }识别创建`,
          fieldConfidence: ocrResult.fieldConfidence,
        }),
      });

      const createResult = await createResponse.json();
      setProgress(100);

      if (createResult.success) {
        onSuccess?.(createResult.recipe.id);
        const lowConfidence = Object.values(ocrResult.fieldConfidence).some(
          (conf) => conf < 0.6
        );
        if (lowConfidence) {
          router.push(`/recipes/${createResult.recipe.id}/edit`);
        } else {
          router.push(`/recipes/${createResult.recipe.id}`);
        }
      } else {
        throw new Error(createResult.error || "保存菜谱失败");
      }
    } catch (error) {
      console.error("图片上传失败:", error);
      const errorMsg = error instanceof Error ? error.message : "上传失败";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUploading(false);
      setProgress(0);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const isProcessing = urlLoading || uploading;

  return (
    <div className="w-full">
      {/* 输入类型切换 */}
      <div className="flex mb-6 bg-orange-50 rounded-full p-1">
        <button
          onClick={() => setInputType("url")}
          className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-colors ${
            inputType === "url"
              ? "bg-orange-500 text-white shadow-sm"
              : "text-orange-600 hover:text-orange-700"
          }`}
        >
          🔗 链接收藏
        </button>
        <button
          onClick={() => setInputType("image")}
          className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-colors ${
            inputType === "image"
              ? "bg-orange-500 text-white shadow-sm"
              : "text-orange-600 hover:text-orange-700"
          }`}
        >
          📸 拍照识别
        </button>
      </div>

      {/* URL 输入 */}
      {inputType === "url" && (
        <form onSubmit={handleUrlSubmit} className="space-y-6">
          <div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="粘贴菜谱链接（支持小红书、下厨房、微博等）"
              className="w-full px-6 py-4 text-lg border-2 border-orange-200 rounded-2xl focus:border-orange-400 focus:outline-none"
              disabled={isProcessing}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing || !url.trim()}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-lg font-medium py-4 rounded-2xl transition-colors"
          >
            {urlLoading ? "🔄 正在收藏..." : "收藏菜谱"}
          </button>

          <div className="text-sm text-orange-600 space-y-1">
            <p>📱 支持复制粘贴链接 (Ctrl+V/Cmd+V)</p>
            <p>🤖 AI自动提取菜谱内容</p>
            <p>⚡ 一键保存到个人收藏</p>
          </div>
        </form>
      )}

      {/* 图片上传 */}
      {inputType === "image" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />

          {!uploading ? (
            <div
              ref={dropZoneRef}
              onClick={triggerFileSelect}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-orange-500 bg-orange-100"
                  : "border-orange-300 hover:border-orange-400 hover:bg-orange-50"
              }`}
            >
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-medium text-orange-800 mb-2">
                拍照识别菜谱
              </h3>
              <p className="text-orange-600 mb-4">
                拍摄或选择包含菜谱的图片，AI 将自动提取配料和步骤
              </p>
              <div className="text-sm text-orange-500 space-y-1">
                <p>📱 支持手机拍照和相册选择</p>
                <p>📋 可直接复制粘贴图片 (Ctrl+V/Cmd+V)</p>
                <p>🖱️ 支持拖拽图片到此区域</p>
                <p>🤖 AI 智能识别，准确率高</p>
                <p>⚡ 自动生成可编辑的菜谱</p>
              </div>
            </div>
          ) : (
            /* 上传进度 */
            <div className="border-2 border-orange-300 rounded-2xl p-8 text-center">
              {previewUrl && (
                <div className="mb-6">
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="max-h-48 mx-auto rounded-lg shadow-md"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="text-2xl">🔍</div>
                <h3 className="text-xl font-medium text-orange-800">
                  正在识别菜谱...
                </h3>

                {/* Progress bar */}
                <div className="w-full bg-orange-100 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="text-sm text-orange-600">
                  {progress < 20 && "准备图片..."}
                  {progress >= 20 && progress < 40 && "压缩图片..."}
                  {progress >= 40 && progress < 60 && "AI 分析中..."}
                  {progress >= 60 && progress < 80 && "提取菜谱信息..."}
                  {progress >= 80 && "保存菜谱..."}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 全局提示 */}
      <div className="mt-6 text-xs text-gray-500 text-center space-y-1">
        <p>💡 快捷操作：直接粘贴链接或图片即可自动识别类型</p>
        <p>🔒 您的数据安全保存在本地，不会上传到第三方服务器</p>
      </div>
    </div>
  );
}
