import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// 实验室功能开关
export const ENABLE_LABS = config.app.enableLabs;
