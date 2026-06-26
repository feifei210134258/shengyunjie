# 会话进度日志

## 当前状态 / Current State

**Last Updated:** 2026-05-28
**会话 ID：** fullstack-build-001
**Current Objective:** 全栈编码 — 从原型到可运行产品
**进度摘要：** 完成了项目脚手架搭建、Supabase 集成、AI SDK 集成、认证流程、诊断模块（量表+访谈+案例+报告）、训练模块（首页+答题+AI分析）、设置页、前后端数据持久化打通、案例库独立页面。

---

## 功能进度

### 已完成 / What's Done（本会话）

- [x] **项目脚手架（infra-001）** — Next.js App Router + Tailwind CSS + TypeScript + shadcn/ui
- [x] **Supabase 集成（infra-002）** — 账密登录、7 张数据表（profiles/diagnosis_reports/dimension_scores/growth_snapshots/training_records/user_settings/chat_history）
- [x] **AI SDK 集成（infra-003）** — DeepSeek V4 Flash 接入、流式对话、思考模式（reasoning_effort: max）
- [x] **Prompt 管理（infra-004 部分）** — 提示词策略文档编写、训练出题官/评卷官/诊断师 prompt 实装
- [x] **AI 模型配置模块（infra-005）** — 设置页（API Key/模型选择/深度思考开关）
- [x] **全局 UI 与导航（ux-001）** — 布局框架、侧边栏导航、认证流程、12 个页面路由
- [x] **AI 设置页（ux-002）** — 完整设置页面
- [x] **诊断阶段一（diag-001）** — 25 题能力量表、维度评分、提交落库
- [x] **诊断阶段二（diag-002）** — AI 深度访谈、对话保存
- [x] **诊断阶段三（diag-003）** — 案例实战 + 综合诊断报告
- [x] **日常训练（training-001）** — 训练首页（看板）+ 答题页（AI 出题 + 分析 + 记录）
- [x] **案例库独立页面（comet: case-library-dedicated-page）** — 产品分析从抽屉改为独立页面 `/training/cases/[product]`，视角切换 tabs，列表页简化（2026-05-28 归档完成）

### 待开始 / What's Next

- [ ] **工作台仪表盘（dashboard）** — 展示画像、训练统计、诊断报告摘要
- [ ] **用户画像引擎（profile-001/002）** — 画像数据模型已就绪，需接入工作台
- [ ] **日常训练·案例库内容（training-002 部分）** — 经典 B 端产品拆解（AI 动态生成）、决策推演案例生成
- [ ] **特训冲刺（bootcamp-001/002/003）** — 简历解析 + AI 模拟面试 + 面试报告

---

## 阻塞项 / Blockers & Risks

- [ ] 诊断阶段一的 25 题目前是硬编码，后续需改为 AI 动态生成
- [ ] 训练首页的统计数据尚未从 API 读取（目前硬编码）

---

## 决策记录

| # | 决策 | 背景 | 日期 |
|---|------|------|------|
| 1 | 采用 AGENTS.md 框架管理 AI agent 工作流 | 确保多会话间上下文连续 | 2026-05-19 |
| 2 | **DeepSeek V4 Flash 默认模型** | 质量优先 | 2026-05-23 |
| 3 | **深度思考默认开启（reasoning_effort: max）** | 诊断质量核心保障 | 2026-05-23 |
| 4 | **桌面优先** | 个人工具 | 2026-05-23 |
| 5 | **每做一题就记录，不搞 batch** | 防丢数据，实时更新统计 | 2026-05-23 |
| 6 | **案例库用独立页面替代抽屉** | 提升阅读体验，导航更清晰 | 2026-05-27 |

---

## 会话期间修改的文件 / Files Modified

| 文件 | 说明 |
|------|------|
| `src/app/*` | 全部页面路由 |
| `src/app/api/*` | 全部 API 路由 |
| `src/lib/ai.ts` | AI 模型配置 + 思考模式注入 |
| `src/lib/supabase.ts` | Supabase 客户端 |
| `src/lib/supabase-server.ts` | 服务端 Supabase 客户端 |
| `src/contexts/AuthContext.tsx` | 认证上下文 |
| `src/components/Sidebar.tsx` | 侧边栏导航 |
| `supabase/schema.sql` | 数据库 schema |
| `AGENTS.md` | 工作指南 |
| `feature_list.json` | 功能状态追踪 |
| `progress.md` | 进度日志 — 本文件 |

---

## 完成证据 / Verification Evidence

- [x] `npx tsc --noEmit` 通过
- [x] `npx next build` 通过（13+ 个页面 + API 路由）
- [x] DeepSeek 流式对话测试通过
- [x] API 路由 POST/GET 全部返回 200
- [x] Comet change `case-library-dedicated-page` 验证通过并归档（2026-05-28）

---

## 下个会话记录 / Recommended Next Step

1. 工作台仪表盘 — 读取 training_stats + 诊断报告展示
2. 用户画像引擎 — 画像卡片展示 + 成长曲线
3. 训练首页统计数据从 API 读取（替代硬编码）

---

## 2026-05-29 热修复会话

### 修复的 Bug

- [x] **Bug 1：题目前缀 regex** — 两步清理代替单 regex，处理 `**题目：**` 边缘情况
- [x] **Bug 2：切换视角重复请求** — 移除 `switchPerspective` 中的直接 `loadArticle()` 调用
- [x] **Bug 3：product_name 大小写** — API 入口 `toLowerCase()` 归一化
- [x] **Bug 4：连击天数显示错误（一直显示12天）** — API 端 streak 改用 `Asia/Shanghai` 本地日期；移除前端死代码

### 相关文件

| 文件 | 改动 |
|------|------|
| `src/app/(app)/training/session/page.tsx` | regex 修复 |
| `src/app/(app)/training/cases/[product]/page.tsx` | 移除重复请求 |
| `src/app/api/cases/route.ts` | 大小写归一化 |
| `src/app/api/training/stats/route.ts` | streak 时区修复 |
| `src/app/api/training/sessions/route.ts` | session 日期时区修复 |
| `src/app/api/dashboard/route.ts` | streak 时区修复 |
| `src/app/(app)/training/page.tsx` | 移除 dead code |

### Comet 状态

- Change: `0529-training-ui-bugs` — 已验证归档（6/6 steps succeeded）
- 分支 `0529-training-ui-bugs` 已合并到 master

## [2026-05-29] RLS 修复 - case_articles 删除权限

### 完成内容
- 修复了 case_articles 表缺少 DELETE 和 UPDATE RLS 策略的问题
- 通过 Kimi WebBridge 在 Supabase SQL Editor 中运行了正确的 SQL（去掉了 `if not exists` 语法）
- 删除了 `src/app/api/admin/` 目录（未使用的管理路由）
- 构建通过（`npm run build` 和 `npx tsc --noEmit` 均正常）

### 技术细节
- PostgreSQL 不支持 `CREATE POLICY if not exists`，改为 `drop policy if exists` + `create policy` 模式
- 策略允许所有认证用户（`auth.role() = 'authenticated'`）删除和更新 case_articles

## [2026-05-31] 训练营模块数据库 Schema

### 完成内容
- **新增三张训练营表**：
  - `bootcamp_sessions`：训练营会话状态（status, current_day, resume_text, parsed_profile, weakness_prediction）
  - `bootcamp_interviews`：每日面试题（day_number 1-3, question_index 1-5, question_type, difficulty, ai_evaluation, status）
  - `bootcamp_reports`：日报与综合报告（report_type, day_number, content, scores_snapshot）
- **RLS 策略**：
  - `bootcamp_sessions`：auth.uid() = user_id
  - `bootcamp_interviews` / `bootcamp_reports`：EXISTS 子查询关联 bootcamp_sessions.user_id
- **补充现有表缺失 RLS**：profiles INSERT/DELETE、dimension_scores UPDATE/DELETE、growth_snapshots UPDATE/DELETE、training_sessions DELETE、question_feedback DELETE

### 验证结果
- `./init.sh` ✅ 全部 9/9 通过
- Schema 语法已人工审查，风格与现有表一致

### 修改文件
- `supabase/schema.sql`

## [2026-05-30] Schema RLS 策略补全 + ESLint 配置 + 移除 console 语句

### 完成内容
- **补全 schema RLS 策略**：
  - `dimension_scores`：新增 UPDATE、DELETE（用户仅可操作自己的）
  - `training_sessions`：新增 DELETE
  - `question_feedback`：新增 DELETE
  - `growth_snapshots`：新增 UPDATE、DELETE
  - `profiles`：新增 INSERT、DELETE
  - `case_articles`：DELETE 策略添加注释说明（共享内容池，无 user_id 字段）
- **创建 ESLint 配置**：新增 `.eslintrc.json`（Next.js core-web-vitals + no-console 规则）
- **移除生产环境 console 语句**：
  - `src/lib/tavily.ts`：移除 3 处 console.warn，保持静默失败
  - `src/app/(app)/diagnosis/interview/page.tsx`：移除 console.error，改为界面错误提示
- **修复 ESLint warning**：
  - `src/app/(app)/training/cases/[product]/page.tsx`：补全 useCallback 依赖数组（添加 searchParams）
  - `init.sh`：设置 `ESLINT_USE_FLAT_CONFIG=false` 兼容 ESLint 9.x 传统配置格式

