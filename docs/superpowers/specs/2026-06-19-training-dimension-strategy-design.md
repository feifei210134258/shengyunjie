# 日常训练维度出题策略设计说明

## 背景

用户反馈日常训练第一题“战略思维”过复杂、宏大，难以通过日常训练提升。重新审视后确认：五个能力维度可以保留，但出题时必须把维度名翻译成可训练的小动作，避免直接生成战略作文题。

## 目标

- 保留五个能力维度，但为每个维度定义更具体的训练动作。
- 战略思维收敛为“业务判断与取舍”，训练业务意图识别、优先级选择、暂不做什么、风险边界和验证指标。
- 禁止战略思维生成第二增长曲线、12/18 个月路线图、泛市场规模分析、CEO 视角大题等宏大题。
- 让 `/api/train` 的生成题和分析反馈都能读取同一套维度策略。
- 前端示例题同步改为具体业务判断场景。

## 实现结果

- 新增 `src/lib/training/dimension-strategy.ts`，集中定义 5 个维度的能力定位、推荐框架、允许题型、训练重点和禁止题型。
- `/api/train` 生成题接入维度策略，题目必须落在当前维度允许题型内，并要求用户回答 2-3 个具体判断问题。
- `/api/train` 分析反馈接入维度策略，评分时优先参考该维度专项训练重点。
- `/training/session` 示例题从宏大 A/B 战略取舍改为免费试用调整类业务判断题。
- `docs/2026-05-19-prompt-strategy.md` 同步更新五维定义与出题规则。
- 将旧 `personalization.test.ts` 迁移为 `.mjs`，保持项目 Node 内置测试风格一致。

## 验证与部署记录

- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/lib/training/dimension-strategy.ts src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- `git diff --check` 通过。
- 已部署生产：服务器部署脚本输出 `DEPLOY_OK deploy/pm e5a35fe`。
- 公网验证：`BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。
- 公网页面验证：`curl https://pm.imfly.site/training/session` 确认新 chunk `page-ac33fcca71e41c94.js` 和新文案“业务判断”已上线。

## 风险与后续

- 维度策略是 prompt 约束，不等于完全可控的题库；仍需要继续观察真实生成题是否偏离。
- 后续可以补登录态接口验证，直接调用 `/api/train` 生成战略思维题，抽样检查题面是否稳定落在业务动作、取舍和指标验证。
