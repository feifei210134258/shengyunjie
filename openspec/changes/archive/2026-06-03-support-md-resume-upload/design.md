# Design: 支持 .md 简历文件上传

## 实现说明

- 前端 `ResumeUploader` 增加 `text/markdown`、`text/plain`、`.md`、`.markdown` 识别。
- `<input type="file">` 的 `accept` 增加 `.md,.markdown,text/markdown,text/plain`。
- 上传区说明文案从“PDF、Word”调整为“PDF、Word、Markdown”。
- 后端统一把文件名转为小写后判断 `.md` / `.markdown`，避免 `.MD` 文件被拒。

## 非目标

- 不新增 Markdown 解析库。
- 不改变 API 请求/响应结构。
- 不改变数据库 schema。