### 验证结果
- `npx tsc --noEmit` ✅ 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0` ✅ 通过
- `./init.sh` ✅ 全部 9/9 通过

### 修改文件
- `supabase/schema.sql`
- `.eslintrc.json`（新增）
- `init.sh`
- `src/lib/tavily.ts`
- `src/app/(app)/diagnosis/interview/page.tsx`
- `src/app/(app)/training/cases/[product]/page.tsx`
- `feature_list.json`
- `progress.md`

## [2026-06-03] 全局 UI 视觉优化

### 完成内容
- 使用 `design-taste-frontend` 做现有前端视觉审查，判定本项目应走 B 端产品工作台语言，而不是营销页或消费品牌风格。
- 将 `tailwind.config.ts` 的暖米色/烧橙/serif 方向调整回 `DESIGN.md` 约定的明亮灰白、深靛蓝、青色辅助与 Hanken Grotesk。
- 使用 `next/font` 加载 Hanken Grotesk 与 Geist Mono，移除布局里的 Google Fonts `<link>` 直连。
- 优化全局背景、selection、图表色、按钮对比度、主导航、认证页、工作台快捷入口、训练首页状态面板、诊断报告、案例实战、特训入口与若干基础组件圆角。
- 清理可见页面中的 em dash、装饰分隔点、emoji 装饰、手写 SVG 菜单图标等视觉噪音。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0` 通过
- `npx next build` 通过
- `./init.sh` 通过（9/9）
- 本地 dev server 使用 `http://localhost:3020/login` 检查，HTTP 200；Chrome 1440x900 截图确认登录首屏无明显错位，主按钮为白字深靛蓝

### 风险与备注
- 本轮开始前工作区已有大量未提交 UI 改动、OpenSpec 归档/删除和新增文件。本轮在既有脏工作区上继续优化，没有回滚用户或其他 agent 的改动。
- 未直接提交代码，避免把本轮前已经存在的未提交变更一并打包成不可审查的混合提交。

## [2026-06-03] 特训简历解析支持 .md 文件上传

### 完成内容
- 使用 `comet-tweak` 创建 change：`support-md-resume-upload`。
- 更新 `ResumeUploader`：文件上传模式支持 `.md` / `.markdown`，并更新前端校验、`accept` 属性和说明文案。
- 更新 `/api/bootcamp/resume`：后端按小写文件名识别 `.md` / `.markdown`，兼容 `.MD` 等大小写扩展名。
- 保留现有 PDF、Word 和粘贴 Markdown 文本路径，不改变 API 结构和数据库 schema。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/bootcamp/ResumeUploader.tsx src/app/api/bootcamp/resume/route.ts --max-warnings 0` 通过
- `./init.sh` 通过（9/9）
- 验证报告：`docs/superpowers/reports/2026-06-03-support-md-resume-upload-verify.md`

### 备注
- 工作区在本 tweak 开始前已有大量未提交 UI 改动。本次只归属 `.md/.markdown` 简历文件上传支持，不回滚既有改动。

## [2026-06-03] Hotfix: Markdown 简历上传后不进入下一步

### 完成内容
- 使用 `comet-hotfix` 创建 change：`fix-md-resume-next-step`。
- 修复文件上传模式没有明显反馈的问题：上传 Markdown/PDF/Word 后显示“正在解析简历...”，处理中禁用模式切换、文件选择和拖拽重复提交。
- 修复后端 AI JSON 解析脆弱的问题：`/api/bootcamp/resume` 增加 `parseJsonFromAiText`，兼容纯 JSON、```json 代码块和 JSON 前后附加说明文字。
- 收紧简历画像和弱点预测 prompt，要求只返回指定 JSON 结构。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/bootcamp/ResumeUploader.tsx src/app/api/bootcamp/resume/route.ts --max-warnings 0` 通过
- `git diff --check -- src/components/bootcamp/ResumeUploader.tsx src/app/api/bootcamp/resume/route.ts openspec/changes/fix-md-resume-next-step` 通过
- `./init.sh` 通过（9/9）
- 重启 dev server 后 `/bootcamp/resume` 返回 200；未登录状态按中间件回到 `/login`，无运行时错误覆盖层
- 验证报告：`docs/superpowers/reports/2026-06-03-fix-md-resume-next-step-verify.md`

### 备注
- 当前工作区在本 hotfix 前已有大量未提交 UI 改动、OpenSpec 归档/删除和新增文件。本次没有回滚既有改动，也没有提交混合变更。

## [2026-06-03] Hotfix follow-up: 特训 Supabase 落库与开始特训自测

### 完成内容
- 使用 `kimi-webbridge` 在真实浏览器登录态中打开 Supabase SQL Editor，给远端项目 `aczcnilrwvsstoluacln` 执行训练营三张表建表 SQL：
  - `bootcamp_sessions`
  - `bootcamp_interviews`
  - `bootcamp_reports`
- 修复 `there is no unique or exclusion constraint matching the ON CONFLICT specification`：
  - 远端 `bootcamp_sessions.user_id` 已添加唯一约束 `bootcamp_sessions_user_id_key`
  - 本地 `supabase/schema.sql` 和 migration 同步为 `user_id ... unique not null`
- 新增 migration：`supabase/migrations/20260603150226_bootcamp_sessions_tables.sql`
- 修复 `/bootcamp/resume` 刷新后不显示已解析结果的问题：页面加载时读取 `GET /api/bootcamp/resume`，有记录则显示解析结果和“开始特训”。
- 修复 `/api/bootcamp/interview`：
  - AI 题目 JSON 输出增加代码块/包装文本容错解析
  - 重复生成同一天题目改为 `upsert`
  - 只保留当天 1-5 题，并清理多余题目
  - AI 少返回题目时用兜底题补满 5 道

### 真实浏览器自测结果
- 使用 `/tmp/test-resume.md` 构造同源 `resume.md` 文件，调用 `POST /api/bootcamp/resume`：
  - `status=200`
  - 返回 `session / parsed_profile / weakness_prediction`
  - `session.status=in_progress`
  - `session.current_day=0`
- 调用 `GET /api/bootcamp/resume`：
  - `status=200`
  - 从数据库读回 `parsed_profile / weakness_prediction`
- 刷新 `/bootcamp/resume`：
  - 页面显示工作经历、项目经历、技能栈、面试弱点预测和“开始特训”按钮
- 调用 `POST /api/bootcamp/interview`：
  - `status=200`
  - 返回 5 道题
  - 题号 `[1,2,3,4,5]`
- 调用 `GET /api/bootcamp/interview?day=1`：
  - `status=200`
  - 数据库读回 5 道题
  - `current_day=1`

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/bootcamp/interview/route.ts 'src/app/(app)/bootcamp/resume/page.tsx' src/app/api/bootcamp/resume/route.ts src/components/bootcamp/ResumeUploader.tsx --max-warnings 0` 通过
- `git diff --check -- 'src/app/(app)/bootcamp/resume/page.tsx' supabase/schema.sql supabase/migrations/20260603150226_bootcamp_sessions_tables.sql` 通过

### 备注
- WebBridge 的文件上传原语对隐藏 file input 返回浏览器侧 `Not allowed`，因此页面级上传自测改用“同源浏览器上下文构造 `resume.md` + fetch 同一 API”的方式；这仍然覆盖认证 cookie、AI 解析、Supabase 落库和读回。
- 为避免 `./init.sh` 的 Next build 与 dev server 同时写 `.next`，完整验证前先暂停了 dev server。

## [2026-06-04] Hotfix: 特训简历清空、解析回看与题目质量

### 完成内容
- 新增 `DELETE /api/bootcamp/resume`：当前登录用户可清空训练营会话，依赖数据库外键 cascade 删除对应面试题与报告；删除后再次查询确认没有残留会话。
- `/bootcamp/resume` 在已解析状态下新增“清空并重新上传”，清空成功后回到上传/粘贴入口。
- `/bootcamp` 对 `in_progress` 会话改为同时提供“查看简历解析”和“继续特训”，避免进入 Day 1 后绕过解析结果。
- `/api/bootcamp/interview` 出题 prompt 改为真实高阶 PM 面试追问：围绕简历项目、公司、模块和指标追问决策取舍、指标归因、系统边界、协同冲突和复盘。
- 增加题目后处理过滤，剔除 “CEO 找第二增长曲线 / 12 或 18 个月战略路线图 / 泛 GTM ROI” 等假大空题，并用简历锚点兜底补满 5 题。
- `src/app/layout.tsx` 增加 `suppressHydrationWarning`，压制浏览器翻译扩展向 `<body>` 注入 class 导致的开发态 hydration mismatch 提示。

