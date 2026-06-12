# Verify: support-md-resume-upload

## 结论

PASS

## 变更范围

- `src/components/bootcamp/ResumeUploader.tsx`
  - 文件上传模式允许选择和拖拽 `.md` / `.markdown` 文件。
  - 前端校验增加 `text/markdown` 和扩展名兜底。
  - 上传说明文案更新为“PDF、Word、Markdown”。
- `src/app/api/bootcamp/resume/route.ts`
  - 后端将文件名转为小写后判断 `.md` / `.markdown`。
  - 保留 PDF / Word / `text/markdown` 支持，移除普通 `text/plain` 作为通用允许类型，避免扩大到 `.txt`。

## 轻量验证矩阵

| 检查项 | 结果 | 证据 |
|---|---|---|
| tasks.md 全部完成 | PASS | 2/2 任务已勾选 |
| 改动文件与任务一致 | PASS | 目标代码范围为 ResumeUploader 和 bootcamp resume API |
| 类型检查 | PASS | `npx tsc --noEmit` 通过 |
| 针对性 lint | PASS | `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/bootcamp/ResumeUploader.tsx src/app/api/bootcamp/resume/route.ts --max-warnings 0` 通过 |
| 标准启动验证 | PASS | `./init.sh` 通过 9/9 |
| 安全检查 | PASS | 未新增密钥、未新增 unsafe 操作、未改变 API 结构或数据库 schema |

## 备注

工作区在本 tweak 开始前已有大量 UI 优化和 OpenSpec 归档相关未提交改动。本次验证只将 `.md/.markdown` 简历文件上传支持归属到当前 change，未回滚或重写既有改动。
