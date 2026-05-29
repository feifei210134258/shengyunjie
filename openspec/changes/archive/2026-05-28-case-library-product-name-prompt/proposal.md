# Proposal — Fix Product Name in AI Prompt

**问题**: AI 分析的内容与进入的产品完全不一致（如点击飞书 → 生成 Slack 分析）

**根因**: `src/app/api/cases/route.ts` 中 `generateArticle` 函数的 `questions` 变量使用了双引号 `"` 而非模板字符串反引号 `` ` ``。`${productName}` 和 `${perspective.label}` 被当作字面字符串传给 AI，导致 AI 收到的 prompt 是 `请对「${productName}」进行全面的产品分析...` 而非 `请对「飞书」进行全面的产品分析...`。

**修复**: 第 52-53 行双引号改为反引号，使变量正确插值。