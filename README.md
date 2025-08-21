# 🍳 智能菜谱管理器

基于冰箱食材的智能菜谱推荐系统

## ✨ 功能特色

### 🔥 核心功能

- **用户注册/登录** - 个人账户管理
- **菜谱管理** - 添加、编辑、删除个人菜谱
- **冰箱管理** - 记录现有食材和保质期
- **智能推荐** - 基于冰箱食材推荐可做菜谱
- **随机推荐** - "今天做这个吧！"功能
- **图片上传** - 菜谱配图展示
- **收藏功能** - 收藏喜欢的菜谱

### 💫 亮点特性

- 美观的响应式 UI 设计
- 智能食材匹配算法
- 个人收藏型菜谱库
- 多对多关系数据模型
- 搜索过滤功能

## 🛠️ 技术栈

### 前端

- **Next.js 14** (TypeScript, App Router)
- **Tailwind CSS** - 原子化 CSS 框架
- **React Icons** - 图标支持

### 后端

- **Next.js API Routes** - 服务端 API
- **Prisma** - 现代化 ORM
- **SQLite** - 轻量级数据库 (开发)

### AI 功能

- **OpenAI GPT-4 Vision** - 图片识别与解析
- **Tesseract.js** - OCR 文字识别
- **Cheerio + JSDOM + Readability** - 网页解析

### 部署

- **Vercel** - 全栈应用托管

## 🚀 快速开始

### 1. 环境变量配置

在项目根目录创建 `.env.local` 文件：

```env
# OpenAI API Key (必需 - 用于图片识别功能)
OPENAI_API_KEY=your_openai_api_key_here

# 数据库连接 (开发环境使用 SQLite)
DATABASE_URL="file:./dev.db"
```

**获取 OpenAI API Key:**

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册/登录账户
3. 前往 API Keys 页面创建新的 API Key
4. 将 API Key 添加到 `.env.local` 文件

### 2. 安装依赖

```bash
npm install
```

### 2. 数据库设置

创建 `.env.local` 文件：

```env
# 数据库连接
DATABASE_URL="mysql://username:password@host:port/database"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# 上传目录
UPLOAD_DIR="./public/uploads"
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库结构
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

## 📁 项目结构

```
recipe_project/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API 路由
│   │   ├── recipes/        # 菜谱相关页面
│   │   ├── fridge/         # 冰箱管理页面
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页
│   ├── components/         # React 组件
│   │   └── providers/      # Context Providers
│   ├── lib/               # 工具库
│   │   └── prisma.ts      # Prisma 客户端
│   ├── types/             # TypeScript 类型
│   └── utils/             # 工具函数
├── prisma/
│   └── schema.prisma      # 数据库模型
├── public/                # 静态资源
└── package.json          # 依赖配置
```

## 🗄️ 数据模型

### 核心实体

- **User** - 用户信息
- **Recipe** - 菜谱详情
- **Ingredient** - 食材信息
- **RecipeIngredient** - 菜谱-食材关系
- **FridgeItem** - 冰箱食材
- **FavoriteRecipe** - 用户收藏

### 关系设计

- 用户 ↔ 菜谱 (1:N)
- 用户 ↔ 冰箱食材 (1:N)
- 菜谱 ↔ 食材 (M:N)
- 用户 ↔ 收藏菜谱 (M:N)

## 📋 项目范围 (User Stories)

### 🎲 Must Have (MVP 核心功能)

#### 1. 选择困难症 / 逛超市不知买啥

**作为** 选择困难症的我，**我想** 记录我每餐吃了什么并能随机推荐今天吃啥，**以便** 下次买菜不纠结。

**验收标准：**

- ✅ 能创建"餐次"记录
- ✅ 首页一键"给我今天的推荐"
- ✅ 可从历史/收藏中随机挑 1–3 道

#### 2. 冰箱剩菜别浪费

**作为** 经常把菜放坏的人，**我想** 输入/管理"冰箱里现有食材"，**以便** 系统基于这些食材推荐菜谱。

**验收标准：**

- ✅ 有"我的冰箱"清单
- ✅ 能按"可做度"（覆盖 ≥80%食材）排序推荐

#### 3. 记录我的拿手菜 / 点菜

**作为** 会做菜的人，**我想** 记录我的拿手菜并在不知道吃什么时让系统（或伴侣）给我点菜。

**验收标准：**

- ✅ 可创建"我的菜谱"（标题/食材/步骤/图片）
- ✅ 可标注"拿手菜/可点菜"
- ✅ 提供"给我点一道拿手菜"



## 📖 API 文档

### 菜谱相关

- `GET /api/recipes` - 获取菜谱列表
- `POST /api/recipes` - 创建新菜谱
- `GET /api/recipes/[id]` - 获取菜谱详情
- `PUT /api/recipes/[id]` - 更新菜谱
- `DELETE /api/recipes/[id]` - 删除菜谱

### 冰箱管理

- `GET /api/fridge` - 获取冰箱食材
- `POST /api/fridge` - 添加食材
- `PUT /api/fridge/[id]` - 更新食材
- `DELETE /api/fridge/[id]` - 删除食材

### 推荐系统

- `GET /api/recommend` - 获取推荐菜谱
- `GET /api/recipes/random` - 随机菜谱



---

