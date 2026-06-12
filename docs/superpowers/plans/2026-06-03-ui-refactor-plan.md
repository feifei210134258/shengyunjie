# UI 重构优化计划

## 现状诊断摘要

| 维度 | 问题数 | 严重度 |
|------|--------|--------|
| 响应式/移动端 | 全面缺失 | 🔴 严重 |
| 基础组件抽象 | 按钮/输入/卡片无共享组件 | 🔴 严重 |
| 设计系统一致性 | 颜色硬编码、token 未使用 | 🟠 高 |
| 交互体验 | 无过渡动画、无微交互 | 🟡 中 |
| 代码质量 | 重复代码、重复常量定义 | 🟡 中 |

---

## 阶段 1：基础设施（Base Foundation）

### 1.1 设计 Token 统一

**目标**：让 `tailwind.config.ts` 成为唯一颜色真相源，消除所有硬编码色值

- 补充缺失的语义色 token：`success`（绿）、`warning`（琥珀）、`info`（蓝）到 `tailwind.config.ts`
- 将 `DESIGN.md` 中引用但 config 中缺失的颜色对齐（统一到 config）
- 在 `globals.css` 中用 `@apply` 或 CSS 变量替换硬编码 hex（`#f7f9fb` → token 引用）
- 定义统一的阴影 token（`shadow-card`, `shadow-elevated`, `shadow-glow`）

**涉及文件**：
- `tailwind.config.ts` — 添加 success/warning/info 色系、阴影扩展
- `src/app/globals.css` — 替换硬编码色值

### 1.2 基础 UI 组件库

**目标**：建立 6 个高频基础组件，使用 `cva` 管理变体

#### Button 组件 (`src/components/ui/button.tsx`)
| 变体 | 用途 |
|------|------|
| `primary` | 主操作（bg-primary, text-on-primary） |
| `secondary` | 次操作（border, bg-transparent） |
| `ghost` | 幽灵按钮（无 border，hover 变色） |
| `danger` | 危险操作（bg-error） |
| 尺寸：`sm` / `md` / `lg` | 统一 padding + font-size |

统一规范：`rounded-xl`、`disabled:opacity-40`、`active:scale-[0.98]` 微交互

#### Input 组件 (`src/components/ui/input.tsx`)
- 统一：`bg-surface-container-lowest`、`border-outline-variant`、`focus:border-primary focus:ring-2 focus:ring-primary/10`
- 支持 `label`、`error` 状态 prop

#### Textarea 组件 (`src/components/ui/textarea.tsx`)
- 同 Input 规范，增加 `resize-none`、`min-h` 配置

#### Card 组件 (`src/components/ui/card.tsx`)
| 变体 | 样式 |
|------|------|
| `default` | border + rounded-xl + p-6 |
| `elevated` | shadow-card + border + rounded-xl |
| `flat` | bg-surface-container + rounded-xl |
| 尺寸：`sm`(p-4) / `md`(p-6) / `lg`(p-8) | |

#### Badge 组件 (`src/components/ui/badge.tsx`)
| 变体 | 用途 |
|------|------|
| `default` | 通用标签（bg-primary-container） |
| `success` | 绿色标签 |
| `warning` | 黄色标签 |
| `error` | 红色标签 |
| `outline` | 描边标签 |
| `grade` | 等级徽章（A/B/C/D），接受 grade prop 自动选色 |

统一规范：`rounded-full`、`text-label-bold`、消除 `bg-primary/10` 透明度 hack

#### Spinner 组件 (`src/components/ui/spinner.tsx`)
- 统一尺寸：`sm`(16px) / `md`(24px) / `lg`(32px)
- 统一颜色：`border-primary border-t-transparent`
- 提供 `PageSpinner`（全屏居中）和 `InlineSpinner`（按钮内嵌）

### 1.3 共享布局组件

#### PageHeader 组件 (`src/components/ui/page-header.tsx`)
- 统一 `h-20 sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md`
- 支持 `title`、`subtitle`、`actions`（右侧插槽）、`back`（返回按钮）

