# Case Library Sidebar Style Tweak

## 动机

案例库独立页面的左侧视角侧边栏样式不够美观——当前使用圆角药丸形状，缺乏图标视觉引导。

## 目标

将侧边栏视角项改为方块状样式，每个项目增加 Material Symbol 图标 + 文本标签。

## 范围

- 修改 `[product]/page.tsx` 中侧边栏按钮的 CSS 样式
- 每个视角项添加对应图标（material-symbols-outlined）
- 不改动交互逻辑、API、数据结构