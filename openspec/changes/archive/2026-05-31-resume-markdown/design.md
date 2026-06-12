# Design: 简历格式支持 Markdown

## 变更范围

1. **ResumeUploader 组件**：增加"粘贴文本"模式切换，支持直接输入 Markdown
2. **ResumePreview 组件**：使用 `react-markdown` 渲染简历内容
3. **API 无需变更**：文本直接传给现有的 `/api/bootcamp/resume` 解析

## 实现说明

- 上传区添加 Tab 切换："上传文件" / "粘贴文本"
- 粘贴文本模式下显示 `<textarea>` 供用户输入 Markdown
- ResumePreview 检测到 Markdown 内容时用 `react-markdown` 渲染
- 保持现有 PDF/Word 上传功能不变
