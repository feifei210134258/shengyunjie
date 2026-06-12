# Verification Report: fix-md-resume-next-step

## Change

修复 Markdown 简历上传后用户感觉“没反应”、或 AI JSON 输出带代码块导致无法进入简历解析结果/下一步的问题。

## Files Checked

- `src/components/bootcamp/ResumeUploader.tsx`
  - 文件上传模式新增解析中状态、禁用态和重复提交保护。
  - 解析中提示明确说明完成后会自动显示画像和下一步。
- `src/app/api/bootcamp/resume/route.ts`
  - 新增 `parseJsonFromAiText`，兼容纯 JSON、```json fenced block、JSON 前后带说明文字。
  - 简历画像和弱点预测都改用容错解析。
  - Prompt 收紧为只返回指定 JSON 结构。

## Verification

| Check | Result | Evidence |
|---|---:|---|
| TypeScript | PASS | `npx tsc --noEmit` |
| Targeted ESLint | PASS | `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/bootcamp/ResumeUploader.tsx src/app/api/bootcamp/resume/route.ts --max-warnings 0` |
| Whitespace | PASS | `git diff --check -- src/components/bootcamp/ResumeUploader.tsx src/app/api/bootcamp/resume/route.ts openspec/changes/fix-md-resume-next-step` |
| Full init | PASS | `./init.sh` 全部 9/9 通过 |
| Dev server page reachability | PASS | 重启 `npm run dev` 后 `/bootcamp/resume` 返回 200；未登录状态按中间件回到 `/login`，无运行时错误覆盖层 |
| Root cause removed | PASS | 未再出现 `JSON.parse(parsedText)` / `JSON.parse(weaknessText)` 直解析路径；上传区包含 `正在解析简历...` 可见状态文案 |

## Notes

- 浏览器中早先的 `Cannot read properties of undefined (reading 'call')` 来自 `./init.sh` 的 Next build 与仍在运行的 dev server 同时操作 `.next`，重启 dev server 后 `/bootcamp/resume` 恢复 200。
- 当前工作区在本 hotfix 前已有大量未提交 UI 优化与 OpenSpec 归档改动。本次验证只归属 Markdown 简历下一步修复相关文件，未回滚或提交既有改动。