### 真实浏览器自测结果
- Kimi WebBridge 打开 `http://localhost:3000/bootcamp/resume`，确认当前残留的是测试简历“云启科技 / 客户健康度评分系统”。
- 使用当前残留简历生成 Day 1 题目，`POST /api/bootcamp/interview` 返回 200 和 5 道题；题目围绕客户健康度评分系统、权限与审批流重构、指标归因、客户认可和规模化资源取舍追问，没有出现第二增长曲线类泛题。
- 点击页面“清空并重新上传”后，`GET /api/bootcamp/resume` 返回 404 `{ error: "未找到特训记录" }`。
- `/bootcamp/resume` 页面回到“上传文件 / 粘贴文本”状态；`/bootcamp` 回到初始“开始特训”状态。
- 重启 dev server 后 `http://localhost:3000/bootcamp/resume` 可访问。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/layout.tsx src/app/api/bootcamp/resume/route.ts src/app/api/bootcamp/interview/route.ts 'src/app/(app)/bootcamp/resume/page.tsx' 'src/app/(app)/bootcamp/page.tsx' --max-warnings 0` 通过
- `git diff --check -- src/app/api/bootcamp/resume/route.ts src/app/api/bootcamp/interview/route.ts 'src/app/(app)/bootcamp/resume/page.tsx' 'src/app/(app)/bootcamp/page.tsx'` 通过
- `./init.sh` 通过（9/9）

### 备注
- 工作区在本 hotfix 前已有大量未提交 UI、OpenSpec 归档/删除和新增文件。本次没有回滚既有改动。
- 清空操作已在当前登录用户真实 Supabase 数据上验证，测试简历没有留在训练营会话中。

## [2026-06-04] Hotfix: 特训评分反馈空壳问题

### 完成内容
- 修复 `/api/bootcamp/interview/answer` 评分 prompt 过于宽泛的问题：现在要求 AI 返回严格 JSON，包含总体评价、四维分数、亮点、不足、改进建议、答题框架、示例回答、改写示范和下一题练习。
- 增加 AI JSON 容错解析，兼容代码块和前后说明文字；增加分数字段和列表字段归一化，避免再落库空壳评价。
- 评分 API 支持只传 `interview_id` 重新评分，会读取数据库中已有 `user_answer`，用于修复旧版已落库的空评价。
- `AnswerEvaluation` 组件升级为 AI 面试教练反馈卡：展示总评、分数、推荐答题框架、示例回答、把用户回答改成更面试化的版本、亮点/不足和下一题练习。
- 对旧版不完整评价显示“重新生成反馈”提示；完整评价也保留“重新生成反馈”入口，方便用户重新生成更好的教练反馈。
- 前端显示层清洗 AI 列表自带编号，避免出现 `1 1.` 的重复序号。

### 真实浏览器自测结果
- 打开 `http://localhost:3000/bootcamp/interview`，复现旧空评价：分数和正文均为空，只剩评分卡框架。
- 页面识别旧空评价并显示“这条反馈内容不完整 / 重新生成反馈”。
- 点击“重新生成反馈”后，`POST /api/bootcamp/interview/answer` 使用原回答重新评分并落库。
- 刷新后第一题显示完整反馈：综合评分、结构化/逻辑性/专业度/创新性分数、总体评价、答题框架、示例回答、改写示范、亮点、不足、下一轮建议和下一题练习。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/bootcamp/interview/answer/route.ts 'src/app/(app)/bootcamp/interview/page.tsx' src/components/bootcamp/AnswerEvaluation.tsx src/types/bootcamp.ts --max-warnings 0` 通过
- `./init.sh` 通过（9/9）

## [2026-06-04] Redesign: 特训面试页宽屏布局

### 完成内容
- 使用 `redesign-existing-projects` 审查当前特训页，定位主要问题为 `max-w-3xl` 单栏居中导致大屏只利用约 1/3 宽度。
- `/bootcamp/interview` 主内容从窄单栏改为最大 1480px 的双栏工作台布局：
  - 左侧栏：今日进度、题目、已评分后的原回答、上一题/下一题导航。
  - 右侧栏：已评分时展示完整 AI 面试教练反馈；未评分时展示“作答抓手”四块提示，避免右侧空白。
- 左侧在桌面端使用 sticky，长反馈滚动时题目和原回答仍然可见，方便对照复盘。
- `InterviewQuestion` 在已评分后保留“你的原回答”，便于用户把 AI 示例和自己的回答并排对照。

### 真实浏览器自测结果
- 打开 `http://localhost:3000/bootcamp/interview`，页面显示左右双栏。
- DOM 实测：1920px 视口下主容器宽度 1480px，左栏约 571px，右侧反馈约 821px。
- 快照确认左侧包含今日进度、题目、原回答、导航；右侧包含 AI 面试教练反馈、答题框架、示例回答、改写示范、亮点/不足和下一题练习。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/bootcamp/interview/page.tsx' src/components/bootcamp/InterviewQuestion.tsx --max-warnings 0` 通过
- `./init.sh` 通过（9/9）

## [2026-06-04] UI 修复: 诊断阶段二访谈底部与 AI 头像

### 完成内容
- `/diagnosis/interview` 底部输入区从窄 textarea + 被撑高按钮，改为 max-w-5xl 居中 composer。
- 发送按钮固定为 112x56，避免被 textarea 高度拉成大方块。
- 快捷键提示移到输入条下方，输入框 placeholder 简化为“分享你的判断、例子或追问”。
- 机器人头像从 lucide Bot 图标换为渐变背景的 “AI” 教练头像，附带小星标，减少廉价机器人感。

### 真实浏览器自测结果
- Kimi WebBridge 打开 `http://localhost:3000/diagnosis/interview`，页面显示新 AI 教练头像和新输入区。
- DOM 实测：composer 宽 1024px，textarea 约 882x72，发送按钮约 112x56。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/diagnosis/interview/page.tsx' --max-warnings 0` 通过
- `./init.sh` 通过（9/9）

## [2026-06-04] Redesign: 首页工作台高密度 cockpit

### 完成内容
- `/dashboard` 去掉大号 PageHeader 和顶部两张大 CTA 卡，改为紧凑顶部栏、今日重点、主/次行动按钮。
- 新增 KPI strip：今日训练、连续天数、累计完成、最近诊断，降低首屏垂直占用。
- 首页内容改为 12 栅格 cockpit：左侧紧凑能力画像，中间成长趋势 + 维度训练表现，右侧最近诊断 + 下一步建议。
- `ProfileCard` 去掉大雷达图，改为维度条、均分和优先补强项；`GrowthChart` 图表高度压缩到 170px；`TrainingStats` 从大统计卡改为维度表现；`LatestReport` 合并最近诊断和行动建议。
- 空状态同步压缩，不再使用 300px+ 的居中大空态。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' src/components/dashboard/*.tsx --max-warnings 0` 通过
- `git diff --check -- 'src/app/(app)/dashboard/page.tsx' src/components/dashboard/ProfileCard.tsx src/components/dashboard/GrowthChart.tsx src/components/dashboard/TrainingStats.tsx src/components/dashboard/LatestReport.tsx` 通过
- `./init.sh` 通过（9/9）

### 真实浏览器自测结果
- 3000 端口已有旧 dev server 但访问 `/dashboard` 长时间无响应；改用 `npm run dev -- -p 3002` 启动独立 dev server。
- Headless Chrome 无登录态会进入登录页，系统 Chrome 打开 `http://localhost:3002/dashboard` 使用当前浏览器会话进入工作台。
- 截图 `/tmp/dashboard-cockpit-final.png` 确认：紧凑顶部栏、4 个 KPI、能力画像、成长趋势、维度训练表现、最近诊断均在首屏可见；三栏已加 `items-start`，空状态不再被拉伸成整列大空白。

## [2026-06-05] 日常训练: 个性化出题与结构化教练反馈

### 完成内容
- 新增 `src/lib/training/personalization.ts`：统一 AI JSON 容错解析、训练反馈字段归一化、题目推荐理由解析，以及基于现有诊断/训练/特训数据构造个性化上下文。
- 新增 Node 内置测试 `src/lib/training/personalization.test.ts`，覆盖结构化反馈归一化和题目推荐理由解析。
- `/api/train` 生成题目时读取当前用户最近诊断报告、最近 8 条训练记录和特训弱点预测，不改 schema；prompt 要求输出“为什么练这题”和题目正文，并避免重复近期题目。
- `/api/train` 答案分析从 Markdown 改为严格 JSON，要求输出综合评分、四维评分、亮点、盲区、建议、答题框架、示例回答、用户回答改写和下一题练习。
- `/training/session` 展示题目推荐理由，提交后解析结构化反馈并写入 `training_records.ai_feedback`，保留旧 Markdown 解析兜底。
- `/training/history/[id]` 支持回看结构化反馈，并保留旧训练记录的 Markdown 兜底展示。

### 验证结果
- `rm -rf /tmp/deepseek-agent-training-test && npx tsc --module commonjs --target ES2020 --outDir /tmp/deepseek-agent-training-test src/lib/training/personalization.test.ts --skipLibCheck --esModuleInterop --moduleResolution node && node --test /tmp/deepseek-agent-training-test/personalization.test.js` 通过
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts 'src/app/(app)/training/session/page.tsx' 'src/app/(app)/training/history/[id]/page.tsx' src/components/training/TrainingEvaluationPanel.tsx src/lib/training/personalization.ts src/lib/training/personalization.test.ts --max-warnings 0` 通过
- `git diff --check -- src/app/api/train/route.ts 'src/app/(app)/training/session/page.tsx' 'src/app/(app)/training/history/[id]/page.tsx' src/components/training/TrainingEvaluationPanel.tsx src/lib/training/personalization.ts src/lib/training/personalization.test.ts feature_list.json progress.md` 通过
- `./init.sh` 通过（9/9）

### 浏览器/API 自测结果
- 启动 `npm run dev -- -p 3002`，打开 `http://localhost:3002/training/session`；in-app browser 无登录态，被中间件正确重定向到 `/login`。
- 未登录态下 `/api/train` 的生成接口可返回训练题流，解析后包含 `【为什么练这题：...】` 推荐理由。
- 未登录态下 `/api/train` 的分析接口可返回结构化 JSON，脚本拼接 Vercel AI data stream 后 `JSON.parse` 成功，包含 `overall_score / understanding / framework / solution / decision_logic / thinking_framework / example_answer / improved_answer / next_practice`。
- 未登录态下自动保存题目调用 `/api/training/questions` 返回 401，符合现有 Supabase 鉴权；登录后页面会继续走落库路径。

## [2026-06-05] UI 收口: 训练首页、诊断量表与旧导航清理

### 完成内容
- 删除未被 `src` 引用的旧 `src/components/Sidebar.tsx`，清理 Material Symbols、旧 `surface-container` / `on-surface` token 和第二套导航实现，避免后续误用造成视觉割裂。
- `/diagnosis/scale` 五个能力维度从 emoji 图标改为 lucide 图标（Compass / Workflow / ChartNoAxesCombined / SearchCheck / BadgeDollarSign），维持专业 B 端工具气质。
- `/training` 首屏从“多卡片并列”收敛为：
  - 今日推荐训练：根据未覆盖维度或最低训练均分推荐练习方向。
  - 本月节奏：展示本月训练天数。
  - 统计 strip：累计完成、连续天数、维度覆盖。
  - 维度训练分布下沉到第二层，移除首屏能力雷达，减少第一行动竞争。
