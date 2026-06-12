# Design: Markdown 简历上传后进入下一步修复

## 根因

1. 文件上传模式只触发隐藏 input 的 `onChange`，`isUploading` 为 true 时上传区没有 loading 文案或禁用态，用户会感觉“没反应”。
2. `/api/bootcamp/resume` 直接 `JSON.parse(parsedText)`，但大模型经常返回 ```json 代码块或在 JSON 前后附加说明，导致解析失败，前端无法进入结果页。

## 修复方案

### 1. 前端上传状态

- 在文件上传区根据 `isUploading` 切换图标、标题和说明。
- 处理中禁用 file input、点击和拖拽上传，避免重复请求。
- 保留现有粘贴文本 loading 行为。

### 2. 后端 JSON 提取容错

- 增加局部 `parseJsonFromAiText` helper：先尝试直接 `JSON.parse`，再尝试提取 fenced code block，最后尝试截取首个 `{` 到最后一个 `}`。
- 简历画像和弱点预测都使用该 helper。
- prompt 明确输出字段和“只返回 JSON”。

## 非目标

- 不实现 PDF/DOCX 真正二进制解析。
- 不改变 bootcamp_sessions schema。
- 不自动跳过用户确认进入面试，仍由用户点击“开始特训”。
