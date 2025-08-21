"use client";

import { useTranslations } from "next-intl";
import { getTagDisplayKey } from "@/lib/tagDisplay";

interface TagDisplayProps {
  tag: string;
  className?: string;
}

export function TagDisplay({ tag, className = "" }: TagDisplayProps) {
  const tTags = useTranslations('Tags');
  const { isPreset, key } = getTagDisplayKey(tag);
  
  // If it's a preset tag, translate it; otherwise show as-is
  const displayText = isPreset ? tTags(key as any) : tag;
  
  return (
    <span className={className}>
      {displayText}
    </span>
  );
}

interface TagListDisplayProps {
  tags: string[];
  className?: string;
  itemClassName?: string;
  maxItems?: number;
}

export function TagListDisplay({ 
  tags, 
  className = "", 
  itemClassName = "px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full border border-orange-200",
  maxItems
}: TagListDisplayProps) {
  const tTags = useTranslations('Tags');
  const displayTags = maxItems ? tags.slice(0, maxItems) : tags;
  const remainingCount = maxItems && tags.length > maxItems ? tags.length - maxItems : 0;
  
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayTags.map((tag, index) => {
        const { isPreset, key } = getTagDisplayKey(tag);
        const displayText = isPreset ? tTags(key as any) : tag;
        
        return (
          <span key={index} className={itemClassName}>
            {displayText}
          </span>
        );
      })}
      {remainingCount > 0 && (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}