- 新增临时结构验证脚本 `tmp/verify-ui-refactor.mjs`，覆盖旧 Sidebar 残留、诊断 emoji、训练首页首屏聚焦三项。

### 验证结果
- `./init.sh` baseline 通过（9/9）
- `node tmp/verify-ui-refactor.mjs` 先失败，改造后通过
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/diagnosis/scale/page.tsx' 'src/app/(app)/training/page.tsx' --max-warnings 0` 通过
- 真实浏览器打开 `http://127.0.0.1:3000/training` 截图保存到 `tmp/training-route.png`，确认首屏主任务、节奏卡和统计 strip 正常显示

### 备注
- `/diagnosis/scale` 在 in-app browser 无登录态时被重定向到 `/login`，本轮未做登录后截图验证；由结构验证、TypeScript 和 ESLint 覆盖。
- 工作区在本轮前已有大量未提交 UI、OpenSpec 归档/删除和新增文件。本次没有回滚既有改动。

## [2026-06-05] Redesign: 案例库详情页阅读工作台

### 完成内容
- `/training/cases/[product]` 从窄单栏详情页改为最大 1480px 的三栏阅读工作台，提升宽屏中间区域利用率。
- 左侧保留分析视角切换，桌面端 sticky；移动端和平板端使用折叠视角选择器，避免 768-1023px 宽度没有导航入口。
- 中间正文放入 raised article panel，正文内容保持 `max-w-[860px]` 居中，兼顾宽屏利用率和长文可读性。
- 顶部增加案例拆解摘要条，展示当前视角和已生成视角数量。
- 右侧增加“阅读抓手 / 视角进度 / 内容状态”，把原本空白区域变成阅读辅助区。
- “重新生成”按钮改为强制 `refresh=true`，避免只是读取缓存文章。

### 验证结果
- `node tmp/verify-case-detail-redesign.mjs` 通过
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/training/cases/[product]/page.tsx' --max-warnings 0` 通过
- `git diff --check -- 'src/app/(app)/training/cases/[product]/page.tsx' tmp/verify-case-detail-redesign.mjs feature_list.json progress.md` 通过
- `./init.sh` 通过（9/9）

### 浏览器自测结果
- 复用 3000 端口旧 dev server 首次打开详情页时出现 Next 开发态 runtime overlay；停止旧进程并清理 `.next/cache` 后，使用当前工作区重启 `npm run dev -- --hostname 127.0.0.1 --port 3000`。
- 重新打开 `http://127.0.0.1:3000/training/cases/Salesforce?perspective=overview` 后，详情页路由先返回 200，随后因无登录态/API 401 被现有中间件重定向到 `/login`。
- 浏览器最终显示登录页，无 runtime overlay。

### 备注
- 本次未改 Supabase schema、API 路由或案例库数据表结构；仅调整详情页 UI 和重新生成按钮调用参数。
- 工作区在本轮前已有大量未提交 UI、OpenSpec 归档/删除和新增文件。本次没有回滚既有改动。

## [2026-06-06] Feature: 案例库重写、全局行动中心与复盘归档

### 完成内容
- `/training/cases` 从缺失/旧列表页重写为案例工作台：产品列表、搜索、自定义产品、完整拆解入口、决策推演入口、作答区、AI 反馈侧栏和作答检查清单。
- 新增 `/api/cases/simulation`：
  - `generate` 使用 AI 生成指定产品的 B 端决策推演场景。
  - `evaluate` 使用结构化教练反馈评估用户回答，并写入 `training_records`，包含 `ai_feedback.source = "case_simulation"`、产品、场景标题、隐藏风险和评分。
  - 不新增依赖、不改 Supabase schema。
- `/api/cases?action=list-products` 在未登录态返回静态预设产品，方便案例库入口展示；读取/生成文章与推演评估仍按现有认证要求。
- `/api/dashboard` 增加 `nextActions`，基于是否完成诊断、今日训练数、近次均分、薄弱维度和案例推演记录生成主行动、次行动与能力信号。
- `/dashboard` 顶部升级为全局行动中心，展示系统推荐下一步、三个快捷行动和当前信号。
- `/api/training/stats` 的 recent 记录增加 `score` 与 `ai_feedback`，供复盘归档使用。
- `/training` 历史区升级为“复盘归档”，展示评分、案例推演来源、最近下一步练习，并保留进入案例推演入口。
- `/training/history/[id]` 升级为 1280px 双栏复盘工作台：顶部元信息、来源/难度/评分、题目、原回答、结构化教练反馈、下一步/盲区/框架摘要和案例隐藏风险。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/training/cases/page.tsx' src/app/api/cases/simulation/route.ts --max-warnings 0` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' src/app/api/dashboard/route.ts --max-warnings 0` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/training/page.tsx' 'src/app/(app)/training/history/[id]/page.tsx' src/app/api/training/stats/route.ts --max-warnings 0` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/cases/route.ts 'src/app/(app)/training/cases/page.tsx' --max-warnings 0` 通过
- 真实临时登录态 API 验证通过：`POST /api/cases/simulation` action=evaluate 返回 `recordId=b5d0a95d-051e-4338-8ca4-c92ee4cd2bfc`，随后 `GET /api/training/history/b5d0a95d-051e-4338-8ca4-c92ee4cd2bfc` 读回 `source=case_simulation`、`product=飞书`、`score` 和 `next_practice`
- `git diff --check` 通过
- `./init.sh` 通过（9/9）

### 浏览器检查
- 启动 `npm run dev -- --hostname 127.0.0.1 --port 3000`，打开 `http://127.0.0.1:3000/training/cases`。
- in-app Browser 首次成功显示新版案例工作台 DOM：案例库标题、案例工作台、生成决策推演、阅读完整拆解、训练闭环、作答区和 AI 教练反馈侧栏。
- 首次检查发现未登录态 `/api/cases?action=list-products` 返回 401，导致预设产品显示为 0；已修复为未登录态返回静态预设产品。
- 后续刷新验证时 Browser 插件触发 URL policy 拦截，未继续绕过；真实登录态 API 写入读回和 `./init.sh` 已覆盖本轮关键链路。

### 备注
- 本轮没有提交 git，因为工作区已有大量非本轮改动与删除项；没有回滚既有改动。
- 本轮仍保留现有认证边界：真正读写 Supabase 的推演评估、案例文章生成、训练记录读取都需要登录；已用临时测试账号验证登录态写入和读回。

## [2026-06-06] UX 调整: 工作台与案例库焦点收束

### 完成内容
- `/dashboard` 顶部行动区进一步收束为“今天先做这件事”，主行动使用唯一显眼按钮，推荐依据和次行动降低视觉权重。
- `/api/dashboard` 过滤与主行动同类型的 secondary action；未诊断状态下 secondary 不再返回另一个 diagnosis 入口。
- `LatestReport` 未诊断空状态去掉“开始诊断”显眼按钮，只保留状态说明；已有报告时“查看完整报告”降级为文本链接。
- `/training/cases` 首屏进一步聚焦“先做一题真实产品决策”，恢复产品列表可见，当前产品明确展示，空 AI 反馈侧栏改为提交后才显示。
- `/training/cases` 允许未登录预览入口页；真正生成推演、提交反馈、读取训练记录仍走登录保护。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' src/app/api/dashboard/route.ts src/components/dashboard/LatestReport.tsx --max-warnings 0` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/layout.tsx' 'src/app/(app)/dashboard/page.tsx' 'src/app/(app)/training/cases/page.tsx' --max-warnings 0` 通过
- 临时登录态请求 `/api/dashboard` 返回 `primary.kind=diagnosis`，secondary 仅包含 `case/review`，不再包含 diagnosis。
- in-app Browser 打开 `/training/cases` 确认：主焦点文案、10 个产品、当前飞书、产品列表可见，空 AI 反馈侧栏不显示。

## [2026-06-12] Hotfix: 登录跳转与训练入口路由

### 完成内容
- 修复登录按钮点击后的跳转错误：`/login` 登录成功后先确认 Supabase session，再用 `window.location.replace("/dashboard")` 硬跳转，避免客户端 chunk transition 时出现 Runtime ChunkLoadError。
- 修复训练入口进入旧版出题页：`TRAINING_SESSION_ROUTE` 统一为 `/training/session`，移除 middleware、`next.config.ts` 和训练 session 页里追加 `entry=dashboard&ui=a1` 的旧版强制跳转。
- 增加 `src/lib/routes.test.mjs` 覆盖训练 session canonical route，确保入口路由不再携带旧 query。
- `src/app/layout.tsx` 保留 `suppressHydrationWarning`，避免浏览器扩展注入属性时打断开发态验证。

### 真实鼠标点击验证
- 使用 Computer Use 控制豆包浏览器，在 `http://localhost:3000/login` 输入账号 `210134258@qq.com` 和密码后，鼠标点击“登录”：最终 URL 为 `localhost:3000/dashboard`，工作台主体完整渲染，无 Runtime ChunkLoadError 或 Next overlay。
- 在同一真实浏览器会话中鼠标点击顶部“训练”，进入 `localhost:3000/training`；再鼠标点击“开始今日训练”：最终 URL 为 `localhost:3000/training/session`，没有 `entry` 或 `ui` 参数，页面显示新版“先读题，再完成你的判断”出题界面。

