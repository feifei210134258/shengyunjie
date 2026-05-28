# 设计

## 1. 全局分析视角

在 `PERSPECTIVES` 数组中新增 `{ slug: "overview", label: "全局分析" }`。
生成 prompt 改为综合分析视角，字数约束 ~1000 字。

## 2. Markdown 渲染

安装 `react-markdown`，将文章内容从 `whitespace-pre-wrap` 纯文本展示改为 Markdown 渲染。
同时添加 prose 样式使排版美观。