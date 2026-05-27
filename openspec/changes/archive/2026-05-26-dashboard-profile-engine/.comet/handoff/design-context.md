# Comet Design Handoff

- Change: dashboard-profile-engine
- Phase: design
- Mode: compact
- Context hash: ec66e1a9ead2bcb2d5a262be379b6bb7fecb442e5cd972ffae21de5f20bd8713

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/dashboard-profile-engine/proposal.md

- Source: openspec/changes/dashboard-profile-engine/proposal.md
- Lines: 1-33
- SHA256: 4a7087fd69f3c33cb89c6a959f51ccec3269eb6da2171880d0526e78d78d962d

```md
# Proposal: 工作台仪表盘 + 用户画像引擎

## 问题背景
- `/dashboard` 页面是用户登录后的默认落地页（侧边栏首位），当前是空壳占位，只显示"即将上线"
- 训练模块、诊断模块已积累了丰富的用户数据（训练记录、诊断报告、维度评分、成长快照），但没有一个统一入口让用户看到自己的"全貌"
- 缺少用户画像引擎，无法量化用户的当前能力水平、成长趋势和薄弱项

## 目标
构建一个**工作台仪表盘**，作为用户的核心数据看板，展示：
1. 能力画像卡片（5 维度评分 + 等级 + 诊断推断）
2. 成长曲线（训练进度 + 诊断趋势）
3. 训练统计摘要（连击、完成题数、今日状态）
4. 最近诊断报告摘要（快捷入口）

## 范围

### 要做的
- 创建 Dashboard API (`/api/dashboard`)：聚合 training stats + diagnosis report + profile
- 创建 Profile API (`/api/profile`)：用户画像数据模型（维度等级、薄弱项、趋势）
- 重构 Dashboard 页面：真实数据 + 4 个区域（画像卡片、成长曲线、训练统计、诊断摘要）
- 从 growth_snapshots 表计算成长趋势
- 前端展示：能力雷达图、成长曲线图、统计卡片、诊断报告入口

### 不做
- 训练题推荐逻辑（profile-002，单独后续做）
- 训练案例库（training-002）
- 特训冲刺（bootcamp）
- 画像数据的新增维度或 schema 变更（复用现有表）

## 成功标准
- Dashboard 页面从 real API 加载数据，不再显示"即将上线"
- 展示基于真实数据的用户画像和能力评分
- 正确显示训练统计和诊断报告摘要
- 类型检查 + 构建通过```

## openspec/changes/dashboard-profile-engine/design.md

- Source: openspec/changes/dashboard-profile-engine/design.md
- Lines: 1-65
- SHA256: cd91d11cc61d8d98ebbc5f005f21829f6fe655e2af974c8fb1edc18cae9eb0c1

```md
# Design: 工作台仪表盘 + 用户画像引擎

## 架构概览

```
                    ┌──────────────────────────────────────┐
                    │           /api/dashboard              │
                    │  (新 - 聚合所有看板数据)             │
                    └──────────┬───────────────────────────┘
                               │
          ┌────────────────────┼──────────────────────┐
          ▼                    ▼                      ▼
  ┌───────────────┐   ┌───────────────┐    ┌───────────────────┐
  │ training_stats│   │diagnosis_reports│   │ growth_snapshots  │
  │ (已存在)       │   │ (已存在)         │    │ (表已建，无数据)   │
  └───────────────┘   └───────────────┘    └───────────────────┘
```

## 数据流

### 1. Dashboard API (`GET /api/dashboard`)
聚合以下数据：
- **训练统计**：复用 `GET /api/training/stats` 的查询逻辑
- **最新诊断报告**：`diagnosis_reports` + `dimension_scores` (取最新 completed)
- **成长快照**：`growth_snapshots` (最近 30 天，按日期排序)
- **用户画像**：计算维度等级 (A/B/C/D)、识别薄弱项、计算趋势

### 2. 用户画像计算逻辑 (服务端)
- **维度评分**：取最新诊断报告的 dimension_scores，映射为 0-100 分
- **维度等级**：A(≥85) / B(70-84) / C(50-69) / D(<50)
- **薄弱项**：评分最低的 2 个维度
- **成长方向**：对比最早和最晚的 growth_snapshots，计算各维度增幅

### 3. Dashboard 页面布局 (4 区域)

```
┌──────────────────────────────────────────────────────┐
│  工作台                                  欢迎, [姓名]│
├────────────────────┬─────────────────────────────────┤
│                    │                                 │
│  能力画像卡片      │  成长曲线                       │
│  (雷达图 + 等级)   │  (折线图: 维度评分随时间变化)    │
│                    │                                 │
├────────────────────┴─────────────────────────────────┤
│  训练统计 │ 最近诊断报告 │ 快捷入口                  │
│  (卡片组) │ (摘要+入口)  │                             │
└──────────────────────────────────────────────────────┘
```

## 技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 图表库 | recharts (已安装) | 与训练页雷达图一致 |
| 数据聚合 | 后端聚合 (/api/dashboard) | 减少前端请求数，确保类型安全 |
| profile 端点 | 与 dashboard 合并 | 画像数据较小，避免额外请求 |
| growth_snapshots 首次使用 | 当无数据时返回空数组 | 不阻塞首次使用体验 |
| 诊断报告摘要 | 显示最新 completed 报告 | 有意义的才是可展示的 |

## 文件清单

| 文件 | 说明 |
|------|------|
| `src/app/api/dashboard/route.ts` | 新：聚合 dashboard 数据 |
| `src/app/(app)/dashboard/page.tsx` | 改：空壳 → 完整看板 |
| 可能新增 `src/components/dashboard/` | 如页面过大，拆分为子组件 |```

## openspec/changes/dashboard-profile-engine/tasks.md

- Source: openspec/changes/dashboard-profile-engine/tasks.md
- Lines: 1-9
- SHA256: 8449195bdb1e710489bddb8bec86f569dac9707ae2ab6ce013a76500264ccc04

```md
# Tasks: 工作台仪表盘 + 用户画像引擎

- [ ] 创建 `/api/dashboard` GET 路由 — 聚合训练统计 + 诊断报告 + 画像数据
- [ ] 实现用户画像计算逻辑 — 维度等级、薄弱项、成长方向（在 dashboard API 中）
- [ ] 重构 Dashboard 页面 — 能力画像区（雷达图 + 维度等级卡片）
- [ ] Dashboard 页面 — 训练统计卡片组（连击/完成数/今日状态）
- [ ] Dashboard 页面 — 最近诊断报告摘要区
- [ ] Dashboard 页面 — 快捷入口按钮组
- [ ] 运行类型检查和构建验证
- [ ] 提交代码```

