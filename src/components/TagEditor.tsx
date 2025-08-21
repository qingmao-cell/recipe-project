"use client";

import { useState, useRef, useEffect } from "react";
import { PRESET_TAGS } from "@/lib/tagUtils";
import { useTranslations } from "next-intl";
import { getTagDisplayKey } from "@/lib/tagDisplay";

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export default function TagEditor({
  tags,
  onChange,
  className = "",
}: TagEditorProps) {
  const t = useTranslations('TagEditor');
  const tTags = useTranslations('Tags');
  const [inputValue, setInputValue] = useState("");
  const [localTags, setLocalTags] = useState<string[]>(tags);
  const [showPresets, setShowPresets] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 同步外部tags变化
  useEffect(() => {
    setLocalTags(tags);
  }, [tags]);

  // 添加标签
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !localTags.includes(trimmedTag)) {
      const newTags = [...localTags, trimmedTag];
      setLocalTags(newTags);
      onChange(newTags);
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    const newTags = localTags.filter((tag) => tag !== tagToRemove);
    setLocalTags(newTags);
    onChange(newTags);
  };

  // 处理输入框事件
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue("");
      }
    } else if (
      e.key === "Backspace" &&
      inputValue === "" &&
      localTags.length > 0
    ) {
      removeTag(localTags[localTags.length - 1]);
    }
  };

  // 处理输入框变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 处理输入框失焦
  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
      setInputValue("");
    }
  };

  // 添加预设标签
  const addPresetTag = (tag: string) => {
    if (!localTags.includes(tag)) {
      addTag(tag);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 标签输入区域 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">{t('tags')}</label>

        {/* 已有关联标签 */}
        {localTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {localTags.map((tag) => {
              const { isPreset, key } = getTagDisplayKey(tag);
              const displayText = isPreset ? tTags(key as any) : tag;
              
              return (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full border border-orange-200 hover:bg-orange-200 transition-colors"
                >
                  {displayText}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-orange-500 hover:text-orange-700 text-xs"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* 输入框 */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            placeholder={t('inputPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* 预设标签面板 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{t('presetTags')}</span>
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="text-sm text-orange-600 hover:text-orange-800 transition-colors"
          >
            {showPresets ? t('collapse') : t('expand')}
          </button>
        </div>

        {showPresets && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* 场景/心情 */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                {t('scenario')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.scenario.map((tagKey) => {
                  const tagDisplay = tTags(tagKey as any);
                  return (
                    <button
                      key={tagKey}
                      type="button"
                      onClick={() => addPresetTag(tagDisplay)}
                      disabled={localTags.includes(tagDisplay)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                        localTags.includes(tagDisplay)
                          ? "bg-orange-500 text-white border-orange-500 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300 hover:scale-105"
                      }`}
                    >
                      {tagDisplay}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 风味 */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                {t('flavor')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.flavor.map((tagKey) => {
                  const tagDisplay = tTags(tagKey as any);
                  return (
                    <button
                      key={tagKey}
                      type="button"
                      onClick={() => addPresetTag(tagDisplay)}
                      disabled={localTags.includes(tagDisplay)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                        localTags.includes(tagDisplay)
                          ? "bg-orange-500 text-white border-orange-500 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300 hover:scale-105"
                      }`}
                    >
                      {tagDisplay}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 主食/能量 */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                {t('staple')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.staple.map((tagKey) => {
                  const tagDisplay = tTags(tagKey as any);
                  return (
                    <button
                      key={tagKey}
                      type="button"
                      onClick={() => addPresetTag(tagDisplay)}
                      disabled={localTags.includes(tagDisplay)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                        localTags.includes(tagDisplay)
                          ? "bg-orange-500 text-white border-orange-500 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300 hover:scale-105"
                      }`}
                    >
                      {tagDisplay}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 厨具 */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                {t('cookware')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.cookware.map((tagKey) => {
                  const tagDisplay = tTags(tagKey as any);
                  return (
                    <button
                      key={tagKey}
                      type="button"
                      onClick={() => addPresetTag(tagDisplay)}
                      disabled={localTags.includes(tagDisplay)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                        localTags.includes(tagDisplay)
                          ? "bg-orange-500 text-white border-orange-500 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300 hover:scale-105"
                      }`}
                    >
                      {tagDisplay}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



