# 产品升云阶 — Agent 工作指南

## 项目定位

一款帮助 B 端产品经理从执行层向高级 PM 跃迁的 Web 工具。核心能力链路：

```
深度诊断 → 画像建模 → 针对性训练 → 反馈迭代 → 画像更新 → 更精准推荐
```

## 技术栈

| 层 | 技术选型 | 约定 |
|---|---------|------|
| 框架 | Next.js (App Router) — TypeScript | `src/` 目录结构 |
| 样式 | Tailwind CSS + shadcn/ui | shadcn 组件放 `src/components/ui/` |
| AI 交互 | Vercel AI SDK | 流式输出 + 多轮上下文 |
| 数据层 | Supabase（账密登录 + PostgreSQL） | 所有 DB 操作用 supabase-js |
| 部署 | Vercel | `vercel.json` 配置 |

## 启动工作流 (Startup Workflow)

**Before writing code:** 每次新会话编码前必须执行以下 6 步：

1. `pwd` — 确认工作目录正确
2. **完整阅读本文件** — 重温工作规则
3. **阅读项目文档**（如有）— `docs/ARCHITECTURE.md`、`docs/PRODUCT.md`、README 或等价文档
4. **运行 `./init.sh`** — 确认环境健康（依赖安装 → 类型检查 → lint）
5. **读取 `feature_list.json`** — 查看当前功能状态
6. **查看最近提交** — `git log --oneline -5`

**如果 baseline 验证失败（`init.sh` 报错），先修复再开工，不跳过。**

## 工作规则

### 一次只做一个功能 / One feature at a time
- 从 `feature_list.json` 中选一个 **unstarted 或 in-progress** 的功能
- 完成前不切换其他功能
- 除非阻塞依赖，需要用户确认后才切换

### 验证驱动完成
- 功能完成后必须运行对应验证（test / type-check / lint）
- 证据记录在 `feature_list.json` 和 `progress.md`
- 不允许凭空宣称"已实现"

### 更新制品
- 每轮编辑后同步更新相关文件（组件、测试、文档）
- 会话结束前更新 `progress.md` 和 `feature_list.json`
- 提交前运行 `init.sh` 确保可重启

### 保持在范围内 / Stay in scope
- 不修改与当前功能无关的文件
- architecture decision、新增依赖、数据库 schema 变更 → 先问用户
- 发现设计文档与实现不一致 → 更新设计文档或与用户确认

### 前后端完整性 / Full-stack completeness ⚠️ 硬性规则
**每个功能必须同时包含前端页面 + 后端数据持久化 + API 路由，缺一不可。**
禁止出现"只搭了界面，数据没落地"的情况。
- 表单提交 → 写入 Supabase 表
- 页面加载 → 从 Supabase 读取数据
- AI 对话 → 记录到对应数据表
- 配置变更 → 保存到 user_settings 表
- 功能完成声明前，必须验证同一次操作中数据确实写入并读回

### 留下可重启的状态 / Leave clean state / restartable
- 下个会话必须能直接运行 `./init.sh` 然后开工
- 不确定的东西写进 `progress.md` 的阻塞/风险区，不遗留未提交代码

## 必需制品 (Required Artifacts)

以下文件是本项目的核心状态载体，编码过程中必须保持最新：

| 文件 | 角色 | 维护时机 |
|------|------|---------|
| `feature_list.json` | 功能状态追踪（唯一真相源） | 功能状态变化时 |
| `progress.md` | 会话连续性日志 | 每次会话结束前 |
| `init.sh` | 标准启动与验证路径 | 依赖/脚本变化时 |
| `session-handoff.md` | 跨会话/跨 agent 交接（可选，大会话使用） | 需要交接时 |

## 代码约定

- **文件/变量/函数**：英文（Next.js 惯例）
- **注释/文档**：中文（用户和团队语言）
- **组件**：`src/components/`，按模块分目录
- **路由**：App Router — `src/app/(routes)/`
- **AI prompt 模板**：`src/prompts/` 统一管理
- **类型定义**：`src/types/`
- **工具函数**：`src/lib/`
- **Supabase 客户端**：`src/lib/supabase.ts`
- **DB schema**：`supabase/schema.sql`

## 完成标准 (Definition of Done)

一个功能 **只有全部满足以下条件** 才算完成：

- [ ] 目标行为已实现
- [ ] 数据已落地：操作写入 Supabase 表，界面从 Supabase 读取
- [ ] 对应的验证命令已运行（test / lint / type-check）
- [ ] 证据已记录在 `feature_list.json` 或 `progress.md`
- [ ] 仓库可从标准启动路径重新启动（`./init.sh` 通过）

## 验证命令 (Verification Commands)

```bash
# 全量验证（推荐）
npm run build
```

必检项：
- `npx tsc --noEmit` — TypeScript 编译检查
- `npx eslint src/ --max-warnings 0` — 代码风格检查
- `npx next build` — 构建完整性检查
- `./init.sh` — 环境健康检查

> 功能完成声明前，上述命令必须全部通过。不允许跳过或忽略告警。

## 会话结束流程 / End of Session

1. 更新 `progress.md` — 当前状态、决策记录、阻塞项
2. 更新 `feature_list.json` — 功能状态 + 证据
3. 提交代码，message 描述做了什么、为什么、未完成什么
4. 确保 `./init.sh` 能通过（环境干净）
5. 如有遗留风险或跨会话决策，标记在 `session-handoff.md`

## 升级原则 / Escalation

如果发现以下情况 → 向用户报告并等待指示：

- **架构决策**：增加依赖 / 改 DB schema / 重写核心逻辑
- **范围扩增**：发现需要的新功能不在 `feature_list.json` 中
- **反复验证失败**：同一项测试连续失败 3+ 次，更新进度、标记人工审查
- **需求模糊**：设计文档未覆盖的场景，先问不清除或用户
