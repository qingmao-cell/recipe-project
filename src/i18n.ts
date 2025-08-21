import { getRequestConfig } from 'next-intl/server';

// 定义支持的语言
export const locales = ['zh', 'ja'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // 加载对应的消息文件
  let messages;
  
  try {
    // 加载主消息文件（从根目录的 messages 文件夹）
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // 加载失败时使用中文
    messages = (await import('../messages/zh.json')).default;
  }

  return {
    locale: locale || 'zh',
    messages,
    timeZone: locale === 'ja' ? 'Asia/Tokyo' : 'Asia/Shanghai'
  };
});