# Proposal: 简历格式支持 Markdown

## Why

当前简历上传仅支持 PDF 和 Word 格式。用户可能希望直接粘贴 Markdown 格式的简历文本（尤其是技术背景的产品经理），或从 Notion、GitHub 等平台导出的 Markdown 文件。

## What Changes

- 前端上传区支持 `.md` 文件上传
- 支持直接粘贴 Markdown 文本（无需上传文件）
- 前端用 `react-markdown` 渲染解析后的简历预览

## Impact

- **前端**：修改 `ResumeUploader` 组件（增加粘贴文本模式），`ResumePreview` 组件（用 react-markdown 渲染）
- **后端**：无需修改，文本直接传给 AI 解析
- **依赖**：无需新增（项目已有 `react-markdown`）
