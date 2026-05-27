# Tasks: 训练模块单题模式重构

- [x] 重写 `src/app/(app)/training/session/page.tsx` 为单题模式
  - [x] 单题显示，currentIndex 控制当前维度
  - [x] 进度条显示
  - [x] 维度图标和颜色标识
  - [x] 重新出题功能
  - [x] 结束训练功能
  - [x] 答题提交和 AI 分析展示
  - [x] 诊断/建议分块显示
  - [x] 下一题/再来一轮流程
- [x] 修改 `src/app/api/train/route.ts` 分析 prompt
  - [x] 明确分为"诊断"和"建议"两大块
  - [x] 使用 `getThinkingModel` 启用深度思考
  - [x] 要求引用用户原文
- [x] 构建并验证
  - [x] `npm run build` 通过
  - [x] 启动服务器
  - [x] 浏览器验证页面正常加载
