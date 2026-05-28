# Design — Sidebar Style Tweak

将 `[product]/page.tsx` 中侧边栏按钮从 `rounded-xl` 改为 `rounded-2xl` 方块卡片风格，增加左侧 Material Symbol 图标。

每个视角对应的图标：
- 全局分析: `dashboard`
- 产品定位: `target`
- 增长飞轮: `trending_up`
- 商业模式: `account_balance`
- 定价策略: `sell`
- 功能架构: `architecture`
- 竞争博弈: `swords`
- 留存激活: `rocket_launch`
- 生态平台: `hub`

高亮态使用 `bg-primary/10` + 深色文字，默认态使用浅色图标 + 淡色文字。