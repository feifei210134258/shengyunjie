# 产品升云阶 (Product Ascension)

AI 驱动的 B 端产品经理智能训练平台 — 帮助 PM 从执行层向高级跃迁。

## 核心链路

深度诊断 → 画像建模 → 针对性训练 → 反馈迭代 → 画像更新 → 精准推荐

## 技术栈

Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui + Supabase + Vercel AI SDK (DeepSeek)

## 模块概览

- **诊断** (`/diagnosis`) — 能力量表自评 → AI 深度访谈 → 案例实战验证，三阶段诊断流程
- **训练** (`/training`) — AI 动态出题、答题评分、案例库（B 端产品拆解 + 决策推演）
- **工作台** (`/dashboard`) — 统计数据、成长曲线
- **特训冲刺** (`/bootcamp`) — 简历解析 → AI 模拟面试 → 诊断报告（未开始）
- **设置** (`/settings`) — AI 模型配置（API Key、模型选择、深度思考开关）

## 注意事项
你每次修改代码后，有比较大的概率出现前端样式丢失的问题！请每次修改后测试以避免

## 关键约定

- 数据写入 `.env.local`，模板见 `.env.example`
- DB schema: `supabase/schema.sql`，所有操作经 supabase-js
- AI prompt 模板: `src/prompts/`
- 功能状态唯一真相源: `feature_list.json`
- 启动前运行 `./init.sh` 验证环境
- 每个功能必须前后端 + 数据持久化完整，禁止空壳界面

