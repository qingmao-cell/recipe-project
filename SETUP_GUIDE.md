# 🚀 Recipe Manager 环境配置指南

## ✅ 已完成的工作

### 1. PostgreSQL 标签系统实现 ✅

- ✅ Prisma 模型升级：`Recipe.tags`改为`String[]`（PostgreSQL text[]）
- ✅ 标签标准化工具：`normalizeTags()`, `cleanTags()`
- ✅ 自动标签生成：基于标题、食材、步骤智能生成标签
- ✅ API 全面升级：收藏、OCR、列表 API 支持新标签系统
- ✅ 前端筛选升级：支持精确/模糊筛选、URL 同步

### 2. 环境变量配置系统 ✅

- ✅ 统一配置管理：`src/lib/config.ts`
- ✅ 环境变量模板：`temp.env`
- ✅ 所有 API 使用配置变量替代硬编码
- ✅ Prisma schema 配置：支持`DATABASE_URL`和`DIRECT_URL`

## 🔧 还需要你完成的步骤

### 1. 获取正确的数据库密码

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入项目：`qyjwoxfjigfztcjhxdzj`
3. 在 **Settings → Database** 中找到你的数据库密码

### 2. 创建环境变量文件

将 `temp.env` 中的 `YOUR_PASSWORD` 替换为真实密码，然后重命名为 `.env`：

```bash
# Supabase双URL配置（推荐模式）
DATABASE_URL="postgresql://postgres:你的密码@db.qyjwoxfjigfztcjhxdzj.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres:你的密码@db.qyjwoxfjigfztcjhxdzj.supabase.co:5432/postgres?sslmode=require"
```

### 3. 运行数据库迁移

```bash
# 验证schema
npx prisma validate

# 运行迁移
npx prisma migrate dev --name change_tags_to_string_array

# 生成客户端
npx prisma generate

# 可选：打开数据库管理界面
npx prisma studio
```

### 4. 可选：添加 GIN 索引优化标签查询

```sql
CREATE INDEX IF NOT EXISTS recipe_tags_gin_idx
ON "Recipe" USING GIN ("tags");
```

## 🎯 新功能特性

### 智能标签系统

- **自动生成**：根据食材、步骤自动推荐标签
- **标准化**：同义词映射（如"蔬菜"→"维生素"）
- **分类标签**：营养（维生素/蛋白质/淀粉）、风味（酸/辣/甜/咸）、厨具、场景

### 高级筛选 API

```javascript
// 精确标签筛选（AND逻辑）
GET /api/recipes?tags=快手菜,维生素

// 模糊标签筛选
GET /api/recipes?tag_like=酸

// 全文搜索
GET /api/recipes?q=番茄

// 组合筛选
GET /api/recipes?tags=快手菜&tag_like=酸&q=番茄
```

### 前端实时筛选

- URL 同步筛选状态
- 实时 API 调用
- 向后兼容旧数据格式

## 🔍 故障排查

### 错误：P1012 "Environment variable not found"

**解决**：确保`.env`文件在项目根目录，保存后重启开发服务器

### 错误：P1000 "Authentication failed"

**解决**：检查数据库密码是否正确，确保连接字符串格式正确

### 错误：SSL/IPv6 相关

**解决**：确保连接字符串包含`sslmode=require`

## 🚀 启动验证步骤

1. ✅ 配置正确的`.env`文件
2. ✅ `npx prisma validate` → OK
3. ✅ `npx prisma migrate dev` → OK
4. ✅ `npx prisma studio` → 能看到 Supabase 表结构
5. ✅ 启动项目，测试收藏功能 → Supabase 中能看到数据

完成这些步骤后，你就有了一个功能完整的 PostgreSQL 标签系统！🎉