#### StepProgress 组件 (`src/components/ui/step-progress.tsx`)
- 统一步骤条：支持 `steps: string[]`、`current: number`、`variant: 'bar' | 'circle'`
- 替代当前 4 处手动实现

#### Skeleton 组件 (`src/components/ui/skeleton.tsx`)
- `Skeleton`（单个占位块）
- `SkeletonCard`（卡片占位）
- `SkeletonPage`（整页骨架屏预设）

---

## 阶段 2：页面改造（Page Migration）

### 2.1 认证页面（Login / Register）

**改动**：
- 替换手写按钮 → `<Button variant="primary" size="lg" fullWidth>`
- 替换手写输入框 → `<Input>` / `<Input type="password">`
- 统一卡片样式 → `<Card variant="elevated">`

**涉及文件**：
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`

### 2.2 诊断模块（Diagnosis）

**改动**：
- 4 个页面统一使用 `<PageHeader>` 替换手写 header
- 步骤条统一使用 `<StepProgress>`
- 诊断选项卡使用 `<Card>` 组件
- 聊天界面消息气泡样式统一
- 案例页 textarea → `<Textarea>`
- 报告页 SVG 雷达图颜色改用 CSS 变量/token

**涉及文件**：
- `src/app/(app)/diagnosis/scale/page.tsx`
- `src/app/(app)/diagnosis/interview/page.tsx`
- `src/app/(app)/diagnosis/case/page.tsx`
- `src/app/(app)/diagnosis/report/page.tsx`
- `src/components/dashboard/ProfileCard.tsx`（GRADE_COLORS 提取为共享常量）
- `src/components/dashboard/LatestReport.tsx`（同上）

### 2.3 训练模块（Training）

**改动**：
- 训练主页 header → `<PageHeader>`
- 训练会话页替换固定 header 为 `<PageHeader>` + 响应式 `left` 调整
- 答题 textarea → `<Textarea>`
- 分数/维度标签 → `<Badge>` 组件
- 训练历史详情页 header → `<PageHeader back="/training">`
- 案例库卡片 → `<Card>` 组件
- 统一 `RadarChart` 组件颜色（消除 `#2563eb` vs `#2a14b4` 冲突）

**涉及文件**：
- `src/app/(app)/training/page.tsx`
- `src/app/(app)/training/session/page.tsx`
- `src/app/(app)/training/cases/page.tsx`
- `src/app/(app)/training/cases/[product]/page.tsx`
- `src/app/(app)/training/history/[id]/page.tsx`
- `src/components/training/RadarChart.tsx`

### 2.4 特训冲刺模块（Bootcamp）

**改动**：
- 所有 bootcamp 页面补充 `<PageHeader>`（当前完全无 header）
- 简历上传 textarea → `<Textarea>`
- 面试答题按钮 → `<Button>` 组件
- 修复所有 `bg-success`、`text-warning` 等无效 token 引用
- 弱点报告 badge → `<Badge variant="error|warning|success">`

**涉及文件**：
- `src/app/(app)/bootcamp/page.tsx`
- `src/app/(app)/bootcamp/resume/page.tsx`
- `src/app/(app)/bootcamp/interview/page.tsx`
- `src/app/(app)/bootcamp/report/page.tsx`
- `src/components/bootcamp/*.tsx`（7 个组件）

### 2.5 工作台（Dashboard）

**改动**：
- header → `<PageHeader>`
- 统计卡片 → `<Card>` 组件
- 等级 badge → `<Badge variant="grade">`
- 图表颜色统一使用 token 值

**涉及文件**：
- `src/app/(app)/dashboard/page.tsx`
- `src/components/dashboard/ProfileCard.tsx`
- `src/components/dashboard/GrowthChart.tsx`
- `src/components/dashboard/TrainingStats.tsx`
- `src/components/dashboard/LatestReport.tsx`

