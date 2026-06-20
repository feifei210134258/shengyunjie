# 战略思维旧框架残留热修设计说明

## 背景

用户线上截图显示：训练题标签已经是“业务判断”，但题干仍要求“运用机会成本分析框架”并计算显性/隐性机会成本。说明 2026-06-19 的维度策略已经改动了方向，但运行时 prompt 仍残留旧 framework 锚点。用户也指出答题区固定提示“推荐结构：结论 / 依据 / 风险 / 验证”不应写死。

## 目标

- 清除战略思维题中的旧机会成本分析框架锚点。
- 将战略思维运行时框架稳定为业务意图识别、取舍判断、验证指标。
- 删除答题区固定推荐结构提示，避免所有维度被同一模板约束。
- 增加回归测试，防止旧机会成本、显性/隐性成本词重新进入运行时策略。

## 实现结果

- `src/lib/training/dimension-strategy.ts` 中战略思维框架从“业务意图识别 / 机会成本分析 / 战略取舍框架”改为“业务意图识别 / 取舍判断 / 验证指标框架”。
- 战略思维策略移除“机会成本/显性成本/隐性成本”运行时锚点，改用选择标准、先做什么、暂时不做什么、放弃项、风险边界和验证指标。
- `src/lib/training/dimension-strategy.test.mjs` 增加回归断言，明确战略思维 prompt 不应包含机会成本分析、显性/隐性成本等旧框架词。
- `/training/session` 答题区删除固定“推荐结构：结论 / 依据 / 风险 / 验证”，标题改为“写下你的判断”。
- 旧预览变体中的同类固定提示也已删除。
- 前端样例中的“显性收益/隐性成本”改为“业务目标/暂不做什么/验证指标”。
- `docs/2026-05-19-prompt-strategy.md` 同步改为业务动作反推、取舍判断、资源排序、验证指标，并禁止抽象成本计算题。

## 验证记录

- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs` 通过。
- `rg -n "推荐结构：结论 / 依据 / 风险 / 验证|机会成本分析|显性机会成本|隐性机会成本|显性成本|隐性成本" src docs -S -g '!*.test.mjs'` 无运行代码/文档残留。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/training/dimension-strategy.ts src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- `git diff --check` 通过。
- 实现提交：`8fb6881 fix training strategy prompt residue`。

## 后续

- 该热修已清除已知残留，但仍建议在后续真实登录态中抽样生成战略思维题，确认题面不再使用旧机会成本分析框架。
