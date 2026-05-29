---
change: dashboard-profile-engine
design-doc: docs/superpowers/specs/2026-05-26-dashboard-profile-design.md
base-ref: 91fa5679023aecedfac04baed7ef6333c2e208ba
archived-with: 2026-05-26-dashboard-profile-engine
---

# 工作台仪表盘 + 用户画像引擎 — 实施计划

## 概述

创建 Dashboard API 聚合训练统计 + 诊断报告 + 画像数据，重构空壳 Dashboard 页面为完整数据看板。

## 任务 1: 创建 `/api/dashboard` GET 路由

**文件**: `src/app/api/dashboard/route.ts` (新)

实现内容：
- 查询 training_records 获取统计（复用 `/api/training/stats` 模式）：totalCount, todayCount, streak, dimStats, dimAverages
- 查询 diagnosis_reports + dimension_scores 获取最新 completed 报告
- 按日期聚合 training_records 计算成长趋势（最近 30 天）
- 计算画像：维度等级 A/B/C/D、薄弱项 top 2
- 返回统一 JSON 响应，无数据字段返回 null 而非抛错

**关键查询**:
```sql
-- 成长趋势
SELECT DATE(created_at) as date, dimension, AVG(score/10) as avg_score, COUNT(*) as cnt
FROM training_records WHERE user_id = $1 AND created_at >= $2
GROUP BY DATE(created_at), dimension ORDER BY date
```

**验证**: `curl http://localhost:3000/api/dashboard` 返回 200 + 正确 JSON 结构

## 任务 2: 重构 Dashboard 页面

**文件**: `src/app/(app)/dashboard/page.tsx` (改)

实现内容：
- 从 API 加载数据 (`useEffect` + `fetch`)
- 四个区域逐一实现

### 区域 1: 能力画像卡片 (左上)
- recharts RadarChart 展示 5 维度评分
- 维度等级列表 (A/B/C/D 标签)
- 无数据时显示引导卡片

### 区域 2: 成长曲线 (右上)  
- recharts LineChart 展示日均评分趋势
- x=date, y=avg_score
- 无数据时显示引导文案

### 区域 3: 训练统计卡片组 (左下)
- 连击天数 + 总题数 + 今日状态 + 维度进度条
- 复用训练页的统计卡片风格

### 区域 4: 最近诊断报告摘要 (右下)
- 报告日期、总分、强项/薄弱项标签
- "查看完整报告" 按钮跳转 `/diagnosis/report`

## 任务 3: 子组件拆分（按需）

如果 page.tsx 超过 400 行，拆分子组件到 `src/components/dashboard/`:
- `DashboardClient.tsx` — 主容器 + 数据加载
- `ProfileCard.tsx` — 能力画像
- `TrendChart.tsx` — 成长曲线
- `StatCards.tsx` — 训练统计
- `ReportSummary.tsx` — 诊断摘要

## 验证

1. `npx tsc --noEmit` 通过
2. `npx next build` 通过
3. 浏览器打开 `/dashboard` 确认页面渲染正常
