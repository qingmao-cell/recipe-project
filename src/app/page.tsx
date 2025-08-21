"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidUrl = (text: string) => {
    try {
      const u = new URL(text);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleCollect = async () => {
    if (!isValidUrl(url.trim())) {
      setError("请输入有效的网址");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.warning === "content-partial") {
          router.push(`/recipes/${data.recipe.id}/edit`);
        } else {
          router.push(`/recipes`);
        }
      } else {
        throw new Error(data.error || "收藏失败");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "收藏失败";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError("图片大小不能超过 5MB");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/ocr-recipe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (data.data) {
        // OCR 成功，跳转到创建页面并带上识别的数据
        const recipeData = data.data;
        // 将数据存储到 sessionStorage
        sessionStorage.setItem("ocrRecipeData", JSON.stringify({
          title: recipeData.title,
          ingredients: recipeData.enrichedIngredients || recipeData.ingredients?.map((i: any) => i.name) || [],
          seasonings: recipeData.seasonings || [],
          tools: recipeData.tools || [],
          tags: recipeData.tags || [],
          steps: recipeData.steps || [],
        }));
        router.push(`/recipes/create?from=ocr`);
      } else {
        throw new Error(data.error || "识别失败");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "识别失败";
      setError(msg);
    } finally {
      setLoading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setUrl(text);
    setError(""); // 清除错误信息
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    // 检查剪贴板是否有图片
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          e.preventDefault(); // 阻止默认粘贴行为
          const file = item.getAsFile();
          if (file) {
            await handleImageUpload(file);
          }
          return;
        }
      }
    }
    // 如果没有图片，让默认的文本粘贴行为继续
  };

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: "url('/images/home-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* 面包屑导航 */}
      <div className="absolute top-6 right-6 z-20 flex gap-6">
        <Link
          href="/recommend"
          className="group inline-flex items-center gap-2 text-base font-medium text-[#ff8c42] hover:text-[#ff7a2e] transition-colors"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">
            →
          </span>
          <span>今日推荐</span>
        </Link>

        <button
          onClick={() => router.push("/recipes")}
          className="group inline-flex items-center gap-2 text-base font-medium text-[#ff8c42] hover:text-[#ff7a2e] transition-colors"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">
            →
          </span>
          <span>查看收藏</span>
        </button>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex items-start justify-center min-h-screen px-4 pt-32">
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-3">
            {/* 输入框 - 支持链接和图片粘贴 */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={handleInputChange}
                onPaste={handlePaste}
                onKeyDown={(e) =>
                  e.key === "Enter" && !loading && isValidUrl(url.trim()) && handleCollect()
                }
                placeholder="粘贴食谱网址或图片，开始你的美食收藏之旅"
                className="w-full px-5 py-4 pr-12 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg bg-white"
                disabled={loading}
              />
              
              {/* 图片上传按钮 - 集成在输入框内部右侧 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-orange-50 rounded-lg transition-colors"
                title="上传图片"
              >
                <svg 
                  className="w-6 h-6 text-orange-500"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              </button>
            </div>

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                }
              }}
              className="hidden"
            />

            {/* 收藏/处理按钮 */}
            <button
              onClick={handleCollect}
              disabled={loading || !isValidUrl(url.trim())}
              className="shrink-0 px-6 py-4 rounded-xl bg-[#ff8c42] hover:bg-[#ff7a2e] disabled:bg-[#ffb366] disabled:cursor-not-allowed text-white text-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              {loading ? "处理中..." : "收藏"}
            </button>
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="mt-4 flex items-center justify-end">
            <div className="text-sm text-orange-700">
              💡 支持拖拽或粘贴图片
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}