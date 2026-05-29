# Tasks — Fix Product Name in AI Prompt

- [x] 1. 修复 `questions` 模板字符串的双引号改为反引号
  - `src/app/api/cases/route.ts:52-53` — `"` → `` ` ``
  - 构建验证 (`npx tsc --noEmit`, `npx next build`)