### 验证结果
- `npm run typecheck` 通过
- `node --experimental-strip-types src/lib/routes.test.mjs` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(auth)/login/page.tsx' 'src/app/(app)/training/session/page.tsx' src/lib/routes.ts src/lib/routes.test.mjs src/middleware.ts src/app/layout.tsx next.config.ts --max-warnings 0` 通过
- `npm run build` 通过；仅保留既有 `src/components/auth/AuthShowcase.tsx` 使用 `<img>` 的 Next 性能警告
- `./init.sh` 通过（9/9）

### 备注
- 工作区在本轮前已有大量未提交 UI、OpenSpec 和 Supabase 相关改动；本轮没有回滚任何既有改动，也没有提交混合变更。

## [2026-06-12] Hotfix: 训练真实出题页对齐新版 A1 UI

### 完成内容
- 将真实 `/training/session` 的提交前界面进一步对齐新版 A1 方案：白色 sticky 顶栏、`#F7F9FB` 页面底、`#EEF2FF` 高权重题卡、题目标题“本题要你做一个真实取舍”、回答区“先写结论，再补依据”和更大的作答空间。
- 将真实 `/training/session` 的提交后界面进一步对齐新版体验：左侧压缩为“原题 / 我的回答”参考信息，右侧以 AI 产品教练反馈为主焦点，保留结构化 `TrainingEvaluationPanel` 和 markdown fallback。
- 保留真实训练业务流：`/api/train` 出题/分析、`/api/training/questions` 保存题目、`/api/training/record` 保存训练记录、`/api/training/feedback` 题目反馈、`/api/training/sessions` 一轮结束落库。
- 将训练 canonical route 固定为 `/training/session`，避免入口进入旧版页面或静态 demo。

### 验证结果
- `node --experimental-strip-types src/lib/routes.test.mjs` 通过
- `npm run typecheck` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/training/session/page.tsx' 'src/app/(app)/training/page.tsx' src/lib/routes.ts src/lib/routes.test.mjs --max-warnings 0` 通过
- `npm run build` 通过；仅保留既有 `src/components/auth/AuthShowcase.tsx` 使用 `<img>` 的 Next 性能警告
- `./init.sh` 通过（9/9）

### 部署状态
- 后续已切换到 Git 拉取式部署，生产目录 `/www/wwwroot/shengyunjie` 对应 `deploy/pm` 分支。
- 已部署提交：`bdb5fc5 chore: wait for app health during deploy`。
- 公网只读验证：`BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。
- 仍建议补做一次生产真实鼠标点击回归：Kimi WebBridge 打开 `/training`，Computer Use 点击“开始今日训练”，确认最终进入 `/training/session` 新版页。

## [2026-06-12] Hotfix follow-up: 训练入口缓存防复发

### 完成内容
- 将训练 canonical route 固定为 `/training/session`，`TRAINING_SESSION_ROUTE` 和 `routes.test.mjs` 已同步。
- 新增训练 segment 缓存策略：`src/app/(app)/training/layout.tsx` 设置 `dynamic = "force-dynamic"`、`revalidate = 0`、`fetchCache = "force-no-store"`，避免 `/training` 和 `/training/session` 再生成长期缓存 HTML。
- 将新版真实训练页抽为 `src/components/training/TrainingSessionClient.tsx`，由 `/training/session` 渲染真实训练组件。
- 移除生产体验里的“训练题页面 UI 方案预览”和 A1 状态切换壳，保留提交前/提交后自动切换。

### 生产状态
- 裸路径缓存问题已通过动态渲染策略和 nginx/宝塔缓存清理解决。
- 公网响应头已确认 `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`。

## [2026-06-12] Deploy tooling: 固化 git 拉取式生产部署

### 完成内容
- 新增 `scripts/deploy-production.sh`：默认从 `origin/deploy/pm` 拉取代码，保留 `.env.local`、按 `package-lock.json` hash 决定是否 `npm ci`、清空 `.next` 后构建、PM2 delete 后重新 start，并检查本机 `/training` 与 `/training/session`。
- 新增 `scripts/verify-production-training.sh`：生产部署后检查裸路径不再带一年级 `s-maxage`，训练首页入口指向 `/training/session`，session 页面包含新版标记且不包含“训练题页面 UI 方案预览”。
- 部署脚本会自动检查 nginx 是否配置 `proxy_cache_path` / `fastcgi_cache_path`，如存在则清理对应缓存目录并 reload nginx。
- 新增 `docs/DEPLOYMENT.md`，记录 `deploy/pm` 分支、服务器目录、PM2 app、部署命令和验证命令。

### 验证结果
- `bash -n scripts/deploy-production.sh` 通过
- `bash -n scripts/verify-production-training.sh` 通过
- `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`

## [2026-06-12] Chore: 工作区整理与旧前端清理

### 完成内容
- 删除旧静态 HTML 原型目录 `prototypes/`，这些早期页面不再作为产品路由、测试或设计交付物使用。
- 删除旧 preview 路由 `/training/session-ui-preview`，生产训练入口只保留 `/training/session`。
- 删除误提交的根目录 `1`，该文件只是 Next.js workspace warning 输出。
- 清理本地忽略产物：`tmp/`、`.next/`、`.cowork-temp/`、`.DS_Store`、`tsconfig.tsbuildinfo`。
- 将 `AuthShowcase` 的 `<img>` 替换为 `next/image`，消除全量 ESLint 中唯一 warning。
- 修复 `init.sh` 的 ESLint 检查计数，避免 lint 失败却显示全部通过。
- 更新生产验证脚本，不再请求已删除的 `/training/session-ui-preview`。

### 验证结果
- `node --experimental-strip-types src/lib/routes.test.mjs` 通过
- `npm run typecheck` 通过；清理 `.next` 和 `tsconfig.tsbuildinfo` 后也可独立通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0` 通过
- `npm run build` 通过，路由表只保留 `/training/session`，不再包含 preview route
- `./init.sh` 通过（10/10），ESLint 检查不再误报
- `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`

### 待办
- 本轮不部署、不重启 PM2。
- 生产真实鼠标点击回归仍可单独补做。

## [2026-06-19] 日常训练: 维度出题方向收敛

### 背景判断
- 用户反馈日常训练第一题“战略思维”体感过复杂，不够像可提升能力的训练。
- 重新审视后确认：5 个能力维度总体保留，但需要把维度名翻译成“可训练的小动作”，避免按“战略思维”直接生成宏大战略作文题。

### 完成内容
- 新增 `src/lib/training/dimension-strategy.ts`：定义 5 个维度的能力定位、推荐框架、允许题型、回答训练重点和禁止题型。
- 战略思维重新收敛为“业务判断与取舍”：训练产品动作反推业务意图、识别牺牲项/机会成本、选择验证指标。
- `/api/train` 生成题接入维度策略：出题时只能从对应维度的允许题型中选择小场景，并要求用户回答 2-3 个具体判断问题。
- `/api/train` 分析反馈接入维度策略：评分除通用理解/框架/方案/决策逻辑外，优先参考该维度的专项训练重点。
- `docs/2026-05-19-prompt-strategy.md` 同步更新 5 个维度定义和出题规则。
- `/training/session` 示例题从 A/B 大战略取舍改为“免费试用 30 天改 7 天 + 预约顾问”的业务判断题，页面标签改为“业务判断题 / 业务意图识别 / 验证指标”。
- 将旧的 `src/lib/training/personalization.test.ts` 迁移为 `.mjs` 测试文件，和项目其他 Node 内置测试风格一致，避免 Node 直接执行与 `tsc` 的扩展名规则冲突。

### 验证结果
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs` 通过（Node 对 TS ESM 有既有 MODULE_TYPELESS_PACKAGE_JSON warning，不影响结果）
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/lib/training/dimension-strategy.ts src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过
- `git diff --check` 通过

### 后续建议
- 可以补一个真实出题接口验证：登录态调用 `/api/train` 生成“战略思维”题，确认题面落在业务动作、取舍和指标验证，而不是战略路线图。

## [2026-06-19] Deploy: 日常训练维度出题策略上线

### 部署内容
- 本地提交 `e5a35fe refine training dimension question strategy` 已推送到 `origin/deploy/pm`。
- 通过腾讯云 OrcaTerm root shell 在生产目录 `/www/wwwroot/shengyunjie` 执行 `bash scripts/deploy-production.sh`。
- 生产部署脚本拉取 `origin/deploy/pm`，重置到 `e5a35fe`，跳过未变化依赖安装，重新构建 Next.js，重启 PM2 `shengyunjie`，清理 nginx cache。

### 验证结果
- 本地上线前 `./init.sh` 通过（10/10）。
- 服务器部署输出：`DEPLOY_OK deploy/pm e5a35fe`。
- 服务器脚本内公网验证：`VERIFY_OK https://pm.imfly.site`。
- 本机公网复验：`BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。
- 本机 `curl https://pm.imfly.site/training/session` 确认生产页已使用新 chunk `page-ac33fcca71e41c94.js`，并包含新文案“业务判断”，不再是旧的“机会成本分析”标签。

### 状态
- 生产环境已上线本次日常训练出题方向调整。

## [2026-06-20] Fix: 清除战略思维旧机会成本框架残留

### 背景判断
- 用户线上截图显示：日常训练第一题标签已是“业务判断”，但题干仍要求“运用机会成本分析框架”并计算显性/隐性机会成本，说明 2026-06-19 的改动只改到标签和部分策略，生成 prompt 仍被旧 framework 锚定。
- 用户同时指出答题区固定提示“推荐结构：结论 / 依据 / 风险 / 验证”不应写死；该提示会让不同维度被同一模板约束。

