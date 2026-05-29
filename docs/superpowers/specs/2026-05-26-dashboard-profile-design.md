---
comet_change: dashboard-profile-engine
role: technical-design
canonical_spec: openspec
archived-with: 2026-05-26-dashboard-profile-engine
status: final
---

# 工作台仪表盘 + 用户画像引擎 — 技术设计

## 架构概览

```
                            ┌──────────────────────────────┐
                            │     GET /api/dashboard        │
                            │    (新 - 聚合所有看板数据)     │
                            └──────────┬───────────────────┘
                                       │
               ┌───────────────────────┼───────────────────────┐
               ▼                       ▼                       ▼
    ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
    │ training_records  │  │diagnosis_reports  │  │ training_records  │
    │ (训练统计聚合)     │  │+ dimension_scores │  │ (按日期聚合趋势)   │
    └───────────────────┘  └───────────────────┘  └───────────────────┘
```

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 空状态 | 引导式 | 各区域独立降级，无数据时显示引导文案+快捷入口 |
| 成长曲线数据源 | training_records 聚合 | 不需要新增 snapshot 写入，按日期分组计算各维度平均分 |
| 页面布局 | 左右分栏卡片 | 上排左右分栏（画像+曲线），下排横列（统计+诊断+入口） |
| 图表库 | recharts（已安装） | 与训练页雷达图一致 |
| 数据聚合 | 后端单端点 | 减少前端请求数，类型安全 |

## Dashboard API (`GET /api/dashboard`)

### 响应结构

```typescript
{
  profile: {
    dimensions: { name: string; score: number; grade: string }[];
    weaknesses: string[];
  } | null;  // null = 无诊断数据
  trainingStats: {
    totalCount: number;
    todayCount: number;
    streak: number;
    dimStats: Record<string, number>;
    dimAverages: Record<string, number>;
  };
  growthTrend: {
    date: string;
    avgScore: number;
    count: number;
  }[];
  latestReport: {
    id: string;
    completed_at: string;
    overall_score: number;
    overall_grade: string;
    strengths: string[];
    weaknesses: string[];
  } | null;
}
```

### 计算逻辑

- **dimension_scores**: 取最新 completed 报告的关联维度评分
- **维度等级**: A(>=85) / B(70-84) / C(50-69) / D(<50)
- **薄弱项**: 评分最低 2 个维度
- **成长趋势**: 从 training_records 按日期分组，取每日各维度平均分的均值
- **streak**: 复用现有 `calcStreak` 逻辑（从 training_sessions 计算）

## 前端页面布局

```
┌─────────────────────────────────────────────────────────────┐
│  固定顶栏: 工作台 | 用户姓名                                 │
├───────────────────────────┬─────────────────────────────────┤
│                           │                                 │
│   能力画像卡片             │   成长曲线                      │
│   雷达图 + 维度等级列表    │   折线图: 日均评分随时间变化      │
│   + 薄弱项标记             │   x=日期, y=评分, count=气泡大小  │
│                           │                                 │
├───────────────────────────┴─────────────────────────────────┤
│  训练统计卡片组            │  最近诊断报告摘要               │
│  连击/总题数/今日/维度进度  │  报告日期/总分/强项+薄弱项       │
│                           │  + "查看完整报告"入口            │
└─────────────────────────────────────────────────────────────┘
```

## 空状态处理

每个区域独立降级：

- **能力画像**: 无诊断时显示引导卡片 "完成 AI 诊断，了解你的能力画像" + [开始诊断] 按钮
- **成长曲线**: 数据点 < 2 时显示 "完成更多训练以解锁成长曲线" + [开始训练] 按钮
- **训练统计**: 即使没有数据也展示统计卡片组（数值为 0），连击卡片显示 "开启今日训练"
- **诊断摘要**: 无 completed 报告时显示 "暂无诊断报告"

## 实现步骤

1. `src/app/api/dashboard/route.ts` — GET 路由，聚合查询 + 计算逻辑
2. `src/app/(app)/dashboard/page.tsx` — 完整重构
3. `src/components/dashboard/` — 按需拆分子组件（雷达图、曲线图、统计卡片等）

## 技术注意事项

- growth_snapshots 表不写入，成长趋势从 training_records 按日期聚合
- profile 数据与 dashboard 合并到单一端点，不单独建 `/api/profile`
- recharts Radarchart 已在训练页使用，Dashboard 复用同名组件或内联
- 日期趋势查询使用 `created_at >= 30daysAgo`，按日 GROUP BY

## 测试策略

- API: 验证无数据用户返回 null 字段而非 500
- API: 验证有诊断用户返回完整 profile 和 report
- 前端: 验证空状态引导文案和按钮渲染
- 前端: 验证雷达图数据映射正确
- 构建: `npx tsc --noEmit` + `npx next build`
