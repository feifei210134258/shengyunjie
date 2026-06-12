# Proposal: 修复 Markdown 简历上传后不进入下一步

## Why

用户上传 Markdown 简历后，页面可能长时间没有可见反馈，或因为 AI 返回 JSON 外包裹了 Markdown 代码块/说明文字导致解析失败，无法展示简历画像和“开始特训”下一步。这个问题发生在已有特训 Day 0 简历解析能力内，需要作为行为热修复处理。

## What Changes

- 文件上传模式显示明确的上传/解析中状态，并在处理中禁用上传入口，避免用户误以为没有反应或重复提交。
- 后端简历解析 API 增强 AI JSON 解析容错，兼容纯 JSON、```json 代码块，以及 JSON 前后带说明文字的返回。
- 后端 prompt 明确要求只返回指定 JSON 结构，降低模型输出不可解析内容的概率。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- 无：不改变 `bootcamp-resume-parse` 的验收要求，只修复已有实现的可靠性与反馈体验。

## Impact

- `src/components/bootcamp/ResumeUploader.tsx`
- `src/app/api/bootcamp/resume/route.ts`
- 不新增依赖，不修改数据库 schema，不改变 API 请求/响应结构。
