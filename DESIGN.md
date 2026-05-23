---
name: 产品升云阶
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464554'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777586'
  outline-variant: '#c7c4d7'
  surface-tint: '#5148d7'
  primary: '#2a14b4'
  on-primary: '#ffffff'
  primary-container: '#4338ca'
  on-primary-container: '#c1beff'
  inverse-primary: '#c3c0ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#1f1ab3'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b3bc9'
  on-tertiary-container: '#bebfff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#372abf'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## 品牌与风格

本设计系统旨在为 AI 驱动的专业平台提供一个清晰、高保真且充满活力的视觉框架。品牌个性定位于**理智、先进与透明**。

### 视觉叙事
通过采用**现代企业主义与极简主义**的融合，设计重点从深沉的计算感转向了明亮的洞察感。背景采用极高明度的灰白色，象征着“空白画布”般的思考空间，而深靛蓝与青翠的青色则代表了逻辑的深度与技术的精准。

### 目标受众
主要面向开发者、数据科学家及企业决策者。界面通过大量留白和精准的排版，缓解认知负荷，让复杂的 AI 工作流变得直观且易于导航。

### 情感反应
UI 应当激发用户**信任、高效与前瞻性**的情感。它不仅是一个工具，更是一个能增强人类能力的专业合作伙伴。

## 颜色策略

本系统采用以“纯净思维”为核心的浅色调色板。

*   **基础背景 (#ffffff)**: 纯白色的主工作区，确保内容具有最高的可读性。
*   **中性色 (#f8fafc)**: 用于容器、侧边栏和底层背景，通过微妙的明度差异区分功能区域。
*   **主色 (深靛蓝 - #4338ca)**: 代表核心逻辑与行动，用于主要按钮、导航状态和关键交互。
*   **次色 (青色 - #0d9488)**: 象征 AI 的辅助与处理过程，常用于成功状态、数据可视化和进度指示。
*   **边框与分割 (#e2e8f0)**: 极低对比度的线条，仅用于结构引导，不干扰视觉流。

## 字体排印

全系统统一使用 **Hanken Grotesk**，这是一种具有现代感、几何感且极其清晰的无衬线字体，非常适合处理复杂的数据信息。

### 排版原则
1.  **高对比度**: 标题使用 `#0f172a` (Slate 900)，正文使用 `#334155` (Slate 700)，确保在明亮背景下的视觉可读性。
2.  **紧凑字距**: 大标题采用负字距（-0.01em 到 -0.02em），增强视觉的凝聚力和专业度。
3.  **层次结构**: 通过字重的剧烈变化（从 400 到 700）来区分信息优先级，而非仅仅依靠大小。

## 布局与间距

本系统采用**流式网格 (Fluid Grid)** 模型，强调呼吸感与逻辑对齐。

### 间距系统
采用 8px 为基准的等比数列。
*   **桌面端**: 12 列网格，40px 侧边边距，24px 槽宽 (Gutter)。内容区域最大宽度限制为 1440px 以保证阅读舒适度。
*   **移动端**: 4 列网格，16px 侧边边距，16px 槽宽。

### 布局逻辑
利用 `space-between` 和统一的内边距 (`padding: 24px`) 来创建功能块。组件之间的间距应严格遵循 `md (24px)` 规范，以保持视觉节奏的连贯性。

## 高度与深度

在浅色模式下，深度不再通过阴影的厚重感来表达，而是通过**色调分层 (Tonal Layers)** 和**极细阴影**来实现。

1.  **分层逻辑**: 
    *   底层背景：`#ffffff`
    *   容器层：`#f8fafc` (带有 1px `#e2e8f0` 描边)
    *   浮动层（如下拉菜单、模态框）：白色背景配合 `0px 10px 15px -3px rgba(0, 0, 0, 0.05)` 的极淡弥散阴影。
2.  **玻璃质感**: 在关键提示或导航栏中使用 `backdrop-filter: blur(8px)`，配合半透明的 `rgba(255, 255, 255, 0.8)`，营造轻盈的科技感。

## 形状语言

为了保持专业与严谨的工业质感，本系统选择**柔和 (Soft)** 的形状倾向。

*   **标准圆角**: 所有按钮、输入框和卡片统一使用 `0.25rem (4px)` 的圆角。
*   **大尺寸组件**: 模态框或大型容器可使用 `0.5rem (8px)`。
*   **设计隐喻**: 避免过大的圆角（如胶囊形），因为直角与微圆角的结合更能传达“精密架构”的品牌意图。

## 组件规范

### 按钮 (Buttons)
*   **主要按钮**: 深靛蓝背景，白色文字，无阴影，悬停时颜色加深。
*   **次要按钮**: 透明背景，深靛蓝描边与文字，悬停时背景变为淡蓝色。

### 输入字段 (Input Fields)
*   背景色为白色，边框为 `#e2e8f0`。
*   聚焦状态：边框转为主色深靛蓝，并带有 2px 的淡靛蓝外发光 (Halo)。

### 卡片 (Cards)
*   背景色为 `#f8fafc`，无投影，仅使用 `#e2e8f0` 线条勾勒边缘。
*   内部间距固定为 `24px`。

### 标签与状态 (Chips & Status)
*   使用次色（青色）的浅色变体作为背景，深青色作为文字。
*   形状采用 `rounded-full`（全圆角），以区别于功能性操作按钮。

### 列表 (Lists)
*   采用极简风格，取消行间分割线，改用悬停时的浅灰色背景块 (`#f1f5f9`) 激活感。