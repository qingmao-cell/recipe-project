"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { compressImage, getCompressionInfo } from "@/utils/compressImage";

interface SmartRecipeInputProps {
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

export default function SmartRecipeInput({
  onSuccess,
  onError,
}: SmartRecipeInputProps) {
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState("");
  const [currentAction, setCurrentAction] = useState(""); // "url" | "image" | ""

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 判断输入类型
  const isValidUrl = (text: string) => {
    try {
      new URL(text);
      return text.startsWith("http://") || text.startsWith("https://");
    } catch {
      return false;
    }
  };

  // 粘贴事件监听
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (processing) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      // 检查是否有图片
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
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
        if (text && isValidUrl(text)) {
          setInput(text);
        }
      } catch (error) {
        // 忽略剪贴板权限错误
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [processing]);

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
        await processImageFile(file);
      } else {
        setError("请拖拽图片文件");
      }
    }
  };

  // 智能提交处理
  const handleSmartSubmit = async () => {
    if (processing) return;

    if (input.trim()) {
      if (isValidUrl(input.trim())) {
        await processUrl(input.trim());
      } else {
        setError("请输入有效的网址链接");
      }
    } else {
      // 如果没有输入，触发文件选择
      fileInputRef.current?.click();
    }
  };

  // URL 处理
  const processUrl = async (url: string) => {
    try {
      setProcessing(true);
      setError("");
      setCurrentAction("url");
      setProgress(50);

      console.log("开始收藏URL:", url);

      const response = await fetch("/api/collect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      setProgress(100);

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
      setProcessing(false);
      setProgress(0);
      setCurrentAction("");
    }
  };

  // 图片处理
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("图片文件不能超过 10MB");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setCurrentAction("image");
      setProgress(10);

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
      setProcessing(false);
      setProgress(0);
      setCurrentAction("");
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

  const getButtonText = () => {
    if (processing) {
      if (currentAction === "url") return "🔄 正在收藏...";
      if (currentAction === "image") return "🔄 正在识别...";
      return "🔄 处理中...";
    }

    if (input.trim()) {
      if (isValidUrl(input.trim())) {
        return "🔗 收藏链接";
      } else {
        return "❌ 无效链接";
      }
    }

    return "📸 选择图片或粘贴链接";
  };

  const getProgressText = () => {
    if (currentAction === "url") {
      return "正在收藏菜谱...";
    }
    if (currentAction === "image") {
      if (progress < 20) return "准备图片...";
      if (progress < 40) return "压缩图片...";
      if (progress < 60) return "AI 分析中...";
      if (progress < 80) return "提取菜谱信息...";
      return "保存菜谱...";
    }
    return "处理中...";
  };

  return (
    <div className="w-full">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={processing}
      />

      {!processing ? (
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 transition-colors ${
            isDragOver
              ? "border-orange-500 bg-orange-100"
              : "border-orange-300 hover:border-orange-400"
          }`}
        >
          {/* 主输入区域 */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-medium text-orange-800 mb-4">
              智能菜谱收藏
            </h3>
          </div>

          {/* 输入框 */}
          <div className="space-y-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSmartSubmit()}
              placeholder="粘贴菜谱链接，或点击下方按钮选择图片"
              className="w-full px-6 py-4 text-lg border-2 border-orange-200 rounded-2xl focus:border-orange-400 focus:outline-none"
              disabled={processing}
            />

            <button
              onClick={handleSmartSubmit}
              disabled={
                processing || (!!input.trim() && !isValidUrl(input.trim()))
              }
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-lg font-medium py-4 rounded-2xl transition-colors"
            >
              {getButtonText()}
            </button>
          </div>

          {/* 提示信息 */}
          <div className="mt-6 text-sm text-orange-600 space-y-1 text-center">
            <p>💡 支持多种方式添加菜谱：</p>
            <p>🔗 复制粘贴网址链接 (Ctrl+V/Cmd+V)</p>
            <p>📸 选择或拍摄菜谱图片</p>
            <p>🖱️ 拖拽图片到此区域</p>
            <p>📋 直接粘贴剪贴板中的图片</p>
          </div>
        </div>
      ) : (
        /* 处理进度 */
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
            <div className="text-4xl">
              {currentAction === "url" ? "🔗" : "🔍"}
            </div>
            <h3 className="text-xl font-medium text-orange-800">
              {getProgressText()}
            </h3>

            {/* Progress bar */}
            <div className="w-full bg-orange-100 rounded-full h-3">
              <div
                className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