### 完成内容
- `src/lib/training/dimension-strategy.ts` 中战略思维框架从“业务意图识别 / 机会成本分析 / 战略取舍框架”改为“业务意图识别 / 取舍判断 / 验证指标框架”。
- 战略思维策略移除“机会成本/显性成本/隐性成本”运行时锚点，改用“选择标准、先做什么、暂时不做什么、放弃项、风险边界、验证指标”。
- `src/lib/training/dimension-strategy.test.mjs` 增加回归断言：战略思维 prompt 不应包含机会成本分析、显性/隐性成本等旧框架词。
- `/training/session` 答题区删除固定“推荐结构：结论 / 依据 / 风险 / 验证”，标题改为“写下你的判断”；旧预览变体中的同类固定提示也已删除。
- 前端样例中的“显性收益/隐性成本”改为“业务目标/暂不做什么/验证指标”。
- `docs/2026-05-19-prompt-strategy.md` 同步改为业务动作反推、取舍判断、资源排序、验证指标，并禁止抽象成本计算题。

### 验证结果
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs` 通过（Node 对 TS ESM 有既有 MODULE_TYPELESS_PACKAGE_JSON warning，不影响结果）。
- `rg -n "推荐结构：结论 / 依据 / 风险 / 验证|机会成本分析|显性机会成本|隐性机会成本|显性成本|隐性成本" src docs -S -g '!*.test.mjs'` 无运行代码/文档残留。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/training/dimension-strategy.ts src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- `git diff --check` 通过。

## [2026-06-20] UX: 品牌阶梯图标替换

### 完成内容
- 根据用户确认的“阶梯 + 平台”方向，新增复用组件 `src/components/brand/BrandMark.tsx`。
- 顶部导航、登录页、注册页和认证展示区不再使用 `GraduationCap`，统一替换为深青色阶梯平台品牌标志。
- 新增 `src/app/icon.svg`，并在 `src/app/layout.tsx` metadata 中声明 `/icon.svg` 作为浏览器标签页图标。
- 新增 `src/components/brand/brand-mark.test.mjs` 回归检查，防止品牌位重新出现毕业帽图标或 favicon 丢失阶梯图形。
- 将 `.superpowers/` 加入 `.gitignore`，避免视觉草案工具产物进入部署提交。

### 验证结果
- `node --test src/components/brand/brand-mark.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/brand/BrandMark.tsx src/components/TopNav.tsx 'src/app/(auth)/login/page.tsx' 'src/app/(auth)/register/page.tsx' src/components/auth/AuthShowcase.tsx src/app/layout.tsx --max-warnings 0` 通过。
- `npm run build` 通过，构建路由包含 `/icon.svg`。
- `./init.sh` 通过（10/10）。

### 部署结果
- 已提交并推送：`27eaba8 feat: replace brand icon with stair mark`。
- 生产部署脚本输出：`DEPLOY_OK deploy/pm 27eaba8`。
- `curl -I https://pm.imfly.site/icon.svg` 返回 `HTTP/2 200`，`content-type: image/svg+xml`。
- `curl -s https://pm.imfly.site/login | rg -n 'icon\.svg|升云阶|_next/static'` 确认页面 HTML 引用 `/icon.svg`，并渲染 `升云阶阶梯标志`。
- `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。

## [2026-06-20] Docs: 已完成功能文档债回补

### 背景
- 用户指出需要回写的不止品牌图标，还包括此前做完但文档未补/未改的功能。
- 审计对象：近期已完成并有验证/部署记录的 6 月 12 日训练入口与部署工具、6 月 19 日维度出题策略、6 月 20 日战略思维热修。

### 回补内容
- 新增 `docs/superpowers/specs/2026-06-12-training-production-routing-design.md`，记录训练入口统一、动态缓存策略、Git 拉取式部署、旧 preview/原型清理。
- 新增 `docs/superpowers/reports/2026-06-12-training-production-routing-verify.md`，记录训练入口与生产部署稳定性验证。
- 新增 `docs/superpowers/specs/2026-06-19-training-dimension-strategy-design.md`，记录五维训练策略收敛、战略思维业务判断化和 `/api/train` 接入方式。
- 新增 `docs/superpowers/reports/2026-06-19-training-dimension-strategy-verify.md`，记录维度出题策略本地和生产验证。
- 新增 `docs/superpowers/specs/2026-06-20-training-strategy-prompt-hotfix-design.md`，记录机会成本旧框架残留清理、固定推荐结构删除和回归测试。
- 新增 `docs/superpowers/reports/2026-06-20-training-strategy-prompt-hotfix-verify.md`，记录战略思维热修验证结果。
- 更新 `feature_list.json`，在 `training-001` 和 `ux-001` 证据中补充新增文档索引。
- 2026-06-25：训练题质量升级，新增 `src/lib/training/question-bank.ts` 作为高阶产品题种子池（30+ 条，带 source/sourceUrl/usageRights/variationAxes/forbiddenPatterns），`/api/train` 生成前先选种子并注入种子材料，同时把今日会话题目与历史记录一起参与重复惩罚；`question-bank.test.mjs` 与 `route.test.mjs` 覆盖了种子密度、家族避让、当天题规避和 prompt 注入。验证：`node --test src/lib/training/question-bank.test.mjs src/app/api/train/route.test.mjs`、`npx tsc --noEmit`、`./init.sh` 通过。

### 验证结果
- `feature_list.json` JSON 解析通过。
- 新增文档均指向已有提交、命令和生产验证证据，不改变运行代码。

## [2026-06-20] Fix: 训练提交后分析结果页复盘体验

### 背景判断
- 用户截图指出提交后结果页有三处问题：左侧“题目/回答”被截断且无法查看全文；“AI 产品教练反馈”同一段反馈上下重复；“示例回答”和“把你的回答改成这样”信息价值重叠。
- 判断后保留“示例回答”作为唯一高质量答案示范，把可执行修改动作继续放在“下一轮立刻这样改”，不再展示第二个改写答案。

### 完成内容
- `TrainingSessionClient` 提交后左侧参考区从 `line-clamp` 改为固定阅读区 + 内部滚动，原题和我的回答都可完整回看。
- `TrainingEvaluationPanel` 增加 `hideSummary`，训练提交后的外层摘要保留一处，面板内部不再重复渲染同一段教练反馈。
- 训练反馈 UI 删除“把你的回答改成这样”，示例回答改为单列重点展示。
- `TrainingEvaluation` 契约移除 `improved_answer`，`/api/train` 和案例推演评估 prompt 不再要求 AI 生成该字段，减少无用输出。
- 增加回归测试，确认即使 AI 旧响应带 `improved_answer`，归一化后的训练反馈也不再暴露该字段。

### 验证结果
- `node --test src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/components/training/TrainingEvaluationPanel.tsx src/lib/training/personalization.ts src/app/api/train/route.ts src/app/api/cases/simulation/route.ts --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

### 备注
- 内置浏览器连接在本轮出现工具层错误：`codex/sandbox-state-meta: missing field sandboxPolicy`，未能做浏览器截图复验；本轮已用源码、类型、lint 和构建完成验证。

## [2026-06-20] Feature: 当天训练进度恢复

### 背景判断
- 用户希望当天已做过的题目不要因误点击或跳失而重复从第一题开始。
- 现有 `training_records` 已记录用户当天提交过的维度，`training_sessions` 已按天缓存题目，因此不需要新增 Supabase 表或 schema 字段。

### 完成内容
- 新增 `src/lib/training/session-progress.ts`，用标准五维度顺序根据当天已完成维度计算下一题索引。
- `/api/training/sessions?date=YYYY-MM-DD` 现在返回 `completedDimensions` 和 `nextIndex`，并按北京时间查询当天 `training_records`。
- `/training/session` 首次进入会读取当天状态，复用 `training_sessions.questions` 中已生成的题目，并自动跳到下一道未完成题。
- 顶部“结束”按钮左侧新增“重新开始”，仅重置当前页面状态并从第一题开始，不删除有效训练历史。
- `/api/training/questions` 保存题目时改为先读旧 `questions` 再合并写入，避免后续维度题目覆盖当天已缓存题目。

### 验证结果
- TDD 红灯：`node --test src/lib/training/session-progress.test.mjs` 先因缺少模块失败。
- `node --test src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/app/api/training/sessions/route.ts src/app/api/training/questions/route.ts src/lib/training/session-progress.ts src/lib/training/session-progress.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

### 备注
- 本次未新增数据库 schema，避免 RLS / Data API 暴露范围变化。

## [2026-06-20] UX: 训练题页按钮与固定提示清理

### 背景判断
- 用户截图指出顶部“重新开始”和“结束”按钮视觉权重不统一。
- 题目卡里的固定句子“本题要你做一个真实取舍”每题重复出现，信息价值不高，会干扰阅读题干。

### 完成内容
- `/training/session` 顶部“重新开始”和“结束”统一为同高度、同间距、同 hover 的文本按钮样式。
- 移除题目卡固定标题“本题要你做一个真实取舍”。
- 同步移除题干 Markdown 上方多余 `mt-2`，让标签下方直接进入题目正文。

### 验证结果
- `rg -n "本题要你做一个真实取舍" src/components/training/TrainingSessionClient.tsx src` 无匹配。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

### 部署记录
- 首次生产部署已构建并重启 PM2 到 `cefa72a`，但旧验证脚本仍要求页面包含已删除文案“本题要你做一个真实取舍”，因此脚本末尾校验失败。
- 已同步更新 `scripts/verify-production-training.sh`：改为校验“重新开始”“结束”存在，并禁止旧提示文案出现。
- `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。

## [2026-06-20] Tweak: 日常训练每题收敛为两问

### 背景判断
- 用户截图指出当前题干通常包含 3 个追问，单题压力过大，不利于循序渐进训练。
- 日常训练的目标应是稳定练一个小判断动作，而不是把每题做成一次小面试。

