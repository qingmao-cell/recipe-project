/**
 * 应用配置管理
 * 统一管理所有环境变量和配置项
 */

// Supabase 配置
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
} as const;

// 数据库配置
export const databaseConfig = {
  url: process.env.DATABASE_URL!,
} as const;

// OpenAI 配置
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY!,
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  visionModel: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1000"),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.1"),
} as const;

// 应用配置
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Recipe Manager",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || "智能菜谱收藏管理系统",
  enableLabs: process.env.NEXT_PUBLIC_ENABLE_LABS === "true",
} as const;

// 文件上传配置
export const uploadConfig = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB
  allowedImageTypes: (
    process.env.ALLOWED_IMAGE_TYPES ||
    "image/jpeg,image/png,image/webp,image/gif"
  ).split(","),
} as const;

// 缓存配置
export const cacheConfig = {
  ttl: parseInt(process.env.CACHE_TTL || "3600"), // 1小时
  redisUrl: process.env.REDIS_URL,
} as const;

// 验证必需的环境变量
export function validateEnvironment() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "DATABASE_URL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // 警告非必需但重要的变量
  const important = ["OPENAI_API_KEY"];

  const missingImportant = important.filter((key) => !process.env[key]);

  if (missingImportant.length > 0) {
    console.warn(
      `Missing important environment variables: ${missingImportant.join(", ")}`
    );
  }
}

// 开发环境检查
export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production";

// 导出所有配置
export const config = {
  supabase: supabaseConfig,
  database: databaseConfig,
  openai: openaiConfig,
  app: appConfig,
  upload: uploadConfig,
  cache: cacheConfig,
  isDevelopment,
  isProduction,
} as const;




