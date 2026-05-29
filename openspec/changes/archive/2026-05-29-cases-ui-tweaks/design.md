# 实现方案

## 1. 删除按钮
- 详情页顶部区域增加一个删除按钮（带确认）
- 新增 `POST /api/cases/delete` 路由，接收 `product` 和 `perspective` 参数
- 删除成功后 `router.push("/training/cases")` 回到列表

## 2. 视角栏固定
- 将外层容器 `div.flex.gap-8` 改为 `overflow-hidden` + `h-[calc(100vh-200px)]`
- 左侧 `aside` 改为 `sticky top-0 self-start`
- 右侧内容区改为 `overflow-y-auto`
