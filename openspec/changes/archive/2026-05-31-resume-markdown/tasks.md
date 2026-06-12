# Tasks: 简历格式支持 Markdown

## 1. 前端组件修改

- [x] 1.1 修改 `ResumeUploader` — 增加"粘贴文本"模式切换（Tab 切换：上传文件 / 粘贴文本），粘贴模式下显示 textarea
- [x] 1.2 修改 `ResumePreview` — 使用 `react-markdown` 渲染简历内容（检测到 Markdown 时渲染，否则保持现有结构化展示）

## 2. 验证

- [x] 2.1 运行 `npx tsc --noEmit` 确认无类型错误
- [x] 2.2 运行 `./init.sh` 确认环境健康