### 完成内容
- `/api/train` 生成题 prompt 从“回答 2-3 个具体判断问题”改为“严格包含 2 个具体判断问题”。
- 两问结构固定为：一个核心判断 + 一个落地、风险或验证追问。
- 明确禁止第 3 个问题，也禁止通过“注意/补充要求/额外思考”形成隐性第三问。
- 同步更新 `docs/2026-05-19-prompt-strategy.md` 和 `docs/superpowers/specs/2026-06-19-training-dimension-strategy-design.md`。
- 增加回归测试，防止出题 prompt 重新出现 `2-3 个具体判断问题`。

### 验证结果
- TDD 红灯：新增测试先因 `/api/train` 仍包含 `2-3 个具体判断问题` 失败。
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `rg -n "2-3 个具体判断问题|2-3个具体判断问题" src docs -S` 无匹配。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/lib/training/dimension-strategy.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。

## [2026-06-20] Tweak: 答题区显示 AI 极简提点

### 背景判断
- 用户指出“写下你的判断”没有信息价值，初阶产品容易不知道从哪里下手。
- 答题前适合给“思考入口”，但不能给结论或示范答案，否则会削弱训练判断力。

### 完成内容
- `/api/train` 出题输出从两段扩展为三段：`为什么练这题`、`答题提点`、`题目正文`。
- `答题提点` 限制为不超过 25 字，只提示思考入口，不给结论、不替用户作答。
- `parseGeneratedQuestionText` 新增 `hint` 解析，兼容旧的原因 + 题目格式。
- `/training/session` 答题区标题从固定“写下你的判断”改为显示 AI 生成提点。
- `/api/training/questions` 支持保存 `{ text, reason, hint }`，继续写入既有 `training_sessions.questions` JSON，不改 schema。
- 今日进度恢复兼容旧字符串题目；旧题没有 hint 时按维度给兜底提点。
- `docs/2026-05-19-prompt-strategy.md` 同步记录答题提点规则。

### 验证结果
- TDD 红灯：新增测试先因缺少 `答题提点` prompt 约束、解析器误吞提点而失败。
- `node --test src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/app/api/training/questions/route.ts src/components/training/TrainingSessionClient.tsx src/lib/training/personalization.ts src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。

## [2026-06-20] Tweak: 当天训练题目缓存复用

### 背景判断
- 用户担心进入训练页自动刷新题目会浪费 token。
- 现有 `training_sessions.questions` 已经按天保存题目，不需要新增表或字段；核心是前端不要在“重新开始/再来一轮”时清空题目状态触发自动出题。

### 完成内容
- `/training/session` 的“重新开始”现在只清空回答、分析、分数和流式文本，保留当天已生成题目缓存。
- 完成 5 题后的下一轮同样保留已生成题目，不再清空 `questions` 触发 `/api/train`。
- “换一题”仍是唯一显式重新生成入口，会继续调用 `generateQuestion(currentDim)` 并保存覆盖当前维度题目缓存。
- 新增回归测试，锁定 `handleRestart` 和下一轮逻辑不得清空题目缓存，同时确认手动换题仍可重新生成。

### 验证结果
- TDD 红灯：新增测试先因 `handleRestart` 含 `setQuestions({})` 失败。
- `node --test src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/lib/training/session-progress.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-21] Tweak: 答题区升级为框架思维引导

### 背景判断
- 用户认为短句“提点”容易变成题目细节摘要，不能帮助用户形成可迁移的框架思维。
- 当前阶段应先降低初阶用户上手门槛，帮助用户识别问题本质、建立拆解路径和判断闭环；后续用户水平提高后，再考虑根据弱项做个性化纠偏提点。

### 完成内容
- `/api/train` 的“答题提点”规则升级为框架思维引导：明确生成原因是降低上手门槛、沉淀可迁移产品思维，而不是提示当前题答案。
- 引导长度从 25 字以内放宽为 40-90 字，允许 AI 自由组织结构，不固定句式。
- Prompt 要求引导覆盖问题本质、拆解路径和判断闭环，禁止复述题干细节、给具体答案或替用户选择方案。
- `/training/session` 答题区改为独立“思考框架”引导区，小字号、舒适行高展示几十字内容，避免长文本挤在标题里。
- 旧缓存题如果仍带短 hint，会自动使用新的维度框架兜底，避免继续露出旧短句风格。
- `docs/2026-05-19-prompt-strategy.md` 同步更新出题策略记录。

### 验证结果
- TDD 红灯：新增测试先因 `/api/train` 仍包含“不超过 25 字/极简提示”失败。
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/components/training/TrainingSessionClient.tsx src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-21] Fix: 思考框架只展示 AI 当前题生成结果

### 背景判断
- 用户测试发现题目还没出来时，“思考框架”已经显示，担心它是写死或按维度默认提供。
- 这个担心成立：上一版前端确实有 `DIM_HINTS` 维度兜底，加载中也会显示默认框架，不符合“根据题目生成框架引导”的需求。

### 完成内容
- 移除 `/training/session` 前端的维度默认框架兜底。
- `getQuestionHint` 只接受当前题 `question.hint`，且长度达到合格阈值才返回；旧短 hint、无 hint、加载中或生成失败都不显示“思考框架”区。
- 答题区保留“思考框架”展示样式，但改为条件渲染，确保用户看到的引导来自 AI 针对当前题生成并保存的结果。
- 增加回归测试，禁止组件重新引入 `DIM_HINTS` 或写死维度框架。

### 验证结果
- TDD 红灯：新增测试先因组件仍包含 `const DIM_HINTS` 失败。
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/lib/training/dimension-strategy.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-21] Fix: 旧缓存题二次解析框架引导

### 背景判断
- 用户截图中 `【答题提点：...】` 出现在题目卡顶部，但答题区“思考框架”为空。
- 判断原因：历史缓存的 `training_sessions.questions[dim].text` 已经把 AI 输出段落整体存成题干，恢复缓存时只读取 `hint` 字段，没有对旧题干二次解析。

### 完成内容
- `normalizeStoredQuestion` 对字符串缓存和对象缓存的 `text/question` 都会调用 `parseGeneratedQuestionText`。
- 如果旧题干里包含 `【答题提点】`、`【为什么练这题】` 或 `题目正文`，恢复时会拆出 `hint/reason`，并清理题目正文，避免提示混进题目卡。
- `parseGeneratedQuestionText` 增加测试覆盖模型省略 `题目正文` 标签、只用 inline `【答题提点：...】` 后直接输出题目的格式。
- 保持上一轮原则：不会用维度写死兜底；只有解析到当前题真实 hint 时才展示“思考框架”。

### 验证结果
- TDD 红灯：新增测试先因缓存恢复路径未调用 `parseGeneratedQuestionText(text)` 失败。
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-21] Tweak: 诊断阶段三案例实战参与分数校准

### 背景判断
- 用户认为当前诊断思路不够准确，但又担心重诊断会吓跑用户。
- 本轮采用小改：不新增动态画像表，不拉长诊断流程，只让现有阶段三案例回答真正参与诊断结论。

### 完成内容
- `/api/diagnosis/case` 在提交案例后调用 AI 诊断师评估用户案例分析，输出五维结构化证据、强弱项和改进建议。
- 新增 `case-calibration` 诊断工具：将量表自评分与案例实战评分按 75%/25% 混合，温和校准五维分数，避免一次案例完全推翻初筛。
- 校准后的 `dimension_scores`、`diagnosis_reports.overall_score/overall_grade/strengths/weaknesses/improvements` 和 `growth_snapshots` 会同步写入。
- 报告页增加“实战校准”摘要，明确案例实战已按权重校准量表分数。

### 验证结果
- TDD 红灯：新增 `case-calibration.test.mjs` 先因缺少实现失败，再因权重不符合预期失败。
- `node --test src/lib/diagnosis/case-calibration.test.mjs src/lib/diagnosis/report-summary.test.mjs src/lib/diagnosis/report-detail.test.mjs src/lib/diagnosis/interview-readiness.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- 针对性 ESLint 通过。
- `npm run build` 通过。
- `./init.sh` 重跑通过（前一次与并行 build 同跑时出现瞬时 TypeScript 失败，单独复跑为 10/10 通过）。

## [2026-06-21] Fix: 连续推荐理由后的答题提点不再混入题目卡

### 背景判断
- 用户截图显示第二题的 `【答题提点：...】` 出现在题目卡红框位置，而不是下方“我的回答”的思考框架区。
- 复现发现：当模型输出 `【为什么练这题：...】` 后紧接 `【答题提点：...】`，并省略 `题目正文` 标签时，解析器只剥离了推荐理由，答题提点会残留在题干开头。

### 完成内容
- `parseGeneratedQuestionText` 在推荐理由解析后，会再次检测并剥离题干开头残留的 inline `【答题提点：...】`。
- 旧缓存题恢复时仍会走同一解析逻辑，因此已缓存的边缘格式也会把框架引导放回“我的回答”区域，题目卡不再显示答题提点。
- 增加回归测试覆盖“推荐理由 + 答题提点 + 直接题干”的真实格式。

### 验证结果
- TDD 红灯：新增测试先因 `hint` 为空且题干残留 `答题提点` 失败。
- `node --test src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- 针对性 ESLint 通过。

## [2026-06-22] Fix: 日常训练题 UI 对齐与高阶 PM 靶点出题

### 背景判断
- 用户截图显示“未提交”状态与“思考框架”视觉同行，而预期应与“我的回答”同行。
- 进一步讨论后确认，题目高度相似不只是查重不足，而是第一题固定从“战略思维 | 业务判断”开始，且 prompt 把题目空间压得过窄。
- 检索高阶 PM 能力框架后，采用“五维统计维度 + 高阶 PM 训练靶点”的结构，避免只围绕大维度标签出题。