### 2.6 设置页（Settings）

**改动**：
- header → `<PageHeader>`
- 输入框 → `<Input>`
- 按钮 → `<Button>`

**涉及文件**：
- `src/app/(app)/settings/page.tsx`

---

## 阶段 3：响应式适配（Responsive）

### 3.1 Sidebar 响应式

**目标**：移动端可折叠的侧边栏

- 添加 hamburger 菜单按钮（`md:hidden`）
- 移动端：Sidebar 改为 overlay 抽屉模式（`fixed inset-0 z-50`，带 backdrop）
- 桌面端（`md:` 以上）：保持固定 280px
- 添加过渡动画（slide-in/slide-out）

**涉及文件**：
- `src/components/Sidebar.tsx`
- `src/app/(app)/layout.tsx`

### 3.2 页面级响应式

**目标**：所有页面在 `sm`（640px）和 `md`（768px）断点正常显示

- 所有页面 padding：`px-4 sm:px-6 lg:px-8`
- Header padding 同步调整
- Grid 布局：`grid-cols-1 md:grid-cols-2`（dashboard、training stats）
- 诊断步骤条：移动端纵向排列
- 案例详情页侧边栏：移动端折叠为 tabs
- `max-w-*` 容器在移动端移除 padding 约束

**涉及文件**：所有 `(app)` 下的 page.tsx

---

## 阶段 4：交互增强（Polish）

### 4.1 微交互

- 按钮添加 `active:scale-[0.98]` 按压反馈
- 卡片 hover 添加 `hover:shadow-card transition-shadow`
- 导航项添加 `active:scale-[0.98]` 点击反馈
- 页面切换添加 `fade-in` 过渡（利用 `tailwindcss-animate` 插件）

### 4.2 加载体验

- 统一使用 `<Spinner>` / `<Skeleton>` 组件
- 关键页面（dashboard、training）使用骨架屏代替 spinner
- 按钮 loading 状态统一使用内嵌 `<Spinner size="sm">`

### 4.3 空状态

- 为列表页添加统一空状态组件（illustration + 文案 + CTA）
- 训练历史为空时的引导
- 案例库为空的引导

---

## 执行优先级与预计工作量

| 阶段 | 子任务 | 预计文件改动数 | 优先级 |
|------|--------|----------------|--------|
| 1.1 | Token 统一 | 2 | P0 |
| 1.2 | 6 个基础组件 | 6（新增） | P0 |
| 1.3 | 3 个布局组件 | 3（新增） | P0 |
| 2.1 | 认证页面 | 2 | P1 |
| 2.2 | 诊断模块 | 6 | P1 |
| 2.3 | 训练模块 | 6 | P1 |
| 2.4 | 特训模块 | 11 | P1 |
| 2.5 | 工作台 | 5 | P1 |
| 2.6 | 设置页 | 1 | P1 |
| 3.1 | Sidebar 响应式 | 2 | P2 |
| 3.2 | 页面响应式 | ~15 | P2 |
| 4.1 | 微交互 | ~10 | P3 |
| 4.2 | 加载体验 | ~8 | P3 |
| 4.3 | 空状态 | 3（新增） | P3 |

**总计**：约 80+ 文件改动/新增

---

## 建议执行顺序

1. **先做阶段 1**（基础组件 + Token）— 这是后续所有改造的依赖
2. **然后逐模块做阶段 2** — 每个模块改完即可验证，不影响其他模块
3. **阶段 3 响应式** — 在组件统一后做响应式更顺畅
4. **阶段 4 打磨** — 锦上添花，可逐步迭代

---

## 风险控制

- **样式丢失风险**：CLAUDE.md 提到修改代码后大概率出现样式丢失。对策：每个阶段完成后立即 `npm run dev` 验证，逐页面检查
- **功能回归风险**：仅改样式/组件结构，不动业务逻辑和数据流
- **渐进式迁移**：旧组件和新组件可并存，逐步替换，不需要一次性改完
