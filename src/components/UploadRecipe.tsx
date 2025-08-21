"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { compressImage, getCompressionInfo } from "@/utils/compressImage";

interface UploadRecipeProps {
  onSuccess?: (recipeId: string) => void;
  onError?: (error: string) => void;
}

interface OCRResult {
  data: {
    title: string;
    ingredients: { name: string; amount: string | null }[];
    steps: string[];
    tags: string[];
    confidence?: number;
  };
  source: "vision" | "ocr+llm";
  cacheHit: boolean;
  fieldConfidence: {
    title: number;
    ingredients: number;
    steps: number;
  };
}

export default function UploadRecipe({
  onSuccess,
  onError,
}: UploadRecipeProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 监听复制粘贴事件
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await processFile(file);
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [uploading]);

  // 拖拽事件处理
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
        await processFile(file);
      } else {
        onError?.('请选择图片文件');
      }
    }
  };

  // 处理文件上传和压缩

  // 通用文件处理函数
  const processFile = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      onError?.('请选择图片文件');
      return;
    }

    // 验证文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError?.("图片文件不能超过 10MB");
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      // 生成预览
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      setProgress(20);

      // 压缩图片
      console.log(
        `开始压缩图片: ${file.name}, 原始大小: ${(file.size / 1024).toFixed(
          1
        )}KB`
      );
      const compressedBlob = await compressImage(file, 1280, 0.8);

      // 显示压缩信息
      const compressionInfo = getCompressionInfo(file, compressedBlob);
      console.log(`压缩完成:`, compressionInfo);

      setProgress(40);

      // 上传到 OCR API
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
        throw new Error((ocrResult as any).error || "图片识别失败");
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
          sourceUrl: `ocr-upload-${Date.now()}`, // 特殊标记
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

        // 根据置信度决定跳转页面
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
      console.error("上传失败:", error);
      onError?.(error instanceof Error ? error.message : "上传失败");
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
    await processFile(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
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
        disabled={uploading}
      />

      {/* 上传区域 */}
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
            拍张照片，自动生成菜谱
          </p>
          <div className="text-sm text-orange-500 space-y-1">
            <p>📱 支持手机拍照上传</p>
            <p>📋 支持复制粘贴图片</p>
            <p>🖱️ 支持拖拽上传</p>
            <p>🤖 AI智能识别</p>
            <p>⚡ 自动生成信息</p>
          </div>
        </div>
      ) : (
        /* 上传进度 */
        <div className="border-2 border-orange-300 rounded-2xl p-8 text-center">
          {previewUrl && (
            <div className="mb-6">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg shadow-md"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="text-2xl">🔍</div>
            <h3 className="text-xl font-medium text-orange-800">
              正在识别...
            </h3>

            {/* 进度条 */}
            <div className="w-full bg-orange-100 rounded-full h-3">
              <div
                className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="text-sm text-orange-600">
              {progress < 20 && '准备中...'}
              {progress >= 20 && progress < 40 && '压缩图片...'}
              {progress >= 40 && progress < 60 && '分析内容...'}
              {progress >= 60 && progress < 80 && '提取信息...'}
              {progress >= 80 && '保存菜谱...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