### 完成内容
- 答题区布局改为标题行只放“我的回答”和“未提交/分析中”，思考框架作为独立引导块下移。
- 新增高阶 PM 训练靶点库：问题定义、业务结果判断、复杂取舍、指标与因果、生命周期判断、系统边界、价值捕获、组织协同、质量交付、复盘迭代。
- `/api/train` 出题改为按当前维度选择训练靶点，并把靶点能力、思考框架、变化轴和禁区写入 prompt。
- 前端第二标签从固定大维度框架名改为当前靶点标签，例如“业务结果判断”“指标与因果”“系统边界”。
- 每日训练维度顺序按日期轮换，避免每天第一题固定为战略思维；`/api/training/sessions` 恢复进度也使用同一轮换顺序。
- 继续保留防假大空约束：小场景、2 个判断问题、禁止年度战略/第二增长曲线/虚构宏大经营数据。

### 验证结果
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/personalization.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/training/dimension-strategy.ts src/lib/training/session-progress.ts src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/app/api/train/route.ts src/app/api/training/sessions/route.ts src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- `npm run build` 通过。

## [2026-06-22] Follow-up: 换一题同步切换训练靶点

### 背景判断
- 用户本地验证发现点击“换一题”后，题目第二标签仍停留在同一个靶点，例如“系统边界”。
- 这说明上一轮虽然做了每日维度轮换和靶点库，但同一天同一维度手动换题仍被同一靶点约束，可能继续产生相似题。

### 完成内容
- `QuestionState` 和 `training_sessions.questions` 缓存结构增加 `targetId/targetLabel`。
- `/api/train` 接收 `targetId`，按指定靶点生成题，而不是只按日期默认靶点。
- “换一题”会调用 `getNextTrainingTarget`，在当前维度内切换到下一个高阶 PM 靶点，题目卡第二标签立即变化。
- 旧缓存题如果没有靶点信息，会用当前维度默认靶点兜底。

### 验证结果
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/personalization.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/training/dimension-strategy.ts src/lib/training/session-progress.ts src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/app/api/train/route.ts src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- 本地 dev server `http://localhost:3002/training/session` 返回 200。

## [2026-06-25] Fix: 特训题目与教练反馈不再串项目

### 背景判断
- 用户截图显示特训题把「BPM 流程引擎重构」错误写成在「万商云集」做，疑似 MD 简历解析后项目和公司归属串联。
- 同一页右侧 AI 教练反馈围绕另一个「教师智能助理低使用率场景」题目，而不是当前 BPM 流程引擎题，说明评分反馈上下文约束过松。

### 完成内容
- `/api/bootcamp/resume` 的简历解析 JSON 增加 `projects.company`，并要求只有同一经历/同一小节/项目描述明确归属时才填写，无法判断就留空。
- 新增 `src/lib/bootcamp/grounding.ts`：从简历结构化信息生成项目归属锚点，并检测“项目名 + 其他公司名”的错配题目。
- `/api/bootcamp/interview` 在出题 prompt 中加入项目归属锚点，并过滤模型返回的项目/公司错配题，防止「万商云集做 BPM」这类组合进入题库。
- `/api/bootcamp/interview/answer` 强约束评分只能围绕当前题目和当前回答；总评、示例回答、改写示范若无法和当前上下文重叠，会回落到当前题目导向的安全文案。
- `ResumePreview` 展示项目所属公司，便于用户在解析结果页发现归属异常。

### 验证结果
- `node --test src/lib/bootcamp/grounding.test.mjs` 通过，覆盖「万商云集 + BPM 流程引擎重构」错配、项目 company 优先和泛泛“这个项目”反馈串题。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/bootcamp/resume/route.ts src/app/api/bootcamp/interview/route.ts src/app/api/bootcamp/interview/answer/route.ts src/lib/bootcamp/grounding.ts src/components/bootcamp/ResumePreview.tsx --max-warnings 0` 通过。
- `npm run build` 通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-06-25] Fix: 特训有反馈时下一题按钮可点击

### 背景判断
- 用户截图显示当前题右侧已经生成完整反馈，但底部“下一题”仍是禁用态。
- 根因是页面渲染反馈看 `currentQuestion.ai_evaluation`，但按钮禁用条件和进度统计只看 `status === "evaluated"`；当历史记录或接口返回出现“有 ai_evaluation 但 status 仍为 answered/pending”的陈旧状态时，页面会显示反馈却不允许进入下一题。

### 完成内容
- `src/lib/bootcamp.ts` 新增 `isQuestionEvaluated` / `canAdvanceFromQuestion`，统一用 `status === evaluated || ai_evaluation 存在` 判断题目是否已完成。
- `/bootcamp/interview` 的进度条、今日进度和“下一题”按钮改用同一判断，避免显示反馈但按钮不可点。
- 新增 `src/lib/bootcamp.test.mjs` 回归测试，覆盖“有 ai_evaluation 但 status 陈旧”仍可进入下一题。

### 验证结果
- `node --test src/lib/bootcamp.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/bootcamp/interview/page.tsx' src/lib/bootcamp.ts --max-warnings 0` 通过。
- `npm run build` 通过。

## [2026-06-26] Fix: 日常训练换题仍高度同质

### 背景判断
- 用户截图显示连续刷新/换题后，题面仍集中在 B2B SaaS、免费/付费、权限、试用、默认策略、上线回滚和验证方案。
- 根因不是单纯“随机性不够”：前端换题时没有把当前页面已生成题传给 `/api/train`，后端只依赖已异步保存到 `training_sessions.questions` 的题；连续点击或保存未完成时，重复控制看不到刚出现的题。
- 第二个根因是种子库和 prompt 都会把战略思维题收束到同一种骨架：产品域多为 SaaS，追问多为“关键指标/观察周期/决策标准/回滚”。

### 完成内容
- `TrainingSessionClient` 生成题时传入当前页面已知题目 `currentQuestions`。
- `/api/train` 合并前端即时题和当天缓存题，统一进入 `buildTrainingPersonalization`、recent family 提取和 `pickTrainingQuestionSeed`。
- `question-bank.ts` 增加题面骨架信号检测，识别 SaaS 定价权限、默认权限变更、上线回滚验证、指标护栏闭环等拥挤模板；当今日题目已集中在某类骨架时，优先从候选种子中剔除同类骨架。
- 出题 prompt 明确禁止把每题都写成“设计验证方案，包含关键指标、观察周期、决策标准、是否回滚”，并要求拥挤时切换到不同产品域和决策动作。

### 验证结果
- TDD 红灯：新增测试先复现截图同质题簇下仍会选到 `risk-release/上线判断`，以及 `/api/train` 未合并前端当前题。
- `node --test src/lib/training/question-bank.test.mjs src/app/api/train/route.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/app/api/train/route.test.mjs src/components/training/TrainingSessionClient.tsx src/lib/training/question-bank.ts src/lib/training/question-bank.test.mjs --max-warnings 0` 通过（仅 ESLint 9 eslintrc 迁移提示）。
- `npm run build` 通过。
- `git diff --check` 通过。
- 模拟用户截图中的同质题簇后，下一颗战略思维种子切换为 `seed-tradeoff-03 / architecture-payoff / 架构投入 / 长期投入`，不再继续 SaaS 免费付费或上线回滚骨架。

## [2026-06-26] Refactor: 日常训练从维度直出改为高阶产品任务驱动

### 背景判断
- 用户连续截图验证后，确认“同维度换靶点”和题库 seed 仍不能根治换皮感。
- 根因上移到架构层：五维画像标签过早参与题面生成，尤其战略/商业/数据三类能力在真实工作中高度耦合，强行拆维度会把题目压回相似骨架。
- 本轮保留训练页视觉、为什么练这题、思考框架和提交后反馈，但把出题入口从“维度优先”改为“国内高阶产品真实任务优先”。

### 完成内容
- 新增 `src/lib/training/training-missions.ts`：国内高阶产品任务池，覆盖增长诊断、商业化取舍、项目推进与资源冲突、平台/中台抽象、数据经营分析、行业与供给侧约束、组织影响与协同推进等任务类型。
- `TrainingSessionClient` 改用 `getDailyTrainingMissionPlan` 和 `getNextTrainingMission`；“换一题”会替换当前题槽的 mission，跨任务类型切换，而不是只在同一维度里换靶点。
- `/api/train` 接收 `missionId`，以 mission 为主组织 prompt；维度和靶点只作为页面标签与评估归因，不再直接决定题面。
- `question-bank.ts` 支持 missionTaskType/productDomains 参与 seed 评分，降低单一维度池对题目的锁定。
- `/api/training/questions` 保存 `missionId/dimension/targetId/targetLabel`，刷新或恢复当天训练时不丢任务语义。
- `getMissionPlanWithCachedQuestions` 会把当天缓存里的替换 mission 恢复进当前训练计划，避免用户换题后刷新又退回默认任务序列。

### 验证结果
- TDD 红灯：新增 mission plan、训练页 mission 使用、route prompt mission 主导、题目缓存 mission 元数据测试，均先捕获旧实现问题。
- `node --test src/lib/training/session-progress.test.mjs src/lib/training/training-missions.test.mjs src/components/training/TrainingSessionClient.test.mjs src/app/api/train/route.test.mjs src/app/api/training/questions/route.test.mjs src/lib/training/question-bank.test.mjs src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/completion.test.mjs` 通过，41 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint ... --max-warnings 0` 针对性通过（仅 ESLint 9 eslintrc 迁移提示）。
- `npm run build` 通过。
- `git diff --check` 通过。
