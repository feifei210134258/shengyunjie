# 会话进度日志

## [2026-07-09] Feature: 终版表达驱动模拟复述处方

### 背景判断
- Dashboard 已经把已入账终版表达展示为“面试弹药包”，但推荐引擎仍可能在强验证后继续给“打包表达”处方。
- 这会让用户在“已打包”的资产上重复打包；更合理的下一步是复述和追问验证临场稳定度。

### 完成内容
- `buildRecommendationPlan` 识别 `storyAssets[].finalInterviewAnswer`，在没有弱验证缺口时生成 `final-answer-rehearse-*` 面试处方。
- 新处方标题为“复述某项目的终版面试表达”，CTA 为“模拟复述”，入口指向 `/bootcamp/interview?focus=target_evidence`。
- Dashboard 训练处方说明补充“终版表达入账后，处方会转向模拟复述”。
- 产品设计文档和 `feature_list.json` 已同步记录。

### 验证记录
- TDD 红灯：recommendation 测试先失败于仍返回 `target-validation-package-*`；Dashboard 页面源测试先失败于缺少“终版表达入账后 / 模拟复述”。
- GREEN：`node --test src/lib/profile/recommendation.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 通过 21 项。

## [2026-07-09] Feature: Dashboard 面试弹药包

### 背景判断
- 终版面试表达已经能保存并入账，但 Dashboard 只在能力证据账本里展示，用户还需要自己判断下一步怎么使用。
- 从第一性原理看，已验证、已打包、已入账的表达应该直接变成可执行资产：复制、复述、再进模拟追问验证临场稳定度。

### 完成内容
- `buildCommandCenter` 从 `growthProfile.storyAssets[].finalInterviewAnswer` 派生 `actionDossier.interviewAmmoPack`。
- Dashboard 今日行动档案在有终版表达时优先展示“面试弹药包”，包含项目、公司、成熟度和终版表达。
- 面试弹药包支持一键复制终版表达，并提供“模拟复述”入口，指向 `/bootcamp/interview?focus=target_evidence`。
- 产品设计文档和 `feature_list.json` 已同步记录。

### 验证记录
- TDD 红灯：command center 测试先失败于缺少 `interviewAmmoPack`；Dashboard 页面源测试先失败于缺少“面试弹药包 / 复制终版表达 / 模拟复述”。
- GREEN：`node --test src/lib/dashboard/training-command-center.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 通过 23 项。
- `npx tsc --noEmit` 通过。
- 针对性 ESLint 通过：Dashboard 页面、command center 领域及相关测试。

## [2026-07-09] Feature: 终版面试表达入账

### 背景判断
- 项目故事库已经能保存 `finalInterviewAnswer`，但故事包入账仍只带目标证据和讲述稿；Dashboard 画像账本读不到终版表达。
- 第一性原理上，终版面试表达是“可直接拿去面试”的最终资产，必须进入画像账本，否则推荐与首页调度无法知道用户已经完成打包。

### 完成内容
- 故事库“沉淀到画像账本”会把 `story.finalInterviewPackage.savedAnswer` 作为 `projectStory.finalInterviewAnswer` 提交到 `/api/profile/summary`。
- `POST /api/profile/summary` 保留 `finalInterviewAnswer` 并写入 `growth_snapshots.dimension_scores.__trigger.projectStory`。
- `buildGrowthProfile` 从项目故事快照读回 `storyAssets[].finalInterviewAnswer`。
- Dashboard 能力证据账本在已入账项目资产中展示“终版面试表达”。

### 验证记录
- TDD 红灯：story-bank 页面源测试先失败于故事包入账未提交 `finalInterviewAnswer`；profile summary 源测试先失败于未保留 `finalInterviewAnswer`；growth-profile 测试先失败于 `storyAssets[].finalInterviewAnswer` 为 `undefined`；Dashboard 页面源测试先失败于缺少“终版面试表达”。
- GREEN：`node --test src/lib/profile/growth-profile.test.mjs src/app/api/profile/summary/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs' 'src/app/(app)/bootcamp/story-bank/page.test.mjs'` 通过 38 项。
- 回归与完整验证：`node --test src/lib/profile/growth-profile.test.mjs src/app/api/profile/summary/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs' 'src/app/(app)/bootcamp/story-bank/page.test.mjs' feature_list.test.mjs` 通过 40 项；`npx tsc --noEmit`、`ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0`、`node -e "JSON.parse(...feature_list.json...)"`、`git diff --check`、`npm run build`、`./init.sh` 均通过。

## [2026-07-09] Feature: 终版面试表达打包

### 背景判断
- 推荐引擎已经能在目标证据抗住追问后生成“打包表达”处方，但 `/bootcamp/story-bank` 还没有对应的终版表达工作台。
- 第一性原理上，强验证后的下一步不是再补证据，而是把已验证证据压成可复述、可复制、可保存的 90 秒面试表达。

### 完成内容
- `ProjectStory` 新增 `finalInterviewPackage`，从目标证据、2 分钟讲述稿、目标简报和已保存终版表达中派生终版表达底稿。
- `PATCH /api/bootcamp/story-bank` 支持 `finalInterviewAnswerText`，写回 `bootcamp_sessions.parsed_profile.projects[].finalInterviewAnswer`，刷新后从同一 API 读回。
- 项目故事库页面新增“终版面试表达”工作台，支持编辑、保存和复制终版表达。

### 验证记录
- TDD 红灯：故事库领域测试先失败于缺少 `finalInterviewPackage`，API 源测试先失败于缺少 `finalInterviewAnswerText`，页面源测试先失败于缺少“终版面试表达”。
- GREEN：`node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs'` 通过 25 项。
- 回归与完整验证：`node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs' feature_list.test.mjs` 通过 27 项；`npx tsc --noEmit`、`ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0`、`node -e "JSON.parse(...feature_list.json...)"`、`git diff --check`、`npm run build`、`./init.sh` 均通过。

## [2026-07-09] Feature: 抗追问结果驱动下一步处方

### 背景判断
- 目标证据追问结果已经入账，但推荐引擎仍只看项目故事包是否有缺口；用户可能在“已被追问验证”之后继续看到同一条模拟追问入口。
- 第一性原理上，追问结果必须改变下一步：弱验证回到故事库补击穿点，强验证进入终版面试表达打包。

### 完成内容
- `buildRecommendationPlan` 读取 `growthProfile.targetEvidenceValidations[0]`，优先于普通 story asset 生成面试处方。
- 当验证状态为 `weak/unclear`、分数低于 8 或存在 `unresolvedRisks` 时，生成 `target-validation-repair-*` 处方，指向 `/bootcamp/story-bank`，CTA 为“补击穿点”，理由引用第一条击穿风险和 `nextDrill`。
- 当验证结果已扛住追问时，生成 `target-validation-package-*` 处方，指向 `/bootcamp/story-bank`，CTA 为“打包表达”，把已验证证据推进到终版面试表达资产。
- Dashboard 训练处方说明补充“根据抗追问结果决定补击穿点或打包面试表达”。

### 验证记录
- TDD 红灯：recommendation 测试先失败于仍返回 `story-validate-*`；Dashboard 页面源测试先失败于缺少“打包面试表达”说明。
- GREEN：`node --test src/lib/profile/recommendation.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 通过 19 项。
- 回归：`node --test src/lib/profile/recommendation.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/app/api/profile/recommendation/route.test.mjs src/lib/profile/growth-profile.test.mjs feature_list.test.mjs` 通过 30 项。
- 完整验证：`npx tsc --noEmit`、`ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0`、`node -e "JSON.parse(...feature_list.json...)"`、`git diff --check`、`npm run build`、`./init.sh` 均通过。原始 `npx eslint src/ --max-warnings 0` 因项目仍使用 `.eslintrc.json` 与 ESLint 9 flat config 默认行为不兼容而退出，按 `init.sh` 的既有命令补跑通过。

## [2026-07-09] Feature: 目标证据追问评分入账

### 背景判断
- 目标证据已经能进入模拟追问，但用户答完后评分仍是普通面试反馈，画像账本不知道这段证据是否真的抗追问。
- 面试跳槽路径的闭环应当是：证据入账 → 高压追问 → 判断是否扛住 → 验证结果入账 → Dashboard 读回下一步风险。

### 完成内容
- `/bootcamp/interview` 提交和重新生成评分时会继续传递 `interviewFocus=target_evidence`，并在评分入账后显示“验证结果已入账”。
- `POST /api/bootcamp/interview/answer` 在目标证据模式下读回最近入账的 `targetEvidenceFocus`，要求 AI 额外输出 `target_evidence_validation`，评估归因、角色价值、取舍、协同和可复用机制是否抗追问。
- 评分结果写回 `bootcamp_interviews.ai_evaluation`，并同步插入 `growth_snapshots.dimension_scores.__trigger.targetEvidenceValidation`，trigger=`target_evidence_validated`，不新增 schema。
- `buildGrowthProfile` 读回 `targetEvidenceValidations`；Dashboard 能力证据账本新增“目标证据验证”，展示抗追问评分、击穿点和继续追问入口。
- `AnswerEvaluation` 新增“目标证据验证”反馈卡，直接展示抗追问评分、已证明住的点、未解除风险和下一轮补强动作。

### 验证记录
- TDD 红灯：新增 answer API、AnswerEvaluation、interview page、growth-profile、Dashboard 测试，先失败于缺少 `target_evidence_validation`、`target_evidence_validated` 快照、页面传参和账本读回。
- GREEN：`node --test src/app/api/bootcamp/interview/answer/route.test.mjs src/components/bootcamp/AnswerEvaluation.test.mjs 'src/app/(app)/bootcamp/interview/page.test.mjs' src/lib/profile/growth-profile.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 通过 23 项。
- `npx tsc --noEmit` 通过。

## [2026-07-09] Feature: 入账目标证据进入模拟追问

### 背景判断
- 上一轮推荐已经能在目标证据齐全后指向模拟追问，但 `/bootcamp/interview` 仍只按简历和弱点泛化出题。
- 对面试跳槽冲刺来说，证据资产必须进入追问现场：面试官应该围绕刚入账的结果证据追问归因、取舍和角色价值。

### 完成内容
- `story-validate-*` 推荐链接改为 `/bootcamp/interview?focus=target_evidence`。
- `GET /api/bootcamp/interview` 从 `growth_snapshots.dimension_scores.__trigger.projectStory` 读回最近入账的 `targetEvidenceFocus` 并返回给页面。
- `POST /api/bootcamp/interview` 接收 `interviewFocus=target_evidence`，把目标证据写入 AI 出题 prompt，并优先生成 5 道围绕该证据的高压追问题。
- `/bootcamp/interview` 页面读取 URL focus，展示“目标证据追问”卡片，并在生成下一天题目时继续传递 `interviewFocus`。

### 验证记录
- TDD 红灯：推荐测试先失败于 href 仍为 `/bootcamp/interview`；新增 API 源测试先失败于没有读取 `growth_snapshots` / `targetEvidenceFocus`；新增页面源测试先失败于没有 `useSearchParams`、目标证据追问卡和 POST focus 传递。
- 构建红灯：`npm run build` 先失败于 `/bootcamp/interview` 使用 `useSearchParams` 但缺少 Suspense 边界；已改为外层 `Suspense` + 内层 `BootcampInterviewContent`，并补页面源测试防回归。
- GREEN：`node --test src/lib/profile/recommendation.test.mjs`、`node --test src/app/api/bootcamp/interview/route.test.mjs`、`node --test 'src/app/(app)/bootcamp/interview/page.test.mjs'` 均通过；`npx tsc --noEmit` 通过；`npm run build` 通过。

## [2026-07-09] Feature: 入账目标证据驱动模拟追问

### 背景判断
- 目标证据入账后，推荐引擎仍会把 `storyAssets[0]` 统一转成“补项目证据”，容易让用户回到已完成缺口。
- 面试跳槽冲刺的下一步应该是验证这段证据是否经得起高压追问，而不是继续重复补同一条材料。

### 完成内容
- `buildRecommendationPlan` 在项目故事资产已包含 `targetEvidence` 且 `targetFit.missingEvidence` / `proofGaps` 为空时，生成 `story-validate-*` 面试处方。
- 新处方指向 `/bootcamp/interview`，CTA 为“进入模拟追问”，理由引用已入账目标证据和目标简报。
- 保留原有缺口分支：只要仍有 `targetFit.missingEvidence` 或 `proofGaps`，继续生成“补项目证据”处方。
- Dashboard 训练处方说明同步更新：项目故事包入账后先补证据，证据齐了推进到模拟追问验证。

### 验证记录
- TDD 红灯：推荐测试先失败于 `story-gap-*`，说明已入账目标证据仍被当作补证据缺口；Dashboard 页面源测试先失败于缺少“模拟追问验证”文案。
- GREEN：`node --test src/lib/profile/recommendation.test.mjs` 通过 5 项；`node --test 'src/app/(app)/dashboard/page.test.mjs'` 通过 11 项。
- 回归：`node --test src/lib/profile/recommendation.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/app/api/profile/recommendation/route.test.mjs src/app/api/profile/summary/route.test.mjs src/lib/profile/growth-profile.test.mjs feature_list.test.mjs` 通过 36 项。
- `npx tsc --noEmit`、针对性 ESLint、`feature_list.json` 解析、`git diff --check`、`npm run build`、`./init.sh` 均通过。

## [2026-07-09] Feature: Dashboard 一键入账目标证据

### 背景判断
- 上一轮 Dashboard 已经能识别“目标证据已修好但未入账”，但仍把用户送回故事库再点一次，证据生产链多了一次跳转。
- 面试跳槽冲刺需要的是最短动作链：看到该入账 → 点击入账 → 写入画像账本 → 本屏读回成功。

### 完成内容
- `targetEvidenceDepositAction` 增加可提交的 `targetFit`，用于 Dashboard 直接构造项目故事包快照。
- Dashboard 今日行动档案的“现在入账”从链接改为按钮，直接 `POST /api/profile/summary`，`trigger=project_story_saved`。
- 入账 payload 包含 `projectName/company/role/targetEvidence/readinessScore/targetFit/interviewScript`，继续写入既有 `growth_snapshots.dimension_scores.__trigger.projectStory`，不新增 schema。
- 入账成功后 Dashboard 重新拉取 `/api/dashboard`，并在本屏显示“入账成功 / 已入账：项目名”的完成态。
- 失败时在卡片内展示内联错误，不使用 `alert`。

### 验证记录
- TDD 红灯：command center 测试先失败于 `targetEvidenceDepositAction.targetFit` 缺失；Dashboard 页面源测试先失败于缺少 `handleDepositTargetEvidence`、`project_story_saved`、`targetEvidence` 和 `targetFit` 入账 payload。
- 补充红灯：长目标证据先失败于 `targetEvidenceDepositAction.targetEvidence` 被 120 字截断；修复为领域层保留完整证据，避免入账资产丢失信息。
- GREEN：`node --test src/lib/dashboard/training-command-center.test.mjs` 通过 9 项；`node --test 'src/app/(app)/dashboard/page.test.mjs'` 通过 11 项。
- 回归：`node --test src/lib/dashboard/training-command-center.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/app/api/profile/summary/route.test.mjs src/lib/profile/growth-profile.test.mjs feature_list.test.mjs` 通过 35 项。
- `npx tsc --noEmit`、针对性 ESLint、`feature_list.json` 解析、`git diff --check`、`npm run build`、`./init.sh` 均通过。

## [2026-07-09] Feature: Dashboard 目标证据入账行动

### 背景判断
- 目标证据修补完成后，如果用户没有立刻点击“沉淀项目故事包”，Dashboard 仍可能看不到这份新证据，下一次打开首页会失去“现在该入账”的连续性。
- 从第一性原理看，面试跳槽路径的关键不是多一个输入框，而是让“补证据 → 入账 → 推荐继续读”成为不可中断的证据生产链。

### 完成内容
- `/api/dashboard` 从 `bootcamp_sessions.parsed_profile.projects[].targetEvidence` 读回已修补目标证据，并排除已经以项目故事包形式入账的项目。
- `buildCommandCenter` 新增 `targetEvidenceDepositAction`，当发现“已修补但未入账”的项目时，今日行动档案优先提示“目标证据已修好 / 现在入账”。
- Dashboard 目标证据卡在该状态下展示已修补证据摘要、目标匹配和“现在入账”入口，而不是继续提示补同一条证据。
- `/bootcamp/story-bank` 保存项目故事包时把 `targetEvidence` 一并 POST 到 `/api/profile/summary`；`profile summary` 写入 growth snapshot 后，`buildGrowthProfile` 可从 `storyAssets[].targetEvidence` 读回并在 Dashboard 证据账本展示。
- 产品设计文档已同步记录“修补目标证据 → Dashboard 入账行动 → 画像账本读回”的闭环。

### 验证记录
- TDD 红灯：新增 command center、Dashboard API、Dashboard 页面、story-bank 页面、profile summary 和 growth-profile 测试，先失败于缺少 `targetEvidenceDepositAction`、缺少 Dashboard API 读回 `targetEvidence`、故事包入账未携带 `targetEvidence`。
- GREEN：`node --test src/lib/dashboard/training-command-center.test.mjs` 通过 9 项；`node --test src/lib/profile/growth-profile.test.mjs` 通过 3 项；`node --test src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs' 'src/app/(app)/bootcamp/story-bank/page.test.mjs' src/app/api/profile/summary/route.test.mjs` 通过 36 项。
- 回归：`node --test src/lib/dashboard/training-command-center.test.mjs src/lib/profile/growth-profile.test.mjs src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs' 'src/app/(app)/bootcamp/story-bank/page.test.mjs' src/app/api/profile/summary/route.test.mjs feature_list.test.mjs` 通过 50 项。
- `npx tsc --noEmit`、针对性 ESLint、`feature_list.json` 解析、`git diff --check`、`npm run build`、`./init.sh` 均通过。

## [2026-07-09] Feature: 目标证据修补完成态

### 背景判断
- 上一轮故事库已经能保存 `targetEvidence`，但如果系统仍继续把目标岗位/目标场景/目标期限当成未补证据，用户会感觉“补了也没用”。
- 这一轮让修补动作真正改变产品判断：补过目标证据后，同一条目标缺口不再重复出现，下一步从“继续补证据”切到“沉淀到账本 / 进入追问验证”。

### 完成内容
- `getProjectTargetFit` 会把 `project.targetEvidence` 计入目标匹配分，并在已补目标证据时清空 `targetFit.missingEvidence`。
- `targetFit.reason` 会引用已补的目标证据，说明该项目如何支撑当前目标。
- `targetEvidenceRepair.focusGap` 在已保存目标证据后显示“目标证据已补”，避免继续提示同一条缺口。
- `recommendedNextAction` 在目标证据已补时切换为“沉淀项目故事包”，引导用户把新证据写入画像账本。
- `/bootcamp/story-bank` 的目标证据输入区显示“目标证据已补，下一步沉淀到画像账本”。

### 验证记录
- TDD 红灯：新增 story-bank 领域测试和页面源测试，先失败于 `missingEvidence` 仍然包含目标岗位/场景/期限缺口、页面缺少“目标证据已补”文案。
- GREEN：`node --test src/lib/bootcamp/story-bank.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs'` 通过 16 项。
- 回归：`node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs' feature_list.test.mjs` 通过 23 项。
- `npx tsc --noEmit`、针对性 ESLint、`feature_list.json` 解析、`git diff --check`、`npm run build`、`./init.sh` 均通过。

## [2026-07-09] Feature: 目标证据修补台

### 背景判断
- Dashboard 已经能指出“为了目标岗位先修哪个项目、补哪条证据”，但用户点进故事库后，项目详情仍主要是通用的角色、描述和结果指标编辑。
- 从第一性原理看，面试跳槽强化的最小闭环应该是：系统指出目标证据缺口 → 用户直接补这条证据 → 证据落库 → 刷新后讲述稿和后续入账都能读回。

### 完成内容
- `ProjectStory` 新增 `targetEvidenceRepair`，包含当前目标缺口、已保存目标证据和修补提示。
- `PATCH /api/bootcamp/story-bank` 接收 `targetEvidenceText`，写回 `bootcamp_sessions.parsed_profile.projects[].targetEvidence`，不新增 schema。
- `buildStoryBank` 读回 `project.targetEvidence`，并把它合入 2 分钟讲述稿的“结果证据”段，让修补后的目标证据可以直接用于面试表达。
- `/bootcamp/story-bank` 项目详情新增“目标证据修补台”和“补这条目标证据”输入区，保存时与角色、描述、结果指标一起落库。
- 产品设计文档已同步记录目标证据修补台链路。

### 验证记录
- TDD 红灯：`node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs'` 先失败于缺少 `targetEvidenceRepair`、`targetEvidenceText` 和页面“目标证据修补台”。
- GREEN：同一 focused node 测试通过 19 项。
- `node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs' feature_list.test.mjs` 通过 21 项。
- `npx tsc --noEmit` 通过。
- 针对性 ESLint 通过：story-bank 领域、API、页面及相关测试。
- `feature_list.json` JSON 解析通过。
- `git diff --check` 通过。
- `npm run build` 通过，`/bootcamp/story-bank` 构建体积更新为 6.97 kB。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-08] Feature: Dashboard 目标证据行动

### 背景判断
- 当前产品的第一性原理是帮用户为了目标岗位快速补齐可信证据，而不是让用户自己在故事库、训练复盘和推荐之间来回找线索。
- 项目故事库已经能把项目与目标岗位/场景匹配起来，但 Dashboard 首屏还没有直接回答“今天为了目标岗位，先修哪个项目、补哪条证据”。

### 完成内容
- `buildCommandCenter` 新增 `storyAssets` 和 `latestGoalBrief` 入参，`actionDossier` 新增 `targetEvidenceAction`。
- 当已入账项目故事包带有 `targetFit.missingEvidence` 时，Dashboard 今日行动档案会挑选目标匹配分最高的项目，生成“目标证据行动”。
- `/api/dashboard` 把 `growthProfile.storyAssets` 和最近目标简报传入命令中心，继续复用既有 `growth_snapshots` 读回链路，不新增 schema。
- Dashboard 首屏新增“先修项目 / 目标匹配 / 补这条证据”，入口指向 `/bootcamp/story-bank`，让面试跳槽路径的下一步动作更具体。
- 产品设计文档和 `feature_list.json` 已同步记录本轮调整。

### 验证记录
- TDD 红灯：`node --test src/lib/dashboard/training-command-center.test.mjs src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 先失败于缺少 `targetEvidenceAction`、缺少 API 入参传递和页面文案。
- GREEN：同一 focused node 测试通过 22 项。
- `npx tsc --noEmit` 通过。
- 针对性 ESLint 通过：`src/lib/dashboard/training-command-center.ts`、Dashboard API/页面及相关测试。
- `feature_list.json` JSON 解析通过，`git diff --check` 通过。
- `npm run build` 通过，`/dashboard` 构建体积更新为 38.9 kB。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-08] Feature: 目标项目匹配入账反哺画像

### 背景判断
- 上一轮项目故事库已经能判断哪个项目最适合当前目标，但用户点击“沉淀到画像账本”时只保存成熟度和证据缺口，目标匹配理由还没有进入长期画像。
- 如果目标匹配不入账，Dashboard 和推荐仍只能说“某项目有缺口”，不能说“这个项目为什么服务当前目标、下一步补哪条目标证据”。

### 完成内容
- `/bootcamp/story-bank` 保存项目故事包时，把 `story.targetFit` 一并 POST 到 `/api/profile/summary`。
- `/api/profile/summary` 在 `project_story_saved` 中清洗并保存 `targetFit.score/priorityLabel/reason/missingEvidence`，继续写入既有 `growth_snapshots.dimension_scores.__trigger.projectStory`，不新增 schema。
- `buildGrowthProfile` 从成长快照读回项目故事包的目标匹配信息，`storyAssets[].targetFit` 成为画像证据账本的一部分。
- Dashboard 的“已入账项目资产”展示目标匹配标签和目标证据缺口。
- 推荐引擎优先使用 `targetFit.missingEvidence` 生成项目证据处方，并把证据标签从单纯成熟度升级为“优先讲 · 目标匹配 x/10”。

### 验证记录
- TDD 红灯：故事库页面测试先失败于未 POST `targetFit`；profile summary 测试先失败于未清洗 `targetFit`；growth-profile 测试先失败于未读回 `storyAssets[].targetFit`；Dashboard 测试先失败于未展示目标匹配；recommendation 测试先失败于仍用普通 `proofGaps` 而不是目标证据缺口。
- GREEN：`node --test 'src/app/(app)/bootcamp/story-bank/page.test.mjs' src/app/api/profile/summary/route.test.mjs src/lib/profile/growth-profile.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/lib/profile/recommendation.test.mjs` 通过 32 项。
- `npx tsc --noEmit` 通过。

## [2026-07-08] Feature: 项目故事库目标项目优先级

### 背景判断
- 面试证据库已经能读取目标岗位、目标场景和目标期限，但故事库内仍主要按项目成熟度展示，用户还需要自己判断哪个项目最适合当前跳槽目标。
- 从第一性原理看，面试准备不是平均打磨所有项目，而是先找到最能证明目标岗位能力的项目，再补齐岗位/场景相关证据。

### 完成内容
- `buildStoryBank` 新增 `latestGoalBrief` 入参和返回值；每个 `ProjectStory` 增加 `targetFit`，包含目标匹配分、优先级标签、匹配理由和目标证据缺口。
- `GET/PATCH /api/bootcamp/story-bank` 从 `growth_snapshots.dimension_scores.__goalBrief` 读回最近目标简报，并传给故事库聚合；不新增 schema。
- `/bootcamp/story-bank` 左侧新增“目标项目优先级”，项目列表展示“优先讲/备选讲/暂缓讲”和目标匹配度；项目详情新增“目标匹配度”和“补齐目标证据”。
- 推荐动作在存在目标简报时从“泛化高风险项目”改为优先打磨最能支撑目标的项目。

### 验证记录
- TDD 红灯：`story-bank.test.mjs` 先失败于没有 `latestGoalBrief/targetFit/targetPriorityProject`；`route.test.mjs` 先失败于没有读取 `growth_snapshots/__goalBrief`；`page.test.mjs` 先失败于没有“目标项目优先级 / 目标匹配度 / 补齐目标证据”。
- GREEN：`node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs'` 通过；`npx tsc --noEmit` 通过。

## [2026-07-08] Feature: 面试证据库接入目标简报

### 背景判断
- Dashboard 已经能保存目标岗位、目标场景和目标期限；训练首页和训练实战页也已围绕这个目标出题。
- 面试证据库如果不读这份目标，用户进入 `/bootcamp` 后仍会看到泛化的“补项目证据”，而不是“为了某个岗位/面试场景补哪类证据”。

### 完成内容
- `buildBootcampHub` 新增 `latestGoalBrief` 入参和返回值；当存在目标简报时，`sprintBrief.primaryGoal` 会改成服务目标岗位的面试证据。
- `evidenceBank.primaryNextAction.reason` 和 `proofGaps.note` 会引用目标场景和目标期限，让补证据动作更贴近实际面试。
- `GET /api/bootcamp/hub` 从 `growth_snapshots.dimension_scores.__goalBrief` 读回最近目标简报，并传入 hub 聚合。
- `/bootcamp` 右侧新增“目标证据令”，展示目标岗位、目标场景、目标期限；缺省时给出未设置/默认准备态。
- 复用既有 `growth_snapshots`，不新增 schema。

### 验证记录
- TDD 红灯：`hub.test.mjs` 先失败于缺少 `latestGoalBrief`；`route.test.mjs` 先失败于没有读取 `growth_snapshots/__goalBrief`；`page.test.mjs` 先失败于缺少“目标证据令 / 目标岗位 / 目标场景 / 目标期限”。
- GREEN：`node --test src/lib/bootcamp/hub.test.mjs`、`node --test src/app/api/bootcamp/hub/route.test.mjs`、`node --test 'src/app/(app)/bootcamp/page.test.mjs'` 通过。
- 完整验证：`node --test src/lib/bootcamp/hub.test.mjs src/app/api/bootcamp/hub/route.test.mjs 'src/app/(app)/bootcamp/page.test.mjs' feature_list.test.mjs`、`npx tsc --noEmit`、针对性 ESLint、`feature_list.json` 解析、`git diff --check`、`npm run build` 均通过。
- 浏览器插件检查本地 `/bootcamp` 时连续超时，未作为完成证据；本轮以前述测试、类型、lint、构建和 `./init.sh` 作为验证证据。

## [2026-07-08] Feature: 面试证据库首屏

### 背景判断
- 面试跳槽产品的第一性原理不是“进入训练营”，而是让用户知道自己手里有哪些能被面试官相信的证据。
- `/bootcamp` 需要从作战台进一步收束为证据库：可讲项目、证据缺口、追问风险、表达资产，以及下一步只做一件事。

### 完成内容
- `buildBootcampHub` 新增 `evidenceBank`，从既有 `bootcamp_sessions`、`bootcamp_interviews` 和 `training_records.ai_feedback` 派生证据库状态，不新增 schema。
- `GET /api/bootcamp/hub` 返回 `evidenceBank`，前端继续只通过 API 读取持久化事实。
- `/bootcamp` 首屏标题改为“面试证据库”，展示“可讲项目 / 证据缺口 / 追问风险 / 表达资产”四个证据维度。
- 右侧主行动改为“下一步只做这件事”，按证据缺口优先引导补项目证据；下方保留资产生产线和故事库/模拟面试/报告入口。
- 产品设计文档与实施计划同步记录本轮证据库切片。

### 验证记录
- TDD 红灯：`hub.test.mjs` 先失败于缺少 `evidenceBank`；`route.test.mjs` 先失败于 API 未返回 `evidenceBank`；`page.test.mjs` 先失败于缺少“面试证据库 / 证据缺口 / 下一步只做这件事”等文案。
- GREEN：`node --test src/lib/bootcamp/hub.test.mjs`、`node --test src/app/api/bootcamp/hub/route.test.mjs`、`node --test 'src/app/(app)/bootcamp/page.test.mjs'` 已通过。
- 完整验证：`node --test src/lib/bootcamp/hub.test.mjs src/app/api/bootcamp/hub/route.test.mjs 'src/app/(app)/bootcamp/page.test.mjs' feature_list.test.mjs`、`npx tsc --noEmit`、针对性 ESLint、`feature_list.json` 解析、`git diff --check`、`npm run build`、`./init.sh` 均通过。
- 浏览器渲染检查：本地 `http://localhost:3000/bootcamp` 可见“面试证据库”“证据缺口”“下一步只做这件事”，无横向溢出；检查后已清理临时浏览器本地登录态。

## [2026-07-08] Feature: 训练首页今日作战台

### 背景判断
- 训练首页不应只是统计、日历和记录列表，而应回答用户进入页面后的第一个问题：今天先做什么，为什么做，做完沉淀成什么。
- 上一轮目标简报已经进入推荐和训练实战，本轮把它前置到训练首页首屏，让目标、处方、复盘和证据资产形成同屏作战顺序。

### 完成内容
- `/training` 首屏从“主训练卡 + 月节奏卡”重排为三栏“今日作战台”：今日处方、目标作战令、作战顺序。
- 训练首页读取 `GET /api/profile/recommendation` 返回的 `latestGoalBrief`，展示目标岗位、目标场景和目标期限。
- 作战顺序明确展示“先复盘 / 再开题 / 沉淀证据”，根据复盘队列和证据资产动态显示待修正数量与可用资产数。
- 月节奏降级到统计条，复盘队列和能力证据资产保留在首屏下方，形成从行动到沉淀的连续路径。

### 验证记录
- TDD 红灯：`TrainingOverviewClient.test.mjs` 先失败于缺少 `latestGoalBrief/目标作战令/今日作战台/作战顺序`。
- GREEN：`node --test src/components/training/TrainingOverviewClient.test.mjs` 通过 6 项。
- `npx tsc --noEmit` 通过。
- 浏览器实测：本地 `http://localhost:3000/training` 首屏渲染出“今日作战台”“目标作战令”“作战顺序”，可见主行动和目标简报兜底。
- 后续完整验证见本轮提交说明。

## [2026-07-08] Feature: 目标简报驱动推荐与训练

### 背景判断
- 第一性原理上，产品不是“多练几道题”，而是把用户的目标岗位、目标场景和期限变成训练调度信号。
- 上一轮已经能保存目标简报，但它只停留在 Dashboard 回填；本轮把它接入推荐、训练实战、题目缓存和 AI prompt。

### 完成内容
- `GET /api/profile/recommendation` 读取最近 `growth_snapshots.dimension_scores.__goalBrief`，返回 `latestGoalBrief`，并把它传入 `buildRecommendationPlan`。
- `buildRecommendationPlan` 会在训练处方和面试证据处方中引用目标岗位、目标场景和目标期限，让推荐不再泛化。
- `GET /api/training/sessions?date=...` 返回 `latestGoalBrief`；训练实战页顶部展示“目标简报”，并把目标简报随题目写入 `training_sessions.questions`。
- `/api/training/questions` 保存并读回 `goalBrief`，刷新训练页后不丢失目标上下文。
- `/api/train` 出题与分析 prompt 接收目标简报，要求题目、反馈、示例回答、面试表达资产和下一题建议服务同一个结果目标。
- 产品设计文档和 `feature_list.json` 同步记录该闭环；本轮不新增 schema。

### 验证记录
- TDD 红灯：推荐引擎、推荐 API、训练 sessions API、题目缓存 API、训练实战页和 `/api/train` 测试先失败于缺少 `goalBrief/latestGoalBrief`。
- GREEN：`node --test src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.test.mjs src/app/api/training/sessions/route.test.mjs src/app/api/training/questions/route.test.mjs src/components/training/TrainingSessionClient.test.mjs src/app/api/train/route.test.mjs` 通过 36 项。
- `npx tsc --noEmit` 通过。
- 后续完整验证见本轮提交说明。

## [2026-07-08] Feature: Dashboard 目标简报

### 背景判断
- 当前产品已经能选择“面试跳槽冲刺 / 高级产品思维训练”主线，但第一性原理上，训练处方还需要更具体的目标上下文：目标岗位、目标场景和期限。
- 本轮先把目标简报作为可持久化、可读回的首页状态落地，避免用户每次打开都重新解释自己到底为什么训练。

### 完成内容
- `/api/profile/summary` 新增 `trigger=goal_brief_saved`，将 `targetRole/targetScenario/targetDeadline` 写入既有 `growth_snapshots.dimension_scores.__goalBrief`，不新增 schema。
- `/api/dashboard` 从最近的 `growth_snapshots.dimension_scores.__goalBrief` 读回 `latestGoalBrief`。
- Dashboard 首屏新增“目标简报”编辑区，用户可保存目标岗位、目标场景和目标期限；保存后刷新 `/api/dashboard` 并回填已读回内容。
- 产品设计文档和 `feature_list.json` 同步记录目标简报闭环。

### 验证记录
- TDD 红灯：profile summary API 测试先失败于缺少 `goal_brief_saved/__goalBrief`；dashboard API 和页面测试先失败于缺少 `latestGoalBrief/goalBriefDraft/handleSaveGoalBrief`。
- GREEN：`node --test src/app/api/profile/summary/route.test.mjs` 通过 10 项；`node --test src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 通过 12 项。
- 回归：`node --test src/app/api/profile/summary/route.test.mjs src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs' feature_list.test.mjs` 通过 24 项。
- `npx tsc --noEmit`、针对性 ESLint、`feature_list.json` 解析、`git diff --check`、`npm run build`、`./init.sh` 均通过。

## [2026-07-08] Feature: 迁移缺口驱动下一题

### 背景判断
- 高级产品思维训练的关键不是生成更多题，而是识别“上一题升级点有没有迁移到新场景”。
- 已入账的 `migrationCheck` 如果只存档、不改变下一题处方，系统仍会回到泛化推荐。

### 完成内容
- `buildRecommendationPlan` 读取 `thinkingAssets[].migrationCheck`，当迁移验证显示未迁移、证据不足或仍停留在功能清单时，下一题训练处方改为“补上某维度的迁移缺口”。
- 训练实战页的“本题迁移目标”新增“上次迁移验证”，让用户作答前明确上一轮到底缺什么。
- `/api/training/questions` 的 `sanitizeMigrationTarget` 保留 `migrationCheck`，刷新或恢复当天题目时不会丢失迁移缺口上下文。
- 产品设计文档和 `feature_list.json` 同步记录“迁移验证 → 缺口处方 → 下一题迁移练习”的闭环。

### 验证记录
- TDD 红灯：推荐引擎测试先失败于标题仍是“延续思维升级”；训练页源测试先失败于缺少 `migrationCheck/上次迁移验证`；题目缓存 API 测试先失败于未保存 `migrationCheck`。
- GREEN：`node --test src/lib/profile/recommendation.test.mjs` 通过 3 项；`node --test src/components/training/TrainingSessionClient.test.mjs` 通过 8 项；`node --test src/app/api/training/questions/route.test.mjs` 通过 4 项。
- 回归：`node --test src/lib/profile/recommendation.test.mjs src/components/training/TrainingSessionClient.test.mjs src/app/api/training/questions/route.test.mjs src/app/api/profile/recommendation/route.test.mjs src/app/api/training/sessions/route.test.mjs src/lib/profile/growth-profile.test.mjs feature_list.test.mjs` 通过 26 项。
- `npx tsc --noEmit`、针对性 ESLint、`feature_list.json` 解析、`git diff --check`、`npm run build`、`./init.sh` 均通过。

## [2026-07-08] Feature: 思维迁移验证入账

### 背景判断
- 当前产品的第一性原理不是“多刷题”，而是让每次训练产生可迁移的高级 PM 判断证据。
- 上一轮已经让 AI 在反馈里产出 `thinking_upgrade.migration_check`，但如果它只停留在反馈面板，下一轮画像和处方无法判断用户是否真的把升级点迁移到了新题。

### 完成内容
- 历史复盘页的“思维升级卡”新增“迁移验证”，直接读回 `training_records.ai_feedback.thinking_upgrade.migration_check`。
- “沉淀思维升级”会把 `migration_check` 随同判断、取舍、归因、落地四项一起提交到 `/api/profile/summary`。
- `/api/profile/summary` 将迁移验证写入既有 `growth_snapshots.dimension_scores.__trigger.thinkingUpgrade`，不新增 schema。
- `buildGrowthProfile` 读回 `thinkingAssets[].migrationCheck`，让迁移验证成为画像账本里的长期证据。
- 产品设计文档同步记录这条“迁移验证 → 画像账本 → 后续处方可引用”的闭环。

### 验证记录
- TDD 红灯：历史页、profile summary API、growth profile 测试先捕获缺少 `migration_check` 展示、提交、入账和读回。
- GREEN：`node 'src/app/(app)/training/history/[id]/page.test.mjs'` 通过 7 项；`node --test src/app/api/profile/summary/route.test.mjs src/lib/profile/growth-profile.test.mjs` 通过 12 项。
- 回归：`node --test src/app/api/profile/summary/route.test.mjs src/lib/profile/growth-profile.test.mjs src/app/api/train/route.test.mjs src/lib/training/personalization.test.mjs src/components/training/TrainingSessionClient.test.mjs feature_list.test.mjs` 通过 38 项。
- `npx tsc --noEmit`、针对性 ESLint、`git diff --check`、`feature_list.json` 解析、`npm run build`、`./init.sh` 均通过。

## [2026-07-08] 训练反馈：校验思维升级是否迁移成功

### 完成内容
- `/training/session` 提交分析时把当前 `migrationTarget` 传给 `/api/train?action=analyze`。
- `/api/train` 的分析 prompt 会把上一张思维升级卡作为迁移目标，要求 AI 在 `thinking_upgrade.migration_check` 中判断用户是否迁移成功，并引用用户原文说明证据或缺口。
- `normalizeTrainingEvaluation` 保留 `thinking_upgrade.migration_check`；`TrainingEvaluationPanel` 在思维升级卡中展示“迁移验证”。
- 迁移验证随既有 `training_records.ai_feedback` 落库，不新增 schema。

### 验证记录
- TDD 红灯：`node --test src/app/api/train/route.test.mjs` 先失败于缺少 `migrationTarget/migration_check`。
- TDD 红灯：`node --test src/lib/training/personalization.test.mjs` 先失败于 `migration_check` 未归一化。
- TDD 红灯：`node --test src/components/training/TrainingSessionClient.test.mjs` 先失败于未传 `migrationTarget` 且反馈面板缺“迁移验证”。
- GREEN：上述三个测试通过，`npx tsc --noEmit` 通过。
- 后续完整验证见本轮提交说明。

## [2026-07-08] 训练实战页：思维升级迁移目标前置

### 完成内容
- `/api/training/sessions?date=...` 读取最近 `growth_snapshots.dimension_scores.__trigger.thinkingUpgrade`，通过 `buildThinkingAssets` 派生 `latestThinkingUpgrade` 返回训练实战页。
- 高级产品思维主线进入 `/training/session` 时，作答前展示“本题迁移目标”，直接呈现上一张思维升级卡的判断、取舍、归因和落地要求。
- 新生成题目和草稿保存都会把 `migrationTarget` 写入当天 `training_sessions.questions`，刷新后仍能读回迁移上下文；不新增 schema。

### 验证记录
- TDD 红灯：`node --test src/app/api/training/sessions/route.test.mjs` 先失败于缺少 `buildThinkingAssets/latestThinkingUpgrade`。
- TDD 红灯：`node --test src/components/training/TrainingSessionClient.test.mjs` 先失败于缺少 `latestThinkingUpgrade/migrationTarget/本题迁移目标`。
- GREEN：上述两个测试通过，`npx tsc --noEmit` 通过。
- 后续完整验证见本轮提交说明。

## [2026-07-08] 推荐处方：思维升级资产反哺下一题

### 完成内容
- `buildRecommendationPlan` 读取最近 `thinkingAssets`，把已入账思维升级卡转成训练处方，而不是继续只按最弱维度泛化推荐。
- 训练处方会引用上一张思维升级卡的判断、取舍、归因和落地摘要，入口指向 `/training/session?focus=thinking_training`，引导用户把升级点迁移到下一题。
- 复盘处方会指回原训练复盘页，方便先回看升级卡的落地要求再继续练。
- `GET /api/profile/recommendation` 继续从 `growth_snapshots.dimension_scores` 读回画像证据，并额外返回 `thinkingAssets/latestThinkingUpgrade`，供前端调试和后续展示使用；不新增 schema。

### 验证记录
- TDD 红灯：新增推荐引擎测试先失败于训练处方仍是 `train-strategic_thinking`；新增 API 源测试先失败于缺少 `thinkingAssets/latestThinkingUpgrade`。
- 已通过：`node --test src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.test.mjs src/components/training/TrainingOverviewClient.test.mjs feature_list.test.mjs`（13 项）。
- 已通过：`npx tsc --noEmit`。
- 后续完整验证见本轮提交说明。

## [2026-07-08] 思维升级卡：入账画像账本

### 完成内容
- `/api/profile/summary` 新增 `trigger=thinking_upgrade_saved`，把 `thinkingUpgrade` 的判断质量、取舍质量、归因深度和落地严谨度写入 `growth_snapshots.dimension_scores.__trigger`，不新增 schema。
- `/training/history/[id]` 的“思维升级卡”新增“沉淀思维升级”动作，保存后必须读回 snapshot id 才显示“思维升级已入账”。
- `buildGrowthProfile` 新增 `thinkingAssets`，从已保存快照读回训练记录、维度和四类升级摘要。
- Dashboard 能力证据账本新增“已入账思维升级”，展示最新思维升级卡并链接回对应训练复盘页。

### 验证记录
- TDD 红灯：新增 profile summary、历史复盘页、growth profile 和 Dashboard 源测试，先失败于缺少 `thinking_upgrade_saved`、`handleSaveThinkingUpgrade`、`thinkingAssets` 和“已入账思维升级”展示。
- 已通过：`node --test src/app/api/profile/summary/route.test.mjs src/lib/profile/growth-profile.test.mjs 'src/app/(app)/dashboard/page.test.mjs' && node 'src/app/(app)/training/history/[id]/page.test.mjs'`（26 项）。
- 后续已运行完整验证，结果记录在本轮提交说明中。

## [2026-07-08] 历史复盘：读回主线资产

### 完成内容
- `buildInterviewExpressionCard` 优先使用已落库的 `ai_feedback.interview_expression` 派生表达卡，避免新训练反馈资产在历史页退回通用拼接。
- `/training/history/[id]` 新增“主线资产复盘”，直接读回并展示 `interview_expression` 和 `thinking_upgrade`。
- 面试主线资产展示开场判断、可复述版本、证据抓手和追问风险；思维训练资产展示判断质量、取舍质量、归因深度和落地严谨度。
- 该改造复用既有 `training_records.ai_feedback` 和历史记录 API，不新增 schema。

### 验证记录
- TDD 红灯：`node --test src/lib/training/interview-expression-card.test.mjs` 先失败于 `interview_expression` 没有被识别为“面试可用”；历史页新增源测试覆盖 `interviewExpressionAsset`、`thinkingUpgradeAsset` 和“主线资产复盘”文案。
- 已通过：`node --test src/lib/training/interview-expression-card.test.mjs && node 'src/app/(app)/training/history/[id]/page.test.mjs'`（8 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/training/history/[id]/page.tsx' 'src/app/(app)/training/history/[id]/page.test.mjs' src/lib/training/interview-expression-card.ts src/lib/training/interview-expression-card.test.mjs --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`。
- 已通过：`git diff --check`、`feature_list.json` JSON 解析。
- 已通过：`./init.sh`（10/10）。

## [2026-07-08] 训练反馈：按当前主线产出资产

### 完成内容
- `/training/session` 提交答案分析时把 `effectiveProfileFocus` 传给 `/api/train?action=analyze`。
- `/api/train` 的分析 prompt 按主线改写反馈目标：面试跳槽主线产出 `interview_expression`，高级产品思维主线产出 `thinking_upgrade`。
- `normalizeTrainingEvaluation` 支持读回面试表达资产和思维升级卡；这些结构化字段随 `training_records.ai_feedback` 保存。
- 训练反馈面板新增“面试表达资产”和“思维升级卡”，让用户当场看到开场判断、证据抓手、追问风险，以及判断/取舍/归因/落地四类升级建议。
- 该改造复用既有 `/api/train`、`training_records.ai_feedback` 和训练记录保存流程，不新增 schema。

### 验证记录
- TDD 红灯：`node --test src/app/api/train/route.test.mjs src/lib/training/personalization.test.mjs src/components/training/TrainingSessionClient.test.mjs` 先失败于缺少目标主线分析 prompt、`interview_expression`/`thinking_upgrade` 归一化和训练页 `profileFocus` 传参。
- 已通过：`node --test src/app/api/train/route.test.mjs src/lib/training/personalization.test.mjs src/components/training/TrainingSessionClient.test.mjs feature_list.test.mjs`（23 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/app/api/train/route.test.mjs src/lib/training/personalization.ts src/lib/training/personalization.test.mjs src/components/training/TrainingEvaluationPanel.tsx src/components/training/TrainingSessionClient.tsx src/components/training/TrainingSessionClient.test.mjs feature_list.test.mjs --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`。
- 已通过：`git diff --check`、`feature_list.json` JSON 解析。
- 已通过：`./init.sh`（10/10）。

## [2026-07-08] 训练实战页：直接继承当前主线

### 完成内容
- `GET /api/training/sessions?date=...` 读回最近 `growth_snapshots.dimension_scores.__goalFocus` 并返回 `latestGoalFocus`。
- `/training/session` 在 URL 没有 `focus` 时，会使用 `latestGoalFocus` 作为 `effectiveProfileFocus`，即时重排当前 mission plan，不等下一轮 state 再生效。
- 训练实战页顶部新增主线框架：面试跳槽显示“面试冲刺训练”，强调沉淀面试表达资产；高级产品思维显示“思维升阶训练”，强调判断、取舍、归因和落地推演。
- 该改造复用既有 `growth_snapshots` 与 `training_sessions.questions.profileFocus`，不新增 schema。

### 验证记录
- TDD 红灯：`node --test src/app/api/training/sessions/route.test.mjs src/components/training/TrainingSessionClient.test.mjs` 先失败于缺少 `latestGoalFocus`、`effectiveProfileFocus`、`setPersistedGoalFocus` 和主线文案。
- 已通过：`node --test src/app/api/training/sessions/route.test.mjs src/components/training/TrainingSessionClient.test.mjs feature_list.test.mjs`（7 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/training/sessions/route.ts src/app/api/training/sessions/route.test.mjs src/components/training/TrainingSessionClient.tsx src/components/training/TrainingSessionClient.test.mjs feature_list.test.mjs --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`。
- 已通过：`git diff --check`、`feature_list.json` JSON 解析。
- 已通过：`./init.sh`（10/10）。

## [2026-07-08] 训练首页：当前主线目标跟随

### 完成内容
- `GET /api/profile/recommendation` 从最近 `growth_snapshots.dimension_scores.__goalFocus` 读回 `latestGoalFocus`，复用 Dashboard 已落库的当前主线，不新增 schema。
- 训练首页读取 `latestGoalFocus` 后调整首屏主行动：面试跳槽主线强调把训练产出转成“面试表达资产”，高级产品思维主线强调判断、取舍、归因和落地推演。
- 训练入口仍然优先使用画像处方的 `href`，但按钮和说明会随用户选择的结果路径变化，避免训练页又退回泛泛刷题入口。

### 验证记录
- TDD 红灯：`node --test src/app/api/profile/recommendation/route.test.mjs src/components/training/TrainingOverviewClient.test.mjs` 先失败于缺少 `latestGoalFocus`、`__goalFocus`、`goalFocusFrame` 和主线文案。
- 已通过：`node --test src/app/api/profile/recommendation/route.test.mjs src/components/training/TrainingOverviewClient.test.mjs feature_list.test.mjs`（9 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/profile/recommendation/route.ts src/app/api/profile/recommendation/route.test.mjs src/components/training/TrainingOverviewClient.tsx src/components/training/TrainingOverviewClient.test.mjs feature_list.test.mjs --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`。
- 已通过：`git diff --check`、`feature_list.json` JSON 解析。

## [2026-07-08] Dashboard：当前主线目标

### 完成内容
- Dashboard 首屏新增“当前主线”，用户可把“面试跳槽冲刺”或“高级产品思维训练”设为主线。
- `POST /api/profile/summary` 支持 `goal_focus_selected`，把主线写入 `growth_snapshots.dimension_scores.__goalFocus`，复用既有成长快照，不新增 schema。
- `/api/dashboard` 读回最近 `__goalFocus` 并传入 `buildCommandCenter`；命令中心会按主线重排路径顺序、主行动和下一题处方说明。
- 保存主线后前端重新拉取 `/api/dashboard`，确保页面展示的是后端读回后的真实调度结果。

### 验证记录
- TDD 红灯：`node --test src/lib/dashboard/training-command-center.test.mjs src/app/api/dashboard/route.test.mjs src/app/api/profile/summary/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 先失败于缺少 `goalFocus`、`__goalFocus`、`latestGoalFocus`、`goal_focus_selected` 和页面“当前主线”入口。
- 已通过：`node --test src/lib/dashboard/training-command-center.test.mjs src/app/api/dashboard/route.test.mjs src/app/api/profile/summary/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs'`（24 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/dashboard/training-command-center.ts src/lib/dashboard/training-command-center.test.mjs src/app/api/dashboard/route.ts src/app/api/dashboard/route.test.mjs src/app/api/profile/summary/route.ts src/app/api/profile/summary/route.test.mjs 'src/app/(app)/dashboard/page.tsx' 'src/app/(app)/dashboard/page.test.mjs' --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`、`git diff --check`。

## [2026-07-08] Dashboard：本周处方读回

### 完成内容
- `/api/dashboard` 从最近 `growth_snapshots.dimension_scores.__recommendation` 读回 `latestRecommendation`，与 `recommendationPlan` 一起返回。
- Dashboard 首次加载后用 `latestRecommendation.id` 恢复已选推荐高亮，刷新后不再丢失“已设为处方”状态。
- “训练处方”区新增“本周处方”读回提示和继续执行入口；用户重新选择处方后，会用 POST 返回的 `selectedRecommendation` 立即更新页面状态。

### 验证记录
- TDD 红灯：`node --test src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 先失败于缺少 `latestRecommendation` 和“本周处方”读回。
- 已通过：`node --test src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/app/api/profile/recommendation/route.test.mjs src/lib/profile/recommendation.test.mjs feature_list.test.mjs`（13 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/dashboard/route.ts src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.tsx' 'src/app/(app)/dashboard/page.test.mjs' src/app/api/profile/recommendation/route.test.mjs src/lib/profile/recommendation.ts src/lib/profile/recommendation.test.mjs feature_list.test.mjs --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`。
- 已通过：`git diff --check`、`feature_list.json` JSON 解析、`./init.sh`（10/10）。

## [2026-07-08] 项目故事库：接入日常训练表达资产

### 完成内容
- 抽出 `src/lib/training/interview-expression-card.ts`，历史复盘页和故事库共用同一套面试表达卡派生逻辑。
- `/api/bootcamp/story-bank` 读取最近 `training_records`，传入 `buildStoryBank` 生成 `trainingExpressionAssets`。
- `/bootcamp/story-bank` 侧栏新增“日常训练表达资产”，展示训练回答的面试可用状态、开场判断和训练复盘入口，让日常训练回答进入跳槽资产链。

### 验证记录
- TDD 红灯：`node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs'` 先失败于缺少 `trainingExpressionAssets`、`training_records` 读取和页面区块。
- 已通过：`node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs'`（11 项）。

## [2026-07-08] Dashboard：今日行动档案

### 完成内容
- `buildCommandCenter` 新增 `actionDossier`，从最近训练记录派生“面试可用 / 待修正后可用”资产、待修正入口和下一题处方。
- Dashboard 双路径首屏下方新增“今日行动档案”，直接展示最新面试资产、待修正材料和下一题处方，避免表达资产只藏在训练详情页。
- 该改造复用已有 `training_records.ai_feedback.__revision` 与训练历史页，不新增 schema。

### 验证记录
- TDD 红灯：`node --test src/lib/dashboard/training-command-center.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 先失败于缺少 `actionDossier` 和首页“今日行动档案”。
- 已通过：`node --test src/lib/dashboard/training-command-center.test.mjs 'src/app/(app)/dashboard/page.test.mjs'`（9 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' 'src/app/(app)/dashboard/page.test.mjs' src/lib/dashboard/training-command-center.ts src/lib/dashboard/training-command-center.test.mjs --max-warnings 0`（仅 ESLint 9 配置弃用提示）。

## [2026-07-08] 面试表达卡：沉淀到画像账本

### 完成内容
- `POST /api/profile/summary` 支持 `expression_card_saved` 触发来源，会把训练记录 ID、维度、表达卡 readiness、开场判断、证据抓手和追问风险写入 `growth_snapshots.dimension_scores.__trigger.expressionCard`。
- 历史复盘页的“面试表达卡”新增“沉淀到画像账本”动作，调用画像快照接口并要求读回 `snapshot.id` 后才显示“表达卡已入账”。
- 该动作复用既有 `growth_snapshots`，不新增 schema，让面试表达资产进入画像证据账本和后续推荐闭环。

### 验证记录
- TDD 红灯：`node --test src/app/api/profile/summary/route.test.mjs && node 'src/app/(app)/training/history/[id]/page.test.mjs'` 先失败于缺少 `expression_card_saved`、`expressionCard`、`handleSaveExpressionCard` 和“沉淀到画像账本”。
- 已通过：`node --test src/app/api/profile/summary/route.test.mjs && node 'src/app/(app)/training/history/[id]/page.test.mjs'`（10 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/profile/summary/route.ts src/app/api/profile/summary/route.test.mjs 'src/app/(app)/training/history/[id]/page.tsx' 'src/app/(app)/training/history/[id]/page.test.mjs' --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`、`git diff --check`、`feature_list.json` JSON 解析。

## [2026-07-08] 历史复盘：面试表达卡

### 完成内容
- `/api/training/history/[id]` 在从 Supabase 读回 `training_records` 后，基于原回答、AI 反馈和 `ai_feedback.__revision` 派生 `interviewExpressionCard`。
- 历史复盘页新增“面试表达卡”，展示开场判断、证据抓手、追问风险和可复制表达版本。
- 面试表达卡优先使用二次修正内容；没有修正版时标记“待二次修正”，把用户拉回复盘动作，而不是直接把弱材料当成可用资产。

### 验证记录
- TDD 红灯：`node 'src/app/api/training/history/[id]/route.test.mjs' && node 'src/app/(app)/training/history/[id]/page.test.mjs'` 先失败于缺少 `interviewExpressionCard`、`面试表达卡`、`开场判断`、`追问风险` 和 `copyScript`。
- 已通过：`node 'src/app/api/training/history/[id]/route.test.mjs' && node 'src/app/(app)/training/history/[id]/page.test.mjs'`（5 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/api/training/history/[id]/route.ts' 'src/app/api/training/history/[id]/route.test.mjs' 'src/app/(app)/training/history/[id]/page.tsx' 'src/app/(app)/training/history/[id]/page.test.mjs' --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`、`git diff --check`、`feature_list.json` JSON 解析。

## [2026-07-08] 训练首页：能力证据资产

### 完成内容
- `/api/training/stats` 新增 `evidenceAssets`，从最近 `training_records` 读回题目、得分、AI 反馈和 `ai_feedback.__revision`，加工成可展示的能力证据资产。
- 训练首页新增“能力证据资产”区块，把记录标记为“面试可用 / 待修正后可用”，并根据状态跳转到历史复盘或二次修正入口。
- 入口文案把日常训练、二次修正和项目故事库连起来，弱化“刷题归档”，强化“训练回答 → 可讲述材料 → 面试资产”。

### 验证记录
- TDD 红灯：`node --test src/app/api/training/stats/route.test.mjs src/components/training/TrainingOverviewClient.test.mjs` 先失败于缺少 `evidenceAssets`、`buildEvidenceAssets`、`能力证据资产`、`proofPoint` 和“待修正后可用”。
- 已通过：`node --test src/app/api/training/stats/route.test.mjs src/components/training/TrainingOverviewClient.test.mjs`（5 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/training/stats/route.ts src/app/api/training/stats/route.test.mjs src/components/training/TrainingOverviewClient.tsx src/components/training/TrainingOverviewClient.test.mjs --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`、`git diff --check`、`feature_list.json` JSON 解析。

## [2026-07-07] 训练首页：画像处方驱动主入口

### 完成内容
- 训练首页加载 `/api/profile/recommendation`，读取 `recommendationPlan` 中的训练处方作为首屏主行动。
- 首屏文案从本地统计弱项升级为“画像处方”，展示处方标题、推荐理由和证据来源。
- “开始训练”按钮优先跳转画像处方的 `href`，例如 `/training/session?focus=...`，让二次修正入账后的推荐能直接影响下一题。
- 保留原本基于训练统计的推荐作为兜底，推荐接口失败时仍可开始今日训练。

### 验证记录
- TDD 红灯：`node --test src/components/training/TrainingOverviewClient.test.mjs` 先失败于缺少 `/api/profile/recommendation`、`recommendationPlan`、`primaryRecommendation`、`画像处方` 和处方 href。
- 已通过：`node --test src/components/training/TrainingOverviewClient.test.mjs`（2 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingOverviewClient.tsx src/components/training/TrainingOverviewClient.test.mjs --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`、`git diff --check`、`feature_list.json` JSON 解析。

## [2026-07-07] 二次修正：同步进入画像证据账本

### 完成内容
- `POST /api/profile/summary` 支持 `revision_saved` 触发来源，会把训练记录 ID、维度和修正答案摘要写入 `growth_snapshots.dimension_scores.__trigger`。
- 训练反馈页保存二次修正后，会继续调用画像快照接口；保存成功时提示“二次修正已进入能力证据账本”。
- 历史复盘页从复盘队列保存二次修正后，也会创建画像快照，保证“反馈 → 修正 → 画像 → 推荐”闭环不只发生在首次提交时。
- 产品设计文档补充二次修正进入画像账本的数据流。

### 验证记录
- TDD 红灯：`node --test src/app/api/profile/summary/route.test.mjs src/lib/training/session-progress.test.mjs && node 'src/app/(app)/training/history/[id]/page.test.mjs'` 先失败于缺少 `revision_saved`、`/api/profile/summary` 和“二次修正已进入能力证据账本”。
- 已通过：`node --test src/app/api/profile/summary/route.test.mjs src/lib/training/session-progress.test.mjs && node 'src/app/(app)/training/history/[id]/page.test.mjs'`（19 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/profile/summary/route.ts src/app/api/profile/summary/route.test.mjs src/components/training/TrainingSessionClient.tsx src/lib/training/session-progress.test.mjs 'src/app/(app)/training/history/[id]/page.tsx' 'src/app/(app)/training/history/[id]/page.test.mjs' --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`、`git diff --check`、`feature_list.json` JSON 解析。

## [2026-07-07] 复盘归档：队列直达二次修正

### 完成内容
- 训练首页复盘队列对“待二次修正”记录追加 `?revise=1`，点击后直接进入复盘页的修正工作区，而不是只停留在只读归档。
- 历史复盘页新增可编辑的“二次修正”工作区：从已保存修正版预填，支持聚焦、保存中、已保存、保存失败状态。
- 保存继续复用 `PATCH /api/training/record`，写入并读回 `training_records.ai_feedback.__revision`，不新增 schema。

### 验证记录
- TDD 红灯：`node --test src/components/training/TrainingOverviewClient.test.mjs 'src/app/(app)/training/history/[id]/page.test.mjs'` 先失败于缺少 `revise=1` 直达入口；`node 'src/app/(app)/training/history/[id]/page.test.mjs'` 先失败于缺少 `useSearchParams`、`revisionText`、`handleSaveRevision` 和 `PATCH` 保存入口。
- 已通过：`node 'src/app/(app)/training/history/[id]/page.test.mjs' && node --test src/components/training/TrainingOverviewClient.test.mjs src/app/api/training/record/route.test.mjs src/app/api/training/stats/route.test.mjs src/lib/training/session-progress.test.mjs feature_list.test.mjs`（18 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingOverviewClient.tsx 'src/app/(app)/training/history/[id]/page.tsx' --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`、`git diff --check`、`feature_list.json` JSON 解析。

## [2026-07-07] 训练首页：复盘队列

### 完成内容
- `/api/training/stats` 从最近训练记录生成 `reviewQueue`，按是否缺少 `ai_feedback.__revision` 排序，优先暴露待二次修正的记录。
- 训练首页新增“复盘队列”区块，把最近回答分成“待二次修正 / 修正版已沉淀”，直接跳转到对应复盘页继续修正。
- 首页文案从“多刷题”改为“把反馈转成下一版表达”，让训练入口更贴近高级 PM 思维训练闭环。

### 验证记录
- TDD 红灯：`node --test src/app/api/training/stats/route.test.mjs src/components/training/TrainingOverviewClient.test.mjs` 先失败于缺少 `reviewQueue`、`needsRevision`、`待二次修正` 和 `继续修正`。
- 已通过：`node --test src/app/api/training/stats/route.test.mjs src/components/training/TrainingOverviewClient.test.mjs src/app/api/training/record/route.test.mjs src/lib/training/session-progress.test.mjs feature_list.test.mjs`（16 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/training/stats/route.ts src/app/api/training/stats/route.test.mjs src/components/training/TrainingOverviewClient.tsx src/components/training/TrainingOverviewClient.test.mjs --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`、`git diff --check`、`feature_list.json` JSON 解析、`./init.sh`（10/10）。

## [2026-07-07] 复盘归档：读回二次修正版

### 完成内容
- 历史复盘页读取 `training_records.ai_feedback.__revision`，在原回答下方展示“二次修正 / 修正版”。
- 修正版展示保存时间，帮助用户区分首次作答、AI 反馈和反馈后的二次表达。
- 复用既有 `/api/training/history/[id]` 读记录接口，不新增 schema 或 API。

### 验证记录
- TDD 红灯：`node 'src/app/(app)/training/history/[id]/page.test.mjs'` 先失败于缺少 `__revision`、`二次修正`、`修正版` 和 `revisedAnswer`。
- 已通过：`node 'src/app/(app)/training/history/[id]/page.test.mjs'`。
- 已通过：`node --test src/app/api/training/record/route.test.mjs src/lib/training/session-progress.test.mjs feature_list.test.mjs`（14 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/training/history/[id]/page.tsx' 'src/app/(app)/training/history/[id]/page.test.mjs' --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`。
- 已通过：`git diff --check`、`feature_list.json` JSON 解析、`./init.sh`（10/10）。

## [2026-07-07] 训练反馈页：二次修正落库

### 完成内容
- 反馈页新增“二次修正”输入区，用户可在看完 AI 反馈后当场重写关键答案。
- 新增 `PATCH /api/training/record`，按当前用户校验记录归属后，把修正内容写入 `training_records.ai_feedback.__revision`，不新增 schema。
- 前端保存状态覆盖待修正、保存中、已保存、保存失败；保存成功后显示最近保存时间。

### 验证记录
- TDD 红灯：`node --test src/app/api/training/record/route.test.mjs src/lib/training/session-progress.test.mjs` 先失败于缺少 `PATCH`、`二次修正` 和 `handleSaveRevision`。
- 已通过：`node --test src/app/api/training/record/route.test.mjs src/lib/training/session-progress.test.mjs feature_list.test.mjs`（14 项）。
- 已通过：`git diff --check`。
- 已通过：`./init.sh`（Node/npm/依赖/TypeScript/ESLint/环境变量/Next.js 构建，10/10）。

## [2026-07-07] 训练作答工作台：草稿恢复 + 作答质检

### 完成内容
- 训练作答输入会自动保存到当天 `training_sessions.questions[missionId].draftAnswer`，复用既有训练会话 JSON，不新增 schema。
- 重新进入当天训练时，从 `/api/training/sessions` 读回题目缓存并恢复草稿答案，减少刷新或误退出导致的训练中断。
- 提交前新增“作答质检”，实时检查回答是否覆盖判断、依据、取舍、验证四个高级 PM 表达要素；该检查只提示不拦截，保留低门槛训练体验。

### 验证记录
- TDD 红灯：`node --test src/app/api/training/questions/route.test.mjs src/lib/training/session-progress.test.mjs` 先失败于缺少 `draftAnswer`、`作答质检`、`自动保存`。
- 已通过：`node --test src/app/api/training/questions/route.test.mjs src/lib/training/session-progress.test.mjs feature_list.test.mjs`（15 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/app/api/training/questions/route.ts src/app/api/training/questions/route.test.mjs src/lib/training/session-progress.test.mjs --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`、`git diff --check`、`feature_list.json` JSON 解析、`./init.sh`（10/10）。

## [2026-07-07] 训练反馈页闭环：下一轮处方

### 完成内容
- 在训练反馈页补上“下一轮处方”：训练记录保存并写入画像快照后，前端立即读取 `/api/profile/recommendation`，展示基于最新证据生成的下一步训练建议。
- 在反馈页新增“设为本周处方”动作，复用既有 `POST /api/profile/recommendation` 写入 `growth_snapshots.dimension_scores.__recommendation`，不新增 schema。
- 保留画像同步状态：画像保存成功与下一轮处方生成失败互不覆盖，避免因为推荐接口失败误判训练记录或画像快照失败。

### 验证记录
- TDD 红灯：`node --test src/lib/training/session-progress.test.mjs` 先失败于 `handleSelectNextPrescription should exist`。
- 已通过：`node --test src/lib/training/session-progress.test.mjs src/app/api/profile/recommendation/route.test.mjs src/app/api/profile/summary/route.test.mjs feature_list.test.mjs`（16 项）。
- 已通过：`npx tsc --noEmit`。
- 已通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/lib/training/session-progress.test.mjs src/app/api/profile/recommendation/route.ts src/app/api/profile/summary/route.ts --max-warnings 0`（仅 ESLint 9 配置弃用提示）。
- 已通过：`npm run build`、`git diff --check`、`feature_list.json` JSON 解析。
- 已通过：`./init.sh`（10/10）。

## 当前状态 / Current State

**Last Updated:** 2026-05-28
**会话 ID：** fullstack-build-001
**Current Objective:** 全栈编码 — 从原型到可运行产品
**进度摘要：** 完成了项目脚手架搭建、Supabase 集成、AI SDK 集成、认证流程、诊断模块（量表+访谈+案例+报告）、训练模块（首页+答题+AI分析）、设置页、前后端数据持久化打通、案例库独立页面。

---

## 功能进度

### 已完成 / What's Done（本会话）

- [x] **项目脚手架（infra-001）** — Next.js App Router + Tailwind CSS + TypeScript + shadcn/ui
- [x] **Supabase 集成（infra-002）** — 账密登录、7 张数据表（profiles/diagnosis_reports/dimension_scores/growth_snapshots/training_records/user_settings/chat_history）
- [x] **AI SDK 集成（infra-003）** — DeepSeek V4 Flash 接入、流式对话、思考模式（reasoning_effort: max）
- [x] **Prompt 管理（infra-004 部分）** — 提示词策略文档编写、训练出题官/评卷官/诊断师 prompt 实装
- [x] **AI 模型配置模块（infra-005）** — 设置页（API Key/模型选择/深度思考开关）
- [x] **全局 UI 与导航（ux-001）** — 布局框架、侧边栏导航、认证流程、12 个页面路由
- [x] **AI 设置页（ux-002）** — 完整设置页面
- [x] **诊断阶段一（diag-001）** — 25 题能力量表、维度评分、提交落库
- [x] **诊断阶段二（diag-002）** — AI 深度访谈、对话保存
- [x] **诊断阶段三（diag-003）** — 案例实战 + 综合诊断报告
- [x] **日常训练（training-001）** — 训练首页（看板）+ 答题页（AI 出题 + 分析 + 记录）
- [x] **案例库独立页面（comet: case-library-dedicated-page）** — 产品分析从抽屉改为独立页面 `/training/cases/[product]`，视角切换 tabs，列表页简化（2026-05-28 归档完成）

### 待开始 / What's Next

- [ ] **工作台仪表盘（dashboard）** — 展示画像、训练统计、诊断报告摘要
- [ ] **用户画像引擎（profile-001/002）** — 画像数据模型已就绪，需接入工作台
- [ ] **日常训练·案例库内容（training-002 部分）** — 经典 B 端产品拆解（AI 动态生成）、决策推演案例生成
- [ ] **特训冲刺（bootcamp-001/002/003）** — 简历解析 + AI 模拟面试 + 面试报告

---

## 阻塞项 / Blockers & Risks

- [ ] 诊断阶段一的 25 题目前是硬编码，后续需改为 AI 动态生成
- [ ] 训练首页的统计数据尚未从 API 读取（目前硬编码）

---

## 决策记录

| # | 决策 | 背景 | 日期 |
|---|------|------|------|
| 1 | 采用 AGENTS.md 框架管理 AI agent 工作流 | 确保多会话间上下文连续 | 2026-05-19 |
| 2 | **DeepSeek V4 Flash 默认模型** | 质量优先 | 2026-05-23 |
| 3 | **深度思考默认开启（reasoning_effort: max）** | 诊断质量核心保障 | 2026-05-23 |
| 4 | **桌面优先** | 个人工具 | 2026-05-23 |
| 5 | **每做一题就记录，不搞 batch** | 防丢数据，实时更新统计 | 2026-05-23 |
| 6 | **案例库用独立页面替代抽屉** | 提升阅读体验，导航更清晰 | 2026-05-27 |

---

## 会话期间修改的文件 / Files Modified

| 文件 | 说明 |
|------|------|
| `src/app/*` | 全部页面路由 |
| `src/app/api/*` | 全部 API 路由 |
| `src/lib/ai.ts` | AI 模型配置 + 思考模式注入 |
| `src/lib/supabase.ts` | Supabase 客户端 |
| `src/lib/supabase-server.ts` | 服务端 Supabase 客户端 |
| `src/contexts/AuthContext.tsx` | 认证上下文 |
| `src/components/Sidebar.tsx` | 侧边栏导航 |
| `supabase/schema.sql` | 数据库 schema |
| `AGENTS.md` | 工作指南 |
| `feature_list.json` | 功能状态追踪 |
| `progress.md` | 进度日志 — 本文件 |

---

## 完成证据 / Verification Evidence

- [x] `npx tsc --noEmit` 通过
- [x] `npx next build` 通过（13+ 个页面 + API 路由）
- [x] DeepSeek 流式对话测试通过
- [x] API 路由 POST/GET 全部返回 200
- [x] Comet change `case-library-dedicated-page` 验证通过并归档（2026-05-28）

---

## 下个会话记录 / Recommended Next Step

1. 工作台仪表盘 — 读取 training_stats + 诊断报告展示
2. 用户画像引擎 — 画像卡片展示 + 成长曲线
3. 训练首页统计数据从 API 读取（替代硬编码）

---

## 2026-05-29 热修复会话

### 修复的 Bug

- [x] **Bug 1：题目前缀 regex** — 两步清理代替单 regex，处理 `**题目：**` 边缘情况
- [x] **Bug 2：切换视角重复请求** — 移除 `switchPerspective` 中的直接 `loadArticle()` 调用
- [x] **Bug 3：product_name 大小写** — API 入口 `toLowerCase()` 归一化
- [x] **Bug 4：连击天数显示错误（一直显示12天）** — API 端 streak 改用 `Asia/Shanghai` 本地日期；移除前端死代码

### 相关文件

| 文件 | 改动 |
|------|------|
| `src/app/(app)/training/session/page.tsx` | regex 修复 |
| `src/app/(app)/training/cases/[product]/page.tsx` | 移除重复请求 |
| `src/app/api/cases/route.ts` | 大小写归一化 |
| `src/app/api/training/stats/route.ts` | streak 时区修复 |
| `src/app/api/training/sessions/route.ts` | session 日期时区修复 |
| `src/app/api/dashboard/route.ts` | streak 时区修复 |
| `src/app/(app)/training/page.tsx` | 移除 dead code |

### Comet 状态

- Change: `0529-training-ui-bugs` — 已验证归档（6/6 steps succeeded）
- 分支 `0529-training-ui-bugs` 已合并到 master

## [2026-05-29] RLS 修复 - case_articles 删除权限

### 完成内容
- 修复了 case_articles 表缺少 DELETE 和 UPDATE RLS 策略的问题
- 通过 Kimi WebBridge 在 Supabase SQL Editor 中运行了正确的 SQL（去掉了 `if not exists` 语法）
- 删除了 `src/app/api/admin/` 目录（未使用的管理路由）
- 构建通过（`npm run build` 和 `npx tsc --noEmit` 均正常）

### 技术细节
- PostgreSQL 不支持 `CREATE POLICY if not exists`，改为 `drop policy if exists` + `create policy` 模式
- 策略允许所有认证用户（`auth.role() = 'authenticated'`）删除和更新 case_articles

## [2026-05-31] 训练营模块数据库 Schema

### 完成内容
- **新增三张训练营表**：
  - `bootcamp_sessions`：训练营会话状态（status, current_day, resume_text, parsed_profile, weakness_prediction）
  - `bootcamp_interviews`：每日面试题（day_number 1-3, question_index 1-5, question_type, difficulty, ai_evaluation, status）
  - `bootcamp_reports`：日报与综合报告（report_type, day_number, content, scores_snapshot）
- **RLS 策略**：
  - `bootcamp_sessions`：auth.uid() = user_id
  - `bootcamp_interviews` / `bootcamp_reports`：EXISTS 子查询关联 bootcamp_sessions.user_id
- **补充现有表缺失 RLS**：profiles INSERT/DELETE、dimension_scores UPDATE/DELETE、growth_snapshots UPDATE/DELETE、training_sessions DELETE、question_feedback DELETE

### 验证结果
- `./init.sh` ✅ 全部 9/9 通过
- Schema 语法已人工审查，风格与现有表一致

### 修改文件
- `supabase/schema.sql`

## [2026-05-30] Schema RLS 策略补全 + ESLint 配置 + 移除 console 语句

### 完成内容
- **补全 schema RLS 策略**：
  - `dimension_scores`：新增 UPDATE、DELETE（用户仅可操作自己的）
  - `training_sessions`：新增 DELETE
  - `question_feedback`：新增 DELETE
  - `growth_snapshots`：新增 UPDATE、DELETE
  - `profiles`：新增 INSERT、DELETE
  - `case_articles`：DELETE 策略添加注释说明（共享内容池，无 user_id 字段）
- **创建 ESLint 配置**：新增 `.eslintrc.json`（Next.js core-web-vitals + no-console 规则）
- **移除生产环境 console 语句**：
  - `src/lib/tavily.ts`：移除 3 处 console.warn，保持静默失败
  - `src/app/(app)/diagnosis/interview/page.tsx`：移除 console.error，改为界面错误提示
- **修复 ESLint warning**：
  - `src/app/(app)/training/cases/[product]/page.tsx`：补全 useCallback 依赖数组（添加 searchParams）
  - `init.sh`：设置 `ESLINT_USE_FLAT_CONFIG=false` 兼容 ESLint 9.x 传统配置格式

### 验证结果
- `npx tsc --noEmit` ✅ 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0` ✅ 通过
- `./init.sh` ✅ 全部 9/9 通过

### 修改文件
- `supabase/schema.sql`
- `.eslintrc.json`（新增）
- `init.sh`
- `src/lib/tavily.ts`
- `src/app/(app)/diagnosis/interview/page.tsx`
- `src/app/(app)/training/cases/[product]/page.tsx`
- `feature_list.json`
- `progress.md`

## [2026-06-03] 全局 UI 视觉优化

### 完成内容
- 使用 `design-taste-frontend` 做现有前端视觉审查，判定本项目应走 B 端产品工作台语言，而不是营销页或消费品牌风格。
- 将 `tailwind.config.ts` 的暖米色/烧橙/serif 方向调整回 `DESIGN.md` 约定的明亮灰白、深靛蓝、青色辅助与 Hanken Grotesk。
- 使用 `next/font` 加载 Hanken Grotesk 与 Geist Mono，移除布局里的 Google Fonts `<link>` 直连。
- 优化全局背景、selection、图表色、按钮对比度、主导航、认证页、工作台快捷入口、训练首页状态面板、诊断报告、案例实战、特训入口与若干基础组件圆角。
- 清理可见页面中的 em dash、装饰分隔点、emoji 装饰、手写 SVG 菜单图标等视觉噪音。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0` 通过
- `npx next build` 通过
- `./init.sh` 通过（9/9）
- 本地 dev server 使用 `http://localhost:3020/login` 检查，HTTP 200；Chrome 1440x900 截图确认登录首屏无明显错位，主按钮为白字深靛蓝

### 风险与备注
- 本轮开始前工作区已有大量未提交 UI 改动、OpenSpec 归档/删除和新增文件。本轮在既有脏工作区上继续优化，没有回滚用户或其他 agent 的改动。
- 未直接提交代码，避免把本轮前已经存在的未提交变更一并打包成不可审查的混合提交。

## [2026-06-03] 特训简历解析支持 .md 文件上传

### 完成内容
- 使用 `comet-tweak` 创建 change：`support-md-resume-upload`。
- 更新 `ResumeUploader`：文件上传模式支持 `.md` / `.markdown`，并更新前端校验、`accept` 属性和说明文案。
- 更新 `/api/bootcamp/resume`：后端按小写文件名识别 `.md` / `.markdown`，兼容 `.MD` 等大小写扩展名。
- 保留现有 PDF、Word 和粘贴 Markdown 文本路径，不改变 API 结构和数据库 schema。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/bootcamp/ResumeUploader.tsx src/app/api/bootcamp/resume/route.ts --max-warnings 0` 通过
- `./init.sh` 通过（9/9）
- 验证报告：`docs/superpowers/reports/2026-06-03-support-md-resume-upload-verify.md`

### 备注
- 工作区在本 tweak 开始前已有大量未提交 UI 改动。本次只归属 `.md/.markdown` 简历文件上传支持，不回滚既有改动。

## [2026-06-03] Hotfix: Markdown 简历上传后不进入下一步

### 完成内容
- 使用 `comet-hotfix` 创建 change：`fix-md-resume-next-step`。
- 修复文件上传模式没有明显反馈的问题：上传 Markdown/PDF/Word 后显示“正在解析简历...”，处理中禁用模式切换、文件选择和拖拽重复提交。
- 修复后端 AI JSON 解析脆弱的问题：`/api/bootcamp/resume` 增加 `parseJsonFromAiText`，兼容纯 JSON、```json 代码块和 JSON 前后附加说明文字。
- 收紧简历画像和弱点预测 prompt，要求只返回指定 JSON 结构。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/bootcamp/ResumeUploader.tsx src/app/api/bootcamp/resume/route.ts --max-warnings 0` 通过
- `git diff --check -- src/components/bootcamp/ResumeUploader.tsx src/app/api/bootcamp/resume/route.ts openspec/changes/fix-md-resume-next-step` 通过
- `./init.sh` 通过（9/9）
- 重启 dev server 后 `/bootcamp/resume` 返回 200；未登录状态按中间件回到 `/login`，无运行时错误覆盖层
- 验证报告：`docs/superpowers/reports/2026-06-03-fix-md-resume-next-step-verify.md`

### 备注
- 当前工作区在本 hotfix 前已有大量未提交 UI 改动、OpenSpec 归档/删除和新增文件。本次没有回滚既有改动，也没有提交混合变更。

## [2026-06-03] Hotfix follow-up: 特训 Supabase 落库与开始特训自测

### 完成内容
- 使用 `kimi-webbridge` 在真实浏览器登录态中打开 Supabase SQL Editor，给远端项目 `aczcnilrwvsstoluacln` 执行训练营三张表建表 SQL：
  - `bootcamp_sessions`
  - `bootcamp_interviews`
  - `bootcamp_reports`
- 修复 `there is no unique or exclusion constraint matching the ON CONFLICT specification`：
  - 远端 `bootcamp_sessions.user_id` 已添加唯一约束 `bootcamp_sessions_user_id_key`
  - 本地 `supabase/schema.sql` 和 migration 同步为 `user_id ... unique not null`
- 新增 migration：`supabase/migrations/20260603150226_bootcamp_sessions_tables.sql`
- 修复 `/bootcamp/resume` 刷新后不显示已解析结果的问题：页面加载时读取 `GET /api/bootcamp/resume`，有记录则显示解析结果和“开始特训”。
- 修复 `/api/bootcamp/interview`：
  - AI 题目 JSON 输出增加代码块/包装文本容错解析
  - 重复生成同一天题目改为 `upsert`
  - 只保留当天 1-5 题，并清理多余题目
  - AI 少返回题目时用兜底题补满 5 道

### 真实浏览器自测结果
- 使用 `/tmp/test-resume.md` 构造同源 `resume.md` 文件，调用 `POST /api/bootcamp/resume`：
  - `status=200`
  - 返回 `session / parsed_profile / weakness_prediction`
  - `session.status=in_progress`
  - `session.current_day=0`
- 调用 `GET /api/bootcamp/resume`：
  - `status=200`
  - 从数据库读回 `parsed_profile / weakness_prediction`
- 刷新 `/bootcamp/resume`：
  - 页面显示工作经历、项目经历、技能栈、面试弱点预测和“开始特训”按钮
- 调用 `POST /api/bootcamp/interview`：
  - `status=200`
  - 返回 5 道题
  - 题号 `[1,2,3,4,5]`
- 调用 `GET /api/bootcamp/interview?day=1`：
  - `status=200`
  - 数据库读回 5 道题
  - `current_day=1`

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/bootcamp/interview/route.ts 'src/app/(app)/bootcamp/resume/page.tsx' src/app/api/bootcamp/resume/route.ts src/components/bootcamp/ResumeUploader.tsx --max-warnings 0` 通过
- `git diff --check -- 'src/app/(app)/bootcamp/resume/page.tsx' supabase/schema.sql supabase/migrations/20260603150226_bootcamp_sessions_tables.sql` 通过

### 备注
- WebBridge 的文件上传原语对隐藏 file input 返回浏览器侧 `Not allowed`，因此页面级上传自测改用“同源浏览器上下文构造 `resume.md` + fetch 同一 API”的方式；这仍然覆盖认证 cookie、AI 解析、Supabase 落库和读回。
- 为避免 `./init.sh` 的 Next build 与 dev server 同时写 `.next`，完整验证前先暂停了 dev server。

## [2026-06-04] Hotfix: 特训简历清空、解析回看与题目质量

### 完成内容
- 新增 `DELETE /api/bootcamp/resume`：当前登录用户可清空训练营会话，依赖数据库外键 cascade 删除对应面试题与报告；删除后再次查询确认没有残留会话。
- `/bootcamp/resume` 在已解析状态下新增“清空并重新上传”，清空成功后回到上传/粘贴入口。
- `/bootcamp` 对 `in_progress` 会话改为同时提供“查看简历解析”和“继续特训”，避免进入 Day 1 后绕过解析结果。
- `/api/bootcamp/interview` 出题 prompt 改为真实高阶 PM 面试追问：围绕简历项目、公司、模块和指标追问决策取舍、指标归因、系统边界、协同冲突和复盘。
- 增加题目后处理过滤，剔除 “CEO 找第二增长曲线 / 12 或 18 个月战略路线图 / 泛 GTM ROI” 等假大空题，并用简历锚点兜底补满 5 题。
- `src/app/layout.tsx` 增加 `suppressHydrationWarning`，压制浏览器翻译扩展向 `<body>` 注入 class 导致的开发态 hydration mismatch 提示。

### 真实浏览器自测结果
- Kimi WebBridge 打开 `http://localhost:3000/bootcamp/resume`，确认当前残留的是测试简历“云启科技 / 客户健康度评分系统”。
- 使用当前残留简历生成 Day 1 题目，`POST /api/bootcamp/interview` 返回 200 和 5 道题；题目围绕客户健康度评分系统、权限与审批流重构、指标归因、客户认可和规模化资源取舍追问，没有出现第二增长曲线类泛题。
- 点击页面“清空并重新上传”后，`GET /api/bootcamp/resume` 返回 404 `{ error: "未找到特训记录" }`。
- `/bootcamp/resume` 页面回到“上传文件 / 粘贴文本”状态；`/bootcamp` 回到初始“开始特训”状态。
- 重启 dev server 后 `http://localhost:3000/bootcamp/resume` 可访问。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/layout.tsx src/app/api/bootcamp/resume/route.ts src/app/api/bootcamp/interview/route.ts 'src/app/(app)/bootcamp/resume/page.tsx' 'src/app/(app)/bootcamp/page.tsx' --max-warnings 0` 通过
- `git diff --check -- src/app/api/bootcamp/resume/route.ts src/app/api/bootcamp/interview/route.ts 'src/app/(app)/bootcamp/resume/page.tsx' 'src/app/(app)/bootcamp/page.tsx'` 通过
- `./init.sh` 通过（9/9）

### 备注
- 工作区在本 hotfix 前已有大量未提交 UI、OpenSpec 归档/删除和新增文件。本次没有回滚既有改动。
- 清空操作已在当前登录用户真实 Supabase 数据上验证，测试简历没有留在训练营会话中。

## [2026-06-04] Hotfix: 特训评分反馈空壳问题

### 完成内容
- 修复 `/api/bootcamp/interview/answer` 评分 prompt 过于宽泛的问题：现在要求 AI 返回严格 JSON，包含总体评价、四维分数、亮点、不足、改进建议、答题框架、示例回答、改写示范和下一题练习。
- 增加 AI JSON 容错解析，兼容代码块和前后说明文字；增加分数字段和列表字段归一化，避免再落库空壳评价。
- 评分 API 支持只传 `interview_id` 重新评分，会读取数据库中已有 `user_answer`，用于修复旧版已落库的空评价。
- `AnswerEvaluation` 组件升级为 AI 面试教练反馈卡：展示总评、分数、推荐答题框架、示例回答、把用户回答改成更面试化的版本、亮点/不足和下一题练习。
- 对旧版不完整评价显示“重新生成反馈”提示；完整评价也保留“重新生成反馈”入口，方便用户重新生成更好的教练反馈。
- 前端显示层清洗 AI 列表自带编号，避免出现 `1 1.` 的重复序号。

### 真实浏览器自测结果
- 打开 `http://localhost:3000/bootcamp/interview`，复现旧空评价：分数和正文均为空，只剩评分卡框架。
- 页面识别旧空评价并显示“这条反馈内容不完整 / 重新生成反馈”。
- 点击“重新生成反馈”后，`POST /api/bootcamp/interview/answer` 使用原回答重新评分并落库。
- 刷新后第一题显示完整反馈：综合评分、结构化/逻辑性/专业度/创新性分数、总体评价、答题框架、示例回答、改写示范、亮点、不足、下一轮建议和下一题练习。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/bootcamp/interview/answer/route.ts 'src/app/(app)/bootcamp/interview/page.tsx' src/components/bootcamp/AnswerEvaluation.tsx src/types/bootcamp.ts --max-warnings 0` 通过
- `./init.sh` 通过（9/9）

## [2026-06-04] Redesign: 特训面试页宽屏布局

### 完成内容
- 使用 `redesign-existing-projects` 审查当前特训页，定位主要问题为 `max-w-3xl` 单栏居中导致大屏只利用约 1/3 宽度。
- `/bootcamp/interview` 主内容从窄单栏改为最大 1480px 的双栏工作台布局：
  - 左侧栏：今日进度、题目、已评分后的原回答、上一题/下一题导航。
  - 右侧栏：已评分时展示完整 AI 面试教练反馈；未评分时展示“作答抓手”四块提示，避免右侧空白。
- 左侧在桌面端使用 sticky，长反馈滚动时题目和原回答仍然可见，方便对照复盘。
- `InterviewQuestion` 在已评分后保留“你的原回答”，便于用户把 AI 示例和自己的回答并排对照。

### 真实浏览器自测结果
- 打开 `http://localhost:3000/bootcamp/interview`，页面显示左右双栏。
- DOM 实测：1920px 视口下主容器宽度 1480px，左栏约 571px，右侧反馈约 821px。
- 快照确认左侧包含今日进度、题目、原回答、导航；右侧包含 AI 面试教练反馈、答题框架、示例回答、改写示范、亮点/不足和下一题练习。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/bootcamp/interview/page.tsx' src/components/bootcamp/InterviewQuestion.tsx --max-warnings 0` 通过
- `./init.sh` 通过（9/9）

## [2026-06-04] UI 修复: 诊断阶段二访谈底部与 AI 头像

### 完成内容
- `/diagnosis/interview` 底部输入区从窄 textarea + 被撑高按钮，改为 max-w-5xl 居中 composer。
- 发送按钮固定为 112x56，避免被 textarea 高度拉成大方块。
- 快捷键提示移到输入条下方，输入框 placeholder 简化为“分享你的判断、例子或追问”。
- 机器人头像从 lucide Bot 图标换为渐变背景的 “AI” 教练头像，附带小星标，减少廉价机器人感。

### 真实浏览器自测结果
- Kimi WebBridge 打开 `http://localhost:3000/diagnosis/interview`，页面显示新 AI 教练头像和新输入区。
- DOM 实测：composer 宽 1024px，textarea 约 882x72，发送按钮约 112x56。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/diagnosis/interview/page.tsx' --max-warnings 0` 通过
- `./init.sh` 通过（9/9）

## [2026-06-04] Redesign: 首页工作台高密度 cockpit

### 完成内容
- `/dashboard` 去掉大号 PageHeader 和顶部两张大 CTA 卡，改为紧凑顶部栏、今日重点、主/次行动按钮。
- 新增 KPI strip：今日训练、连续天数、累计完成、最近诊断，降低首屏垂直占用。
- 首页内容改为 12 栅格 cockpit：左侧紧凑能力画像，中间成长趋势 + 维度训练表现，右侧最近诊断 + 下一步建议。
- `ProfileCard` 去掉大雷达图，改为维度条、均分和优先补强项；`GrowthChart` 图表高度压缩到 170px；`TrainingStats` 从大统计卡改为维度表现；`LatestReport` 合并最近诊断和行动建议。
- 空状态同步压缩，不再使用 300px+ 的居中大空态。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' src/components/dashboard/*.tsx --max-warnings 0` 通过
- `git diff --check -- 'src/app/(app)/dashboard/page.tsx' src/components/dashboard/ProfileCard.tsx src/components/dashboard/GrowthChart.tsx src/components/dashboard/TrainingStats.tsx src/components/dashboard/LatestReport.tsx` 通过
- `./init.sh` 通过（9/9）

### 真实浏览器自测结果
- 3000 端口已有旧 dev server 但访问 `/dashboard` 长时间无响应；改用 `npm run dev -- -p 3002` 启动独立 dev server。
- Headless Chrome 无登录态会进入登录页，系统 Chrome 打开 `http://localhost:3002/dashboard` 使用当前浏览器会话进入工作台。
- 截图 `/tmp/dashboard-cockpit-final.png` 确认：紧凑顶部栏、4 个 KPI、能力画像、成长趋势、维度训练表现、最近诊断均在首屏可见；三栏已加 `items-start`，空状态不再被拉伸成整列大空白。

## [2026-06-05] 日常训练: 个性化出题与结构化教练反馈

### 完成内容
- 新增 `src/lib/training/personalization.ts`：统一 AI JSON 容错解析、训练反馈字段归一化、题目推荐理由解析，以及基于现有诊断/训练/特训数据构造个性化上下文。
- 新增 Node 内置测试 `src/lib/training/personalization.test.ts`，覆盖结构化反馈归一化和题目推荐理由解析。
- `/api/train` 生成题目时读取当前用户最近诊断报告、最近 8 条训练记录和特训弱点预测，不改 schema；prompt 要求输出“为什么练这题”和题目正文，并避免重复近期题目。
- `/api/train` 答案分析从 Markdown 改为严格 JSON，要求输出综合评分、四维评分、亮点、盲区、建议、答题框架、示例回答、用户回答改写和下一题练习。
- `/training/session` 展示题目推荐理由，提交后解析结构化反馈并写入 `training_records.ai_feedback`，保留旧 Markdown 解析兜底。
- `/training/history/[id]` 支持回看结构化反馈，并保留旧训练记录的 Markdown 兜底展示。

### 验证结果
- `rm -rf /tmp/deepseek-agent-training-test && npx tsc --module commonjs --target ES2020 --outDir /tmp/deepseek-agent-training-test src/lib/training/personalization.test.ts --skipLibCheck --esModuleInterop --moduleResolution node && node --test /tmp/deepseek-agent-training-test/personalization.test.js` 通过
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts 'src/app/(app)/training/session/page.tsx' 'src/app/(app)/training/history/[id]/page.tsx' src/components/training/TrainingEvaluationPanel.tsx src/lib/training/personalization.ts src/lib/training/personalization.test.ts --max-warnings 0` 通过
- `git diff --check -- src/app/api/train/route.ts 'src/app/(app)/training/session/page.tsx' 'src/app/(app)/training/history/[id]/page.tsx' src/components/training/TrainingEvaluationPanel.tsx src/lib/training/personalization.ts src/lib/training/personalization.test.ts feature_list.json progress.md` 通过
- `./init.sh` 通过（9/9）

### 浏览器/API 自测结果
- 启动 `npm run dev -- -p 3002`，打开 `http://localhost:3002/training/session`；in-app browser 无登录态，被中间件正确重定向到 `/login`。
- 未登录态下 `/api/train` 的生成接口可返回训练题流，解析后包含 `【为什么练这题：...】` 推荐理由。
- 未登录态下 `/api/train` 的分析接口可返回结构化 JSON，脚本拼接 Vercel AI data stream 后 `JSON.parse` 成功，包含 `overall_score / understanding / framework / solution / decision_logic / thinking_framework / example_answer / improved_answer / next_practice`。
- 未登录态下自动保存题目调用 `/api/training/questions` 返回 401，符合现有 Supabase 鉴权；登录后页面会继续走落库路径。

## [2026-06-05] UI 收口: 训练首页、诊断量表与旧导航清理

### 完成内容
- 删除未被 `src` 引用的旧 `src/components/Sidebar.tsx`，清理 Material Symbols、旧 `surface-container` / `on-surface` token 和第二套导航实现，避免后续误用造成视觉割裂。
- `/diagnosis/scale` 五个能力维度从 emoji 图标改为 lucide 图标（Compass / Workflow / ChartNoAxesCombined / SearchCheck / BadgeDollarSign），维持专业 B 端工具气质。
- `/training` 首屏从“多卡片并列”收敛为：
  - 今日推荐训练：根据未覆盖维度或最低训练均分推荐练习方向。
  - 本月节奏：展示本月训练天数。
  - 统计 strip：累计完成、连续天数、维度覆盖。
  - 维度训练分布下沉到第二层，移除首屏能力雷达，减少第一行动竞争。
- 新增临时结构验证脚本 `tmp/verify-ui-refactor.mjs`，覆盖旧 Sidebar 残留、诊断 emoji、训练首页首屏聚焦三项。

### 验证结果
- `./init.sh` baseline 通过（9/9）
- `node tmp/verify-ui-refactor.mjs` 先失败，改造后通过
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/diagnosis/scale/page.tsx' 'src/app/(app)/training/page.tsx' --max-warnings 0` 通过
- 真实浏览器打开 `http://127.0.0.1:3000/training` 截图保存到 `tmp/training-route.png`，确认首屏主任务、节奏卡和统计 strip 正常显示

### 备注
- `/diagnosis/scale` 在 in-app browser 无登录态时被重定向到 `/login`，本轮未做登录后截图验证；由结构验证、TypeScript 和 ESLint 覆盖。
- 工作区在本轮前已有大量未提交 UI、OpenSpec 归档/删除和新增文件。本次没有回滚既有改动。

## [2026-06-05] Redesign: 案例库详情页阅读工作台

### 完成内容
- `/training/cases/[product]` 从窄单栏详情页改为最大 1480px 的三栏阅读工作台，提升宽屏中间区域利用率。
- 左侧保留分析视角切换，桌面端 sticky；移动端和平板端使用折叠视角选择器，避免 768-1023px 宽度没有导航入口。
- 中间正文放入 raised article panel，正文内容保持 `max-w-[860px]` 居中，兼顾宽屏利用率和长文可读性。
- 顶部增加案例拆解摘要条，展示当前视角和已生成视角数量。
- 右侧增加“阅读抓手 / 视角进度 / 内容状态”，把原本空白区域变成阅读辅助区。
- “重新生成”按钮改为强制 `refresh=true`，避免只是读取缓存文章。

### 验证结果
- `node tmp/verify-case-detail-redesign.mjs` 通过
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/training/cases/[product]/page.tsx' --max-warnings 0` 通过
- `git diff --check -- 'src/app/(app)/training/cases/[product]/page.tsx' tmp/verify-case-detail-redesign.mjs feature_list.json progress.md` 通过
- `./init.sh` 通过（9/9）

### 浏览器自测结果
- 复用 3000 端口旧 dev server 首次打开详情页时出现 Next 开发态 runtime overlay；停止旧进程并清理 `.next/cache` 后，使用当前工作区重启 `npm run dev -- --hostname 127.0.0.1 --port 3000`。
- 重新打开 `http://127.0.0.1:3000/training/cases/Salesforce?perspective=overview` 后，详情页路由先返回 200，随后因无登录态/API 401 被现有中间件重定向到 `/login`。
- 浏览器最终显示登录页，无 runtime overlay。

### 备注
- 本次未改 Supabase schema、API 路由或案例库数据表结构；仅调整详情页 UI 和重新生成按钮调用参数。
- 工作区在本轮前已有大量未提交 UI、OpenSpec 归档/删除和新增文件。本次没有回滚既有改动。

## [2026-06-06] Feature: 案例库重写、全局行动中心与复盘归档

### 完成内容
- `/training/cases` 从缺失/旧列表页重写为案例工作台：产品列表、搜索、自定义产品、完整拆解入口、决策推演入口、作答区、AI 反馈侧栏和作答检查清单。
- 新增 `/api/cases/simulation`：
  - `generate` 使用 AI 生成指定产品的 B 端决策推演场景。
  - `evaluate` 使用结构化教练反馈评估用户回答，并写入 `training_records`，包含 `ai_feedback.source = "case_simulation"`、产品、场景标题、隐藏风险和评分。
  - 不新增依赖、不改 Supabase schema。
- `/api/cases?action=list-products` 在未登录态返回静态预设产品，方便案例库入口展示；读取/生成文章与推演评估仍按现有认证要求。
- `/api/dashboard` 增加 `nextActions`，基于是否完成诊断、今日训练数、近次均分、薄弱维度和案例推演记录生成主行动、次行动与能力信号。
- `/dashboard` 顶部升级为全局行动中心，展示系统推荐下一步、三个快捷行动和当前信号。
- `/api/training/stats` 的 recent 记录增加 `score` 与 `ai_feedback`，供复盘归档使用。
- `/training` 历史区升级为“复盘归档”，展示评分、案例推演来源、最近下一步练习，并保留进入案例推演入口。
- `/training/history/[id]` 升级为 1280px 双栏复盘工作台：顶部元信息、来源/难度/评分、题目、原回答、结构化教练反馈、下一步/盲区/框架摘要和案例隐藏风险。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/training/cases/page.tsx' src/app/api/cases/simulation/route.ts --max-warnings 0` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' src/app/api/dashboard/route.ts --max-warnings 0` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/training/page.tsx' 'src/app/(app)/training/history/[id]/page.tsx' src/app/api/training/stats/route.ts --max-warnings 0` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/cases/route.ts 'src/app/(app)/training/cases/page.tsx' --max-warnings 0` 通过
- 真实临时登录态 API 验证通过：`POST /api/cases/simulation` action=evaluate 返回 `recordId=b5d0a95d-051e-4338-8ca4-c92ee4cd2bfc`，随后 `GET /api/training/history/b5d0a95d-051e-4338-8ca4-c92ee4cd2bfc` 读回 `source=case_simulation`、`product=飞书`、`score` 和 `next_practice`
- `git diff --check` 通过
- `./init.sh` 通过（9/9）

### 浏览器检查
- 启动 `npm run dev -- --hostname 127.0.0.1 --port 3000`，打开 `http://127.0.0.1:3000/training/cases`。
- in-app Browser 首次成功显示新版案例工作台 DOM：案例库标题、案例工作台、生成决策推演、阅读完整拆解、训练闭环、作答区和 AI 教练反馈侧栏。
- 首次检查发现未登录态 `/api/cases?action=list-products` 返回 401，导致预设产品显示为 0；已修复为未登录态返回静态预设产品。
- 后续刷新验证时 Browser 插件触发 URL policy 拦截，未继续绕过；真实登录态 API 写入读回和 `./init.sh` 已覆盖本轮关键链路。

### 备注
- 本轮没有提交 git，因为工作区已有大量非本轮改动与删除项；没有回滚既有改动。
- 本轮仍保留现有认证边界：真正读写 Supabase 的推演评估、案例文章生成、训练记录读取都需要登录；已用临时测试账号验证登录态写入和读回。

## [2026-06-06] UX 调整: 工作台与案例库焦点收束

### 完成内容
- `/dashboard` 顶部行动区进一步收束为“今天先做这件事”，主行动使用唯一显眼按钮，推荐依据和次行动降低视觉权重。
- `/api/dashboard` 过滤与主行动同类型的 secondary action；未诊断状态下 secondary 不再返回另一个 diagnosis 入口。
- `LatestReport` 未诊断空状态去掉“开始诊断”显眼按钮，只保留状态说明；已有报告时“查看完整报告”降级为文本链接。
- `/training/cases` 首屏进一步聚焦“先做一题真实产品决策”，恢复产品列表可见，当前产品明确展示，空 AI 反馈侧栏改为提交后才显示。
- `/training/cases` 允许未登录预览入口页；真正生成推演、提交反馈、读取训练记录仍走登录保护。

### 验证结果
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' src/app/api/dashboard/route.ts src/components/dashboard/LatestReport.tsx --max-warnings 0` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/layout.tsx' 'src/app/(app)/dashboard/page.tsx' 'src/app/(app)/training/cases/page.tsx' --max-warnings 0` 通过
- 临时登录态请求 `/api/dashboard` 返回 `primary.kind=diagnosis`，secondary 仅包含 `case/review`，不再包含 diagnosis。
- in-app Browser 打开 `/training/cases` 确认：主焦点文案、10 个产品、当前飞书、产品列表可见，空 AI 反馈侧栏不显示。

## [2026-06-12] Hotfix: 登录跳转与训练入口路由

### 完成内容
- 修复登录按钮点击后的跳转错误：`/login` 登录成功后先确认 Supabase session，再用 `window.location.replace("/dashboard")` 硬跳转，避免客户端 chunk transition 时出现 Runtime ChunkLoadError。
- 修复训练入口进入旧版出题页：`TRAINING_SESSION_ROUTE` 统一为 `/training/session`，移除 middleware、`next.config.ts` 和训练 session 页里追加 `entry=dashboard&ui=a1` 的旧版强制跳转。
- 增加 `src/lib/routes.test.mjs` 覆盖训练 session canonical route，确保入口路由不再携带旧 query。
- `src/app/layout.tsx` 保留 `suppressHydrationWarning`，避免浏览器扩展注入属性时打断开发态验证。

### 真实鼠标点击验证
- 使用 Computer Use 控制豆包浏览器，在 `http://localhost:3000/login` 输入账号 `210134258@qq.com` 和密码后，鼠标点击“登录”：最终 URL 为 `localhost:3000/dashboard`，工作台主体完整渲染，无 Runtime ChunkLoadError 或 Next overlay。
- 在同一真实浏览器会话中鼠标点击顶部“训练”，进入 `localhost:3000/training`；再鼠标点击“开始今日训练”：最终 URL 为 `localhost:3000/training/session`，没有 `entry` 或 `ui` 参数，页面显示新版“先读题，再完成你的判断”出题界面。

### 验证结果
- `npm run typecheck` 通过
- `node --experimental-strip-types src/lib/routes.test.mjs` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(auth)/login/page.tsx' 'src/app/(app)/training/session/page.tsx' src/lib/routes.ts src/lib/routes.test.mjs src/middleware.ts src/app/layout.tsx next.config.ts --max-warnings 0` 通过
- `npm run build` 通过；仅保留既有 `src/components/auth/AuthShowcase.tsx` 使用 `<img>` 的 Next 性能警告
- `./init.sh` 通过（9/9）

### 备注
- 工作区在本轮前已有大量未提交 UI、OpenSpec 和 Supabase 相关改动；本轮没有回滚任何既有改动，也没有提交混合变更。

## [2026-06-12] Hotfix: 训练真实出题页对齐新版 A1 UI

### 完成内容
- 将真实 `/training/session` 的提交前界面进一步对齐新版 A1 方案：白色 sticky 顶栏、`#F7F9FB` 页面底、`#EEF2FF` 高权重题卡、题目标题“本题要你做一个真实取舍”、回答区“先写结论，再补依据”和更大的作答空间。
- 将真实 `/training/session` 的提交后界面进一步对齐新版体验：左侧压缩为“原题 / 我的回答”参考信息，右侧以 AI 产品教练反馈为主焦点，保留结构化 `TrainingEvaluationPanel` 和 markdown fallback。
- 保留真实训练业务流：`/api/train` 出题/分析、`/api/training/questions` 保存题目、`/api/training/record` 保存训练记录、`/api/training/feedback` 题目反馈、`/api/training/sessions` 一轮结束落库。
- 将训练 canonical route 固定为 `/training/session`，避免入口进入旧版页面或静态 demo。

### 验证结果
- `node --experimental-strip-types src/lib/routes.test.mjs` 通过
- `npm run typecheck` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/training/session/page.tsx' 'src/app/(app)/training/page.tsx' src/lib/routes.ts src/lib/routes.test.mjs --max-warnings 0` 通过
- `npm run build` 通过；仅保留既有 `src/components/auth/AuthShowcase.tsx` 使用 `<img>` 的 Next 性能警告
- `./init.sh` 通过（9/9）

### 部署状态
- 后续已切换到 Git 拉取式部署，生产目录 `/www/wwwroot/shengyunjie` 对应 `deploy/pm` 分支。
- 已部署提交：`bdb5fc5 chore: wait for app health during deploy`。
- 公网只读验证：`BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。
- 仍建议补做一次生产真实鼠标点击回归：Kimi WebBridge 打开 `/training`，Computer Use 点击“开始今日训练”，确认最终进入 `/training/session` 新版页。

## [2026-06-12] Hotfix follow-up: 训练入口缓存防复发

### 完成内容
- 将训练 canonical route 固定为 `/training/session`，`TRAINING_SESSION_ROUTE` 和 `routes.test.mjs` 已同步。
- 新增训练 segment 缓存策略：`src/app/(app)/training/layout.tsx` 设置 `dynamic = "force-dynamic"`、`revalidate = 0`、`fetchCache = "force-no-store"`，避免 `/training` 和 `/training/session` 再生成长期缓存 HTML。
- 将新版真实训练页抽为 `src/components/training/TrainingSessionClient.tsx`，由 `/training/session` 渲染真实训练组件。
- 移除生产体验里的“训练题页面 UI 方案预览”和 A1 状态切换壳，保留提交前/提交后自动切换。

### 生产状态
- 裸路径缓存问题已通过动态渲染策略和 nginx/宝塔缓存清理解决。
- 公网响应头已确认 `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`。

## [2026-06-12] Deploy tooling: 固化 git 拉取式生产部署

### 完成内容
- 新增 `scripts/deploy-production.sh`：默认从 `origin/deploy/pm` 拉取代码，保留 `.env.local`、按 `package-lock.json` hash 决定是否 `npm ci`、清空 `.next` 后构建、PM2 delete 后重新 start，并检查本机 `/training` 与 `/training/session`。
- 新增 `scripts/verify-production-training.sh`：生产部署后检查裸路径不再带一年级 `s-maxage`，训练首页入口指向 `/training/session`，session 页面包含新版标记且不包含“训练题页面 UI 方案预览”。
- 部署脚本会自动检查 nginx 是否配置 `proxy_cache_path` / `fastcgi_cache_path`，如存在则清理对应缓存目录并 reload nginx。
- 新增 `docs/DEPLOYMENT.md`，记录 `deploy/pm` 分支、服务器目录、PM2 app、部署命令和验证命令。

### 验证结果
- `bash -n scripts/deploy-production.sh` 通过
- `bash -n scripts/verify-production-training.sh` 通过
- `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`

## [2026-06-12] Chore: 工作区整理与旧前端清理

### 完成内容
- 删除旧静态 HTML 原型目录 `prototypes/`，这些早期页面不再作为产品路由、测试或设计交付物使用。
- 删除旧 preview 路由 `/training/session-ui-preview`，生产训练入口只保留 `/training/session`。
- 删除误提交的根目录 `1`，该文件只是 Next.js workspace warning 输出。
- 清理本地忽略产物：`tmp/`、`.next/`、`.cowork-temp/`、`.DS_Store`、`tsconfig.tsbuildinfo`。
- 将 `AuthShowcase` 的 `<img>` 替换为 `next/image`，消除全量 ESLint 中唯一 warning。
- 修复 `init.sh` 的 ESLint 检查计数，避免 lint 失败却显示全部通过。
- 更新生产验证脚本，不再请求已删除的 `/training/session-ui-preview`。

### 验证结果
- `node --experimental-strip-types src/lib/routes.test.mjs` 通过
- `npm run typecheck` 通过；清理 `.next` 和 `tsconfig.tsbuildinfo` 后也可独立通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0` 通过
- `npm run build` 通过，路由表只保留 `/training/session`，不再包含 preview route
- `./init.sh` 通过（10/10），ESLint 检查不再误报
- `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`

### 待办
- 本轮不部署、不重启 PM2。
- 生产真实鼠标点击回归仍可单独补做。

## [2026-06-19] 日常训练: 维度出题方向收敛

### 背景判断
- 用户反馈日常训练第一题“战略思维”体感过复杂，不够像可提升能力的训练。
- 重新审视后确认：5 个能力维度总体保留，但需要把维度名翻译成“可训练的小动作”，避免按“战略思维”直接生成宏大战略作文题。

### 完成内容
- 新增 `src/lib/training/dimension-strategy.ts`：定义 5 个维度的能力定位、推荐框架、允许题型、回答训练重点和禁止题型。
- 战略思维重新收敛为“业务判断与取舍”：训练产品动作反推业务意图、识别牺牲项/机会成本、选择验证指标。
- `/api/train` 生成题接入维度策略：出题时只能从对应维度的允许题型中选择小场景，并要求用户回答 2-3 个具体判断问题。
- `/api/train` 分析反馈接入维度策略：评分除通用理解/框架/方案/决策逻辑外，优先参考该维度的专项训练重点。
- `docs/2026-05-19-prompt-strategy.md` 同步更新 5 个维度定义和出题规则。
- `/training/session` 示例题从 A/B 大战略取舍改为“免费试用 30 天改 7 天 + 预约顾问”的业务判断题，页面标签改为“业务判断题 / 业务意图识别 / 验证指标”。
- 将旧的 `src/lib/training/personalization.test.ts` 迁移为 `.mjs` 测试文件，和项目其他 Node 内置测试风格一致，避免 Node 直接执行与 `tsc` 的扩展名规则冲突。

### 验证结果
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs` 通过（Node 对 TS ESM 有既有 MODULE_TYPELESS_PACKAGE_JSON warning，不影响结果）
- `npx tsc --noEmit` 通过
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/lib/training/dimension-strategy.ts src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过
- `git diff --check` 通过

### 后续建议
- 可以补一个真实出题接口验证：登录态调用 `/api/train` 生成“战略思维”题，确认题面落在业务动作、取舍和指标验证，而不是战略路线图。

## [2026-06-19] Deploy: 日常训练维度出题策略上线

### 部署内容
- 本地提交 `e5a35fe refine training dimension question strategy` 已推送到 `origin/deploy/pm`。
- 通过腾讯云 OrcaTerm root shell 在生产目录 `/www/wwwroot/shengyunjie` 执行 `bash scripts/deploy-production.sh`。
- 生产部署脚本拉取 `origin/deploy/pm`，重置到 `e5a35fe`，跳过未变化依赖安装，重新构建 Next.js，重启 PM2 `shengyunjie`，清理 nginx cache。

### 验证结果
- 本地上线前 `./init.sh` 通过（10/10）。
- 服务器部署输出：`DEPLOY_OK deploy/pm e5a35fe`。
- 服务器脚本内公网验证：`VERIFY_OK https://pm.imfly.site`。
- 本机公网复验：`BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。
- 本机 `curl https://pm.imfly.site/training/session` 确认生产页已使用新 chunk `page-ac33fcca71e41c94.js`，并包含新文案“业务判断”，不再是旧的“机会成本分析”标签。

### 状态
- 生产环境已上线本次日常训练出题方向调整。

## [2026-06-20] Fix: 清除战略思维旧机会成本框架残留

### 背景判断
- 用户线上截图显示：日常训练第一题标签已是“业务判断”，但题干仍要求“运用机会成本分析框架”并计算显性/隐性机会成本，说明 2026-06-19 的改动只改到标签和部分策略，生成 prompt 仍被旧 framework 锚定。
- 用户同时指出答题区固定提示“推荐结构：结论 / 依据 / 风险 / 验证”不应写死；该提示会让不同维度被同一模板约束。

### 完成内容
- `src/lib/training/dimension-strategy.ts` 中战略思维框架从“业务意图识别 / 机会成本分析 / 战略取舍框架”改为“业务意图识别 / 取舍判断 / 验证指标框架”。
- 战略思维策略移除“机会成本/显性成本/隐性成本”运行时锚点，改用“选择标准、先做什么、暂时不做什么、放弃项、风险边界、验证指标”。
- `src/lib/training/dimension-strategy.test.mjs` 增加回归断言：战略思维 prompt 不应包含机会成本分析、显性/隐性成本等旧框架词。
- `/training/session` 答题区删除固定“推荐结构：结论 / 依据 / 风险 / 验证”，标题改为“写下你的判断”；旧预览变体中的同类固定提示也已删除。
- 前端样例中的“显性收益/隐性成本”改为“业务目标/暂不做什么/验证指标”。
- `docs/2026-05-19-prompt-strategy.md` 同步改为业务动作反推、取舍判断、资源排序、验证指标，并禁止抽象成本计算题。

### 验证结果
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs` 通过（Node 对 TS ESM 有既有 MODULE_TYPELESS_PACKAGE_JSON warning，不影响结果）。
- `rg -n "推荐结构：结论 / 依据 / 风险 / 验证|机会成本分析|显性机会成本|隐性机会成本|显性成本|隐性成本" src docs -S -g '!*.test.mjs'` 无运行代码/文档残留。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/training/dimension-strategy.ts src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- `git diff --check` 通过。

## [2026-06-20] UX: 品牌阶梯图标替换

### 完成内容
- 根据用户确认的“阶梯 + 平台”方向，新增复用组件 `src/components/brand/BrandMark.tsx`。
- 顶部导航、登录页、注册页和认证展示区不再使用 `GraduationCap`，统一替换为深青色阶梯平台品牌标志。
- 新增 `src/app/icon.svg`，并在 `src/app/layout.tsx` metadata 中声明 `/icon.svg` 作为浏览器标签页图标。
- 新增 `src/components/brand/brand-mark.test.mjs` 回归检查，防止品牌位重新出现毕业帽图标或 favicon 丢失阶梯图形。
- 将 `.superpowers/` 加入 `.gitignore`，避免视觉草案工具产物进入部署提交。

### 验证结果
- `node --test src/components/brand/brand-mark.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/brand/BrandMark.tsx src/components/TopNav.tsx 'src/app/(auth)/login/page.tsx' 'src/app/(auth)/register/page.tsx' src/components/auth/AuthShowcase.tsx src/app/layout.tsx --max-warnings 0` 通过。
- `npm run build` 通过，构建路由包含 `/icon.svg`。
- `./init.sh` 通过（10/10）。

### 部署结果
- 已提交并推送：`27eaba8 feat: replace brand icon with stair mark`。
- 生产部署脚本输出：`DEPLOY_OK deploy/pm 27eaba8`。
- `curl -I https://pm.imfly.site/icon.svg` 返回 `HTTP/2 200`，`content-type: image/svg+xml`。
- `curl -s https://pm.imfly.site/login | rg -n 'icon\.svg|升云阶|_next/static'` 确认页面 HTML 引用 `/icon.svg`，并渲染 `升云阶阶梯标志`。
- `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。

## [2026-06-20] Docs: 已完成功能文档债回补

### 背景
- 用户指出需要回写的不止品牌图标，还包括此前做完但文档未补/未改的功能。
- 审计对象：近期已完成并有验证/部署记录的 6 月 12 日训练入口与部署工具、6 月 19 日维度出题策略、6 月 20 日战略思维热修。

### 回补内容
- 新增 `docs/superpowers/specs/2026-06-12-training-production-routing-design.md`，记录训练入口统一、动态缓存策略、Git 拉取式部署、旧 preview/原型清理。
- 新增 `docs/superpowers/reports/2026-06-12-training-production-routing-verify.md`，记录训练入口与生产部署稳定性验证。
- 新增 `docs/superpowers/specs/2026-06-19-training-dimension-strategy-design.md`，记录五维训练策略收敛、战略思维业务判断化和 `/api/train` 接入方式。
- 新增 `docs/superpowers/reports/2026-06-19-training-dimension-strategy-verify.md`，记录维度出题策略本地和生产验证。
- 新增 `docs/superpowers/specs/2026-06-20-training-strategy-prompt-hotfix-design.md`，记录机会成本旧框架残留清理、固定推荐结构删除和回归测试。
- 新增 `docs/superpowers/reports/2026-06-20-training-strategy-prompt-hotfix-verify.md`，记录战略思维热修验证结果。
- 更新 `feature_list.json`，在 `training-001` 和 `ux-001` 证据中补充新增文档索引。
- 2026-06-25：训练题质量升级，新增 `src/lib/training/question-bank.ts` 作为高阶产品题种子池（30+ 条，带 source/sourceUrl/usageRights/variationAxes/forbiddenPatterns），`/api/train` 生成前先选种子并注入种子材料，同时把今日会话题目与历史记录一起参与重复惩罚；`question-bank.test.mjs` 与 `route.test.mjs` 覆盖了种子密度、家族避让、当天题规避和 prompt 注入。验证：`node --test src/lib/training/question-bank.test.mjs src/app/api/train/route.test.mjs`、`npx tsc --noEmit`、`./init.sh` 通过。

### 验证结果
- `feature_list.json` JSON 解析通过。
- 新增文档均指向已有提交、命令和生产验证证据，不改变运行代码。

## [2026-06-20] Fix: 训练提交后分析结果页复盘体验

### 背景判断
- 用户截图指出提交后结果页有三处问题：左侧“题目/回答”被截断且无法查看全文；“AI 产品教练反馈”同一段反馈上下重复；“示例回答”和“把你的回答改成这样”信息价值重叠。
- 判断后保留“示例回答”作为唯一高质量答案示范，把可执行修改动作继续放在“下一轮立刻这样改”，不再展示第二个改写答案。

### 完成内容
- `TrainingSessionClient` 提交后左侧参考区从 `line-clamp` 改为固定阅读区 + 内部滚动，原题和我的回答都可完整回看。
- `TrainingEvaluationPanel` 增加 `hideSummary`，训练提交后的外层摘要保留一处，面板内部不再重复渲染同一段教练反馈。
- 训练反馈 UI 删除“把你的回答改成这样”，示例回答改为单列重点展示。
- `TrainingEvaluation` 契约移除 `improved_answer`，`/api/train` 和案例推演评估 prompt 不再要求 AI 生成该字段，减少无用输出。
- 增加回归测试，确认即使 AI 旧响应带 `improved_answer`，归一化后的训练反馈也不再暴露该字段。

### 验证结果
- `node --test src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/components/training/TrainingEvaluationPanel.tsx src/lib/training/personalization.ts src/app/api/train/route.ts src/app/api/cases/simulation/route.ts --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

### 备注
- 内置浏览器连接在本轮出现工具层错误：`codex/sandbox-state-meta: missing field sandboxPolicy`，未能做浏览器截图复验；本轮已用源码、类型、lint 和构建完成验证。

## [2026-06-20] Feature: 当天训练进度恢复

### 背景判断
- 用户希望当天已做过的题目不要因误点击或跳失而重复从第一题开始。
- 现有 `training_records` 已记录用户当天提交过的维度，`training_sessions` 已按天缓存题目，因此不需要新增 Supabase 表或 schema 字段。

### 完成内容
- 新增 `src/lib/training/session-progress.ts`，用标准五维度顺序根据当天已完成维度计算下一题索引。
- `/api/training/sessions?date=YYYY-MM-DD` 现在返回 `completedDimensions` 和 `nextIndex`，并按北京时间查询当天 `training_records`。
- `/training/session` 首次进入会读取当天状态，复用 `training_sessions.questions` 中已生成的题目，并自动跳到下一道未完成题。
- 顶部“结束”按钮左侧新增“重新开始”，仅重置当前页面状态并从第一题开始，不删除有效训练历史。
- `/api/training/questions` 保存题目时改为先读旧 `questions` 再合并写入，避免后续维度题目覆盖当天已缓存题目。

### 验证结果
- TDD 红灯：`node --test src/lib/training/session-progress.test.mjs` 先因缺少模块失败。
- `node --test src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/app/api/training/sessions/route.ts src/app/api/training/questions/route.ts src/lib/training/session-progress.ts src/lib/training/session-progress.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

### 备注
- 本次未新增数据库 schema，避免 RLS / Data API 暴露范围变化。

## [2026-06-20] UX: 训练题页按钮与固定提示清理

### 背景判断
- 用户截图指出顶部“重新开始”和“结束”按钮视觉权重不统一。
- 题目卡里的固定句子“本题要你做一个真实取舍”每题重复出现，信息价值不高，会干扰阅读题干。

### 完成内容
- `/training/session` 顶部“重新开始”和“结束”统一为同高度、同间距、同 hover 的文本按钮样式。
- 移除题目卡固定标题“本题要你做一个真实取舍”。
- 同步移除题干 Markdown 上方多余 `mt-2`，让标签下方直接进入题目正文。

### 验证结果
- `rg -n "本题要你做一个真实取舍" src/components/training/TrainingSessionClient.tsx src` 无匹配。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

### 部署记录
- 首次生产部署已构建并重启 PM2 到 `cefa72a`，但旧验证脚本仍要求页面包含已删除文案“本题要你做一个真实取舍”，因此脚本末尾校验失败。
- 已同步更新 `scripts/verify-production-training.sh`：改为校验“重新开始”“结束”存在，并禁止旧提示文案出现。
- `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。

## [2026-06-20] Tweak: 日常训练每题收敛为两问

### 背景判断
- 用户截图指出当前题干通常包含 3 个追问，单题压力过大，不利于循序渐进训练。
- 日常训练的目标应是稳定练一个小判断动作，而不是把每题做成一次小面试。

### 完成内容
- `/api/train` 生成题 prompt 从“回答 2-3 个具体判断问题”改为“严格包含 2 个具体判断问题”。
- 两问结构固定为：一个核心判断 + 一个落地、风险或验证追问。
- 明确禁止第 3 个问题，也禁止通过“注意/补充要求/额外思考”形成隐性第三问。
- 同步更新 `docs/2026-05-19-prompt-strategy.md` 和 `docs/superpowers/specs/2026-06-19-training-dimension-strategy-design.md`。
- 增加回归测试，防止出题 prompt 重新出现 `2-3 个具体判断问题`。

### 验证结果
- TDD 红灯：新增测试先因 `/api/train` 仍包含 `2-3 个具体判断问题` 失败。
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `rg -n "2-3 个具体判断问题|2-3个具体判断问题" src docs -S` 无匹配。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/lib/training/dimension-strategy.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。

## [2026-06-20] Tweak: 答题区显示 AI 极简提点

### 背景判断
- 用户指出“写下你的判断”没有信息价值，初阶产品容易不知道从哪里下手。
- 答题前适合给“思考入口”，但不能给结论或示范答案，否则会削弱训练判断力。

### 完成内容
- `/api/train` 出题输出从两段扩展为三段：`为什么练这题`、`答题提点`、`题目正文`。
- `答题提点` 限制为不超过 25 字，只提示思考入口，不给结论、不替用户作答。
- `parseGeneratedQuestionText` 新增 `hint` 解析，兼容旧的原因 + 题目格式。
- `/training/session` 答题区标题从固定“写下你的判断”改为显示 AI 生成提点。
- `/api/training/questions` 支持保存 `{ text, reason, hint }`，继续写入既有 `training_sessions.questions` JSON，不改 schema。
- 今日进度恢复兼容旧字符串题目；旧题没有 hint 时按维度给兜底提点。
- `docs/2026-05-19-prompt-strategy.md` 同步记录答题提点规则。

### 验证结果
- TDD 红灯：新增测试先因缺少 `答题提点` prompt 约束、解析器误吞提点而失败。
- `node --test src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/app/api/training/questions/route.ts src/components/training/TrainingSessionClient.tsx src/lib/training/personalization.ts src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。

## [2026-06-20] Tweak: 当天训练题目缓存复用

### 背景判断
- 用户担心进入训练页自动刷新题目会浪费 token。
- 现有 `training_sessions.questions` 已经按天保存题目，不需要新增表或字段；核心是前端不要在“重新开始/再来一轮”时清空题目状态触发自动出题。

### 完成内容
- `/training/session` 的“重新开始”现在只清空回答、分析、分数和流式文本，保留当天已生成题目缓存。
- 完成 5 题后的下一轮同样保留已生成题目，不再清空 `questions` 触发 `/api/train`。
- “换一题”仍是唯一显式重新生成入口，会继续调用 `generateQuestion(currentDim)` 并保存覆盖当前维度题目缓存。
- 新增回归测试，锁定 `handleRestart` 和下一轮逻辑不得清空题目缓存，同时确认手动换题仍可重新生成。

### 验证结果
- TDD 红灯：新增测试先因 `handleRestart` 含 `setQuestions({})` 失败。
- `node --test src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/lib/training/session-progress.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-21] Tweak: 答题区升级为框架思维引导

### 背景判断
- 用户认为短句“提点”容易变成题目细节摘要，不能帮助用户形成可迁移的框架思维。
- 当前阶段应先降低初阶用户上手门槛，帮助用户识别问题本质、建立拆解路径和判断闭环；后续用户水平提高后，再考虑根据弱项做个性化纠偏提点。

### 完成内容
- `/api/train` 的“答题提点”规则升级为框架思维引导：明确生成原因是降低上手门槛、沉淀可迁移产品思维，而不是提示当前题答案。
- 引导长度从 25 字以内放宽为 40-90 字，允许 AI 自由组织结构，不固定句式。
- Prompt 要求引导覆盖问题本质、拆解路径和判断闭环，禁止复述题干细节、给具体答案或替用户选择方案。
- `/training/session` 答题区改为独立“思考框架”引导区，小字号、舒适行高展示几十字内容，避免长文本挤在标题里。
- 旧缓存题如果仍带短 hint，会自动使用新的维度框架兜底，避免继续露出旧短句风格。
- `docs/2026-05-19-prompt-strategy.md` 同步更新出题策略记录。

### 验证结果
- TDD 红灯：新增测试先因 `/api/train` 仍包含“不超过 25 字/极简提示”失败。
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/components/training/TrainingSessionClient.tsx src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-21] Fix: 思考框架只展示 AI 当前题生成结果

### 背景判断
- 用户测试发现题目还没出来时，“思考框架”已经显示，担心它是写死或按维度默认提供。
- 这个担心成立：上一版前端确实有 `DIM_HINTS` 维度兜底，加载中也会显示默认框架，不符合“根据题目生成框架引导”的需求。

### 完成内容
- 移除 `/training/session` 前端的维度默认框架兜底。
- `getQuestionHint` 只接受当前题 `question.hint`，且长度达到合格阈值才返回；旧短 hint、无 hint、加载中或生成失败都不显示“思考框架”区。
- 答题区保留“思考框架”展示样式，但改为条件渲染，确保用户看到的引导来自 AI 针对当前题生成并保存的结果。
- 增加回归测试，禁止组件重新引入 `DIM_HINTS` 或写死维度框架。

### 验证结果
- TDD 红灯：新增测试先因组件仍包含 `const DIM_HINTS` 失败。
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/lib/training/dimension-strategy.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-21] Fix: 旧缓存题二次解析框架引导

### 背景判断
- 用户截图中 `【答题提点：...】` 出现在题目卡顶部，但答题区“思考框架”为空。
- 判断原因：历史缓存的 `training_sessions.questions[dim].text` 已经把 AI 输出段落整体存成题干，恢复缓存时只读取 `hint` 字段，没有对旧题干二次解析。

### 完成内容
- `normalizeStoredQuestion` 对字符串缓存和对象缓存的 `text/question` 都会调用 `parseGeneratedQuestionText`。
- 如果旧题干里包含 `【答题提点】`、`【为什么练这题】` 或 `题目正文`，恢复时会拆出 `hint/reason`，并清理题目正文，避免提示混进题目卡。
- `parseGeneratedQuestionText` 增加测试覆盖模型省略 `题目正文` 标签、只用 inline `【答题提点：...】` 后直接输出题目的格式。
- 保持上一轮原则：不会用维度写死兜底；只有解析到当前题真实 hint 时才展示“思考框架”。

### 验证结果
- TDD 红灯：新增测试先因缓存恢复路径未调用 `parseGeneratedQuestionText(text)` 失败。
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/training/TrainingSessionClient.tsx src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-21] Tweak: 诊断阶段三案例实战参与分数校准

### 背景判断
- 用户认为当前诊断思路不够准确，但又担心重诊断会吓跑用户。
- 本轮采用小改：不新增动态画像表，不拉长诊断流程，只让现有阶段三案例回答真正参与诊断结论。

### 完成内容
- `/api/diagnosis/case` 在提交案例后调用 AI 诊断师评估用户案例分析，输出五维结构化证据、强弱项和改进建议。
- 新增 `case-calibration` 诊断工具：将量表自评分与案例实战评分按 75%/25% 混合，温和校准五维分数，避免一次案例完全推翻初筛。
- 校准后的 `dimension_scores`、`diagnosis_reports.overall_score/overall_grade/strengths/weaknesses/improvements` 和 `growth_snapshots` 会同步写入。
- 报告页增加“实战校准”摘要，明确案例实战已按权重校准量表分数。

### 验证结果
- TDD 红灯：新增 `case-calibration.test.mjs` 先因缺少实现失败，再因权重不符合预期失败。
- `node --test src/lib/diagnosis/case-calibration.test.mjs src/lib/diagnosis/report-summary.test.mjs src/lib/diagnosis/report-detail.test.mjs src/lib/diagnosis/interview-readiness.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- 针对性 ESLint 通过。
- `npm run build` 通过。
- `./init.sh` 重跑通过（前一次与并行 build 同跑时出现瞬时 TypeScript 失败，单独复跑为 10/10 通过）。

## [2026-06-21] Fix: 连续推荐理由后的答题提点不再混入题目卡

### 背景判断
- 用户截图显示第二题的 `【答题提点：...】` 出现在题目卡红框位置，而不是下方“我的回答”的思考框架区。
- 复现发现：当模型输出 `【为什么练这题：...】` 后紧接 `【答题提点：...】`，并省略 `题目正文` 标签时，解析器只剥离了推荐理由，答题提点会残留在题干开头。

### 完成内容
- `parseGeneratedQuestionText` 在推荐理由解析后，会再次检测并剥离题干开头残留的 inline `【答题提点：...】`。
- 旧缓存题恢复时仍会走同一解析逻辑，因此已缓存的边缘格式也会把框架引导放回“我的回答”区域，题目卡不再显示答题提点。
- 增加回归测试覆盖“推荐理由 + 答题提点 + 直接题干”的真实格式。

### 验证结果
- TDD 红灯：新增测试先因 `hint` 为空且题干残留 `答题提点` 失败。
- `node --test src/lib/training/personalization.test.mjs src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/completion.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- 针对性 ESLint 通过。

## [2026-06-22] Fix: 日常训练题 UI 对齐与高阶 PM 靶点出题

### 背景判断
- 用户截图显示“未提交”状态与“思考框架”视觉同行，而预期应与“我的回答”同行。
- 进一步讨论后确认，题目高度相似不只是查重不足，而是第一题固定从“战略思维 | 业务判断”开始，且 prompt 把题目空间压得过窄。
- 检索高阶 PM 能力框架后，采用“五维统计维度 + 高阶 PM 训练靶点”的结构，避免只围绕大维度标签出题。

### 完成内容
- 答题区布局改为标题行只放“我的回答”和“未提交/分析中”，思考框架作为独立引导块下移。
- 新增高阶 PM 训练靶点库：问题定义、业务结果判断、复杂取舍、指标与因果、生命周期判断、系统边界、价值捕获、组织协同、质量交付、复盘迭代。
- `/api/train` 出题改为按当前维度选择训练靶点，并把靶点能力、思考框架、变化轴和禁区写入 prompt。
- 前端第二标签从固定大维度框架名改为当前靶点标签，例如“业务结果判断”“指标与因果”“系统边界”。
- 每日训练维度顺序按日期轮换，避免每天第一题固定为战略思维；`/api/training/sessions` 恢复进度也使用同一轮换顺序。
- 继续保留防假大空约束：小场景、2 个判断问题、禁止年度战略/第二增长曲线/虚构宏大经营数据。

### 验证结果
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/personalization.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/training/dimension-strategy.ts src/lib/training/session-progress.ts src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/app/api/train/route.ts src/app/api/training/sessions/route.ts src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- `npm run build` 通过。

## [2026-06-22] Follow-up: 换一题同步切换训练靶点

### 背景判断
- 用户本地验证发现点击“换一题”后，题目第二标签仍停留在同一个靶点，例如“系统边界”。
- 这说明上一轮虽然做了每日维度轮换和靶点库，但同一天同一维度手动换题仍被同一靶点约束，可能继续产生相似题。

### 完成内容
- `QuestionState` 和 `training_sessions.questions` 缓存结构增加 `targetId/targetLabel`。
- `/api/train` 接收 `targetId`，按指定靶点生成题，而不是只按日期默认靶点。
- “换一题”会调用 `getNextTrainingTarget`，在当前维度内切换到下一个高阶 PM 靶点，题目卡第二标签立即变化。
- 旧缓存题如果没有靶点信息，会用当前维度默认靶点兜底。

### 验证结果
- `node --test src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/personalization.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/training/dimension-strategy.ts src/lib/training/session-progress.ts src/lib/training/dimension-strategy.test.mjs src/lib/training/session-progress.test.mjs src/app/api/train/route.ts src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- 本地 dev server `http://localhost:3002/training/session` 返回 200。

## [2026-06-25] Fix: 特训题目与教练反馈不再串项目

### 背景判断
- 用户截图显示特训题把「BPM 流程引擎重构」错误写成在「万商云集」做，疑似 MD 简历解析后项目和公司归属串联。
- 同一页右侧 AI 教练反馈围绕另一个「教师智能助理低使用率场景」题目，而不是当前 BPM 流程引擎题，说明评分反馈上下文约束过松。

### 完成内容
- `/api/bootcamp/resume` 的简历解析 JSON 增加 `projects.company`，并要求只有同一经历/同一小节/项目描述明确归属时才填写，无法判断就留空。
- 新增 `src/lib/bootcamp/grounding.ts`：从简历结构化信息生成项目归属锚点，并检测“项目名 + 其他公司名”的错配题目。
- `/api/bootcamp/interview` 在出题 prompt 中加入项目归属锚点，并过滤模型返回的项目/公司错配题，防止「万商云集做 BPM」这类组合进入题库。
- `/api/bootcamp/interview/answer` 强约束评分只能围绕当前题目和当前回答；总评、示例回答、改写示范若无法和当前上下文重叠，会回落到当前题目导向的安全文案。
- `ResumePreview` 展示项目所属公司，便于用户在解析结果页发现归属异常。

### 验证结果
- `node --test src/lib/bootcamp/grounding.test.mjs` 通过，覆盖「万商云集 + BPM 流程引擎重构」错配、项目 company 优先和泛泛“这个项目”反馈串题。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/bootcamp/resume/route.ts src/app/api/bootcamp/interview/route.ts src/app/api/bootcamp/interview/answer/route.ts src/lib/bootcamp/grounding.ts src/components/bootcamp/ResumePreview.tsx --max-warnings 0` 通过。
- `npm run build` 通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-06-25] Fix: 特训有反馈时下一题按钮可点击

### 背景判断
- 用户截图显示当前题右侧已经生成完整反馈，但底部“下一题”仍是禁用态。
- 根因是页面渲染反馈看 `currentQuestion.ai_evaluation`，但按钮禁用条件和进度统计只看 `status === "evaluated"`；当历史记录或接口返回出现“有 ai_evaluation 但 status 仍为 answered/pending”的陈旧状态时，页面会显示反馈却不允许进入下一题。

### 完成内容
- `src/lib/bootcamp.ts` 新增 `isQuestionEvaluated` / `canAdvanceFromQuestion`，统一用 `status === evaluated || ai_evaluation 存在` 判断题目是否已完成。
- `/bootcamp/interview` 的进度条、今日进度和“下一题”按钮改用同一判断，避免显示反馈但按钮不可点。
- 新增 `src/lib/bootcamp.test.mjs` 回归测试，覆盖“有 ai_evaluation 但 status 陈旧”仍可进入下一题。

### 验证结果
- `node --test src/lib/bootcamp.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/bootcamp/interview/page.tsx' src/lib/bootcamp.ts --max-warnings 0` 通过。
- `npm run build` 通过。

## [2026-06-26] Fix: 日常训练换题仍高度同质

### 背景判断
- 用户截图显示连续刷新/换题后，题面仍集中在 B2B SaaS、免费/付费、权限、试用、默认策略、上线回滚和验证方案。
- 根因不是单纯“随机性不够”：前端换题时没有把当前页面已生成题传给 `/api/train`，后端只依赖已异步保存到 `training_sessions.questions` 的题；连续点击或保存未完成时，重复控制看不到刚出现的题。
- 第二个根因是种子库和 prompt 都会把战略思维题收束到同一种骨架：产品域多为 SaaS，追问多为“关键指标/观察周期/决策标准/回滚”。

### 完成内容
- `TrainingSessionClient` 生成题时传入当前页面已知题目 `currentQuestions`。
- `/api/train` 合并前端即时题和当天缓存题，统一进入 `buildTrainingPersonalization`、recent family 提取和 `pickTrainingQuestionSeed`。
- `question-bank.ts` 增加题面骨架信号检测，识别 SaaS 定价权限、默认权限变更、上线回滚验证、指标护栏闭环等拥挤模板；当今日题目已集中在某类骨架时，优先从候选种子中剔除同类骨架。
- 出题 prompt 明确禁止把每题都写成“设计验证方案，包含关键指标、观察周期、决策标准、是否回滚”，并要求拥挤时切换到不同产品域和决策动作。

### 验证结果
- TDD 红灯：新增测试先复现截图同质题簇下仍会选到 `risk-release/上线判断`，以及 `/api/train` 未合并前端当前题。
- `node --test src/lib/training/question-bank.test.mjs src/app/api/train/route.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/train/route.ts src/app/api/train/route.test.mjs src/components/training/TrainingSessionClient.tsx src/lib/training/question-bank.ts src/lib/training/question-bank.test.mjs --max-warnings 0` 通过（仅 ESLint 9 eslintrc 迁移提示）。
- `npm run build` 通过。
- `git diff --check` 通过。
- 模拟用户截图中的同质题簇后，下一颗战略思维种子切换为 `seed-tradeoff-03 / architecture-payoff / 架构投入 / 长期投入`，不再继续 SaaS 免费付费或上线回滚骨架。

## [2026-06-26] Refactor: 日常训练从维度直出改为高阶产品任务驱动

### 背景判断
- 用户连续截图验证后，确认“同维度换靶点”和题库 seed 仍不能根治换皮感。
- 根因上移到架构层：五维画像标签过早参与题面生成，尤其战略/商业/数据三类能力在真实工作中高度耦合，强行拆维度会把题目压回相似骨架。
- 本轮保留训练页视觉、为什么练这题、思考框架和提交后反馈，但把出题入口从“维度优先”改为“国内高阶产品真实任务优先”。

### 完成内容
- 新增 `src/lib/training/training-missions.ts`：国内高阶产品任务池，覆盖增长诊断、商业化取舍、项目推进与资源冲突、平台/中台抽象、数据经营分析、行业与供给侧约束、组织影响与协同推进等任务类型。
- `TrainingSessionClient` 改用 `getDailyTrainingMissionPlan` 和 `getNextTrainingMission`；“换一题”会替换当前题槽的 mission，跨任务类型切换，而不是只在同一维度里换靶点。
- `/api/train` 接收 `missionId`，以 mission 为主组织 prompt；维度和靶点只作为页面标签与评估归因，不再直接决定题面。
- `question-bank.ts` 支持 missionTaskType/productDomains 参与 seed 评分，降低单一维度池对题目的锁定。
- `/api/training/questions` 保存 `missionId/dimension/targetId/targetLabel`，刷新或恢复当天训练时不丢任务语义。
- `getMissionPlanWithCachedQuestions` 会把当天缓存里的替换 mission 恢复进当前训练计划，避免用户换题后刷新又退回默认任务序列。

### 验证结果
- TDD 红灯：新增 mission plan、训练页 mission 使用、route prompt mission 主导、题目缓存 mission 元数据测试，均先捕获旧实现问题。
- `node --test src/lib/training/session-progress.test.mjs src/lib/training/training-missions.test.mjs src/components/training/TrainingSessionClient.test.mjs src/app/api/train/route.test.mjs src/app/api/training/questions/route.test.mjs src/lib/training/question-bank.test.mjs src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/completion.test.mjs` 通过，41 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint ... --max-warnings 0` 针对性通过（仅 ESLint 9 eslintrc 迁移提示）。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-26] Tweak: 训练题去考试腔与前台任务标签

### 背景判断
- 用户更新后截图显示题目质量已明显提升，但前两题第一标签仍是“系统设计能力”，前台感知上像旧五维度还在主导。
- 题干里出现“请运用质量交付框架 / 流程效率框架”等表达，容易从真实工作题退回考试题。
- 当前题目已经有较好的业务真实感，因此本轮只做窄幅微调，不重写架构、不改变训练页布局。

### 完成内容
- `TrainingMission` 增加 `displayLabel`，题卡第一标签改为任务标签，例如“质量发布”“流程自动化”“生态规则”“AI落地”；旧五维度仍保留用于后台记录、评分和画像归因。
- `/api/train` prompt 明确要求框架只用于内部构思，不要在题干中写“请运用XX框架”或“请结合XX框架”。
- 出题 prompt 增加题面外形轮换要求：冲突对话、数据异动、老板指令、客户投诉、评审会争议、上线事故、运营反馈、销售承诺、一线工单等，避免形成新的固定模板。

### 验证结果
- TDD 红灯：新增测试先捕获缺少 `displayLabel`、题卡仍可能显示旧维度、prompt 未禁止考试腔和未要求题面外形轮换。
- `node --test src/lib/training/session-progress.test.mjs src/lib/training/training-missions.test.mjs src/components/training/TrainingSessionClient.test.mjs src/app/api/train/route.test.mjs src/app/api/training/questions/route.test.mjs src/lib/training/question-bank.test.mjs src/lib/training/dimension-strategy.test.mjs src/lib/training/personalization.test.mjs src/lib/training/completion.test.mjs` 通过，45 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/training/training-missions.ts src/lib/training/training-missions.test.mjs src/components/training/TrainingSessionClient.tsx src/components/training/TrainingSessionClient.test.mjs src/app/api/train/route.ts src/app/api/train/route.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-27] Redesign: 首页改为任务驱动训练调度台

### 背景判断
- 训练出题已经从旧五维度直出重构为高阶产品任务驱动，但首页仍以“能力画像 / 维度训练表现”为中心。
- 这会让用户继续认为训练由“战略思维、数据决策、商业思维”等抽象维度主导，和当前任务驱动出题内核不一致。
- 用户明确允许较大幅重构首页，并要求别把当前训练质量改烂。

### 完成内容
- 新增 `src/lib/dashboard/training-command-center.ts`，从现有 `training_records`、诊断短板和 mission 池推导首页 command center，不改 DB schema。
- `/api/dashboard` 返回 `commandCenter`：今日主任务、训练闭环入口、任务地图、最近盲区、下一轮刻意练习建议；保留 `nextActions` 兼容旧调用。
- `/dashboard` 首屏改为“今日训练调度”，展示任务标签和微动作标签，例如“增长诊断 / 分层归因”，并保留推荐依据。
- 新增“训练任务地图”，展示增长诊断、商业化、资源排期、平台抽象、经营分析、行业约束、协同推进、需求重构、质量发布、流程自动化、生态规则、AI落地等任务簇。
- 新增“最近暴露的问题”和“训练方法”模块，把首页叙事从五维画像切换到任务、动作、反馈、归因闭环。
- 修正 mission 微动作标签，避免“增长诊断 / 增长诊断”“平台抽象 / 平台抽象”等重复标签。

### 验证结果
- TDD 红灯：新增 `training-command-center.test.mjs` 先捕获 command center 缺失；新增 mission 测试先捕获 displayLabel/label 重复。
- `node --test src/lib/dashboard/training-command-center.test.mjs src/lib/dashboard/trend.test.mjs src/lib/training/training-missions.test.mjs src/components/training/TrainingSessionClient.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' src/app/api/dashboard/route.ts src/lib/dashboard/training-command-center.ts src/lib/dashboard/training-command-center.test.mjs src/lib/training/training-missions.ts src/lib/training/training-missions.test.mjs --max-warnings 0` 通过。

## [2026-06-27] Fix: 首页卡片间距微调

### 背景判断
- 用户反馈新版首页登录态下卡片之间的间隔有样式问题。
- 浏览器控制技能打开线上 `/dashboard` 时当前会话未登录，被重定向到 `/login`，无法直接看到登录态数据态；但静态代码审查发现新版 dashboard 大量使用 `space-y-4`、`gap-2`、`gap-4`，任务地图 12 个卡片在宽屏下使用 6 列，整体节奏偏挤。
- 用户随后提供截图并要求使用 Kimi WebBridge 查看真实浏览器页面。Kimi 截图确认主要问题不是单纯 gap，而是第一组 12 栅格中三列高度不等，下一组能力画像必须等最高列结束才开始，导致左侧出现大块空白。

### 完成内容
- `/dashboard` 主页面模块间距从 16px 提升到 20px，关键 12 栅格 gap 从 16px 提升到 20px。
- 顶部行动卡、训练闭环、任务地图、最近盲区和训练方法模块内距统一放大。
- 任务地图从宽屏 6 列改为 4 列，卡片间距和卡片内距同步增加，避免任务标签挤成密集表格。
- KPI 卡片增加竖向内距，让顶部四个指标不再贴边。
- 下半区从“两段 12 栅格分行”改为“三列各自纵向堆叠”：左列最近暴露的问题 + 能力画像，中列成长趋势 + 维度训练表现，右列最近诊断；训练方法独立整行，消除左侧大空白。

### 验证结果
- Kimi WebBridge 健康检查通过，真实浏览器截图确认线上旧版空白问题位置。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' --max-warnings 0` 通过。
- `npm run build` 通过。

## [2026-06-27] Redesign: 首页下半区重排为复盘工作区

### 背景判断
- 用户认可空白已消失，但认为“按列堆叠”的解决方式不够好，允许重新设计或排版。
- 这次不继续局部补洞，而是把首页中后段重新组织成更自然的训练路径：任务调度 → 任务地图 → 复盘工作区 → 画像侧栏。

### 完成内容
- 新增 `ReviewWorkspace` 局部组件：左侧主区域合并“最近暴露的问题、成长趋势、维度训练表现”，形成连续复盘工作区。
- 右侧侧栏承载“能力画像”和“最近诊断”，让画像承担解释和归因，不再和复盘卡片抢主路径。
- 训练方法抽成独立 `TrainingMethodPanel`，放在复盘工作区下方，避免卡片墙式堆叠。
- 任务地图从 12 个完整大卡片网格收敛为优先展示 7 个任务 + 更多任务提示，刚好形成两行四列，降低页面高度和信息噪声。

### 验证结果
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' --max-warnings 0` 通过。
- `npm run build` 通过。

## [2026-06-27] Redesign: 首页首屏与任务地图重新排版

### 背景判断
- 用户反馈“解决了但方案不太好”，允许重新设计或排版，并要求部署上线后检查样式。
- Kimi WebBridge 真实浏览器截图确认线上页面仍像一组横向铺满的大卡片：KPI 独立成排、任务地图是卡片墙，信息层级不够像“今天要练什么”。
- 本轮继续保留任务驱动训练方向，不改后端、不改训练出题质量链路，只重排 dashboard 信息架构。

### 完成内容
- 首屏取消独立 KPI 大卡段，将“今日训练、连续天数、累计完成、最近诊断”合入今日训练调度面板。
- 训练闭环改为右侧紧凑行动区，并保留后台归因、近次均分、案例推演和下一轮建议。
- 任务地图从 8 格卡片墙改为“左侧优先任务 + 右侧今日任务轨道”，更接近训练调度台，而不是后台配置列表。
- 复盘工作区、能力画像和最近诊断沿用上一版结构，保持设计和下方引导不被打散。

### 验证结果
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。
- `./init.sh` 通过。

## [2026-06-27] Redesign: 首页改为训练桌面

### 背景判断
- 用户点名使用 Product Design 插件能力并反馈“还是不太行”，说明问题已经不是样式间距，而是首页产品模型仍像信息卡片集合。
- 本轮重新定义首页职责：不是展示所有状态，而是让用户一进来完成“知道今天练什么、为什么练、从哪里开始、练完看什么”的训练闭环。
- 保留训练出题和任务驱动架构，不改后端、不改 DB schema，只重排 dashboard 前端信息架构。

### 完成内容
- 首屏改为统一的“今日训练台”：顶部是日期和开始训练，主体左侧是本轮任务，右侧是选择依据，右栏是训练闭环入口。
- 指标条保留但降级为训练台内的辅助状态，不再独立抢占首屏。
- 任务地图降级为紧凑“今日任务轨道”，展示主任务 + 相邻任务 + 今日题组入口，避免像第二个首页。
- 加载骨架按新版结构调整，减少旧四 KPI 骨架造成的布局闪烁。

### 验证结果
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-27] Redesign: 首页首屏降噪为单一训练入口

### 背景判断
- 用户继续反馈首页“没有重点”“信息密度有点高，信息权重不清晰”，并明确指出“后续任务的意义不大”。
- Product Design 路由审查后确认：首屏同时展示任务、依据、训练闭环、统计、后续任务轨道，会让用户把首页理解成控制台，而不是今天的训练入口。
- 本轮不改后端、不改训练题生成、不改 DB schema，只把 dashboard 首屏的信息权重重新压到一个动作。

### 完成内容
- 首屏改为单一任务入口：最大标题从任务分类转为“先练：具体微动作”，例如“先练：分层归因”。
- 删除右侧“为什么先练这个 / 练完看这里 / 下一轮建议”复合侧栏，推荐依据收敛为 CTA 旁一句轻量文字。
- 删除“后续任务 / 今日任务轨道”整块，避免在用户开练前制造待办压力。
- KPI 从四个小卡片降级为一行极弱状态文字，仅保留今日题数、连击、累计、诊断。
- 保留下方训练复盘、能力画像、最近诊断和训练方法，作为练完后再看的解释层。

### 验证结果
- Kimi WebBridge 本地生产构建截图确认首屏只显示重点动作、场景标签、说明、主 CTA 和轻量状态；后续任务不再出现。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-06-27] Tweak: 首页 hero 卡片高度收敛

### 背景判断
- 用户反馈首页首屏 hero 卡片太大，希望收一点高度。
- 本轮只调整 dashboard hero 的视觉尺寸，不改变信息结构、训练入口、训练题生成或后端逻辑。

### 完成内容
- hero 最小高度从 480px 收敛到 380px。
- 首屏内距从 `sm:p-8 xl:p-10` 收到 `sm:p-7 xl:p-8`。
- 标题字号从桌面 60px 收到 54px，移动/中屏同步略收。
- 标题区、场景标签、说明、CTA 和状态行之间的垂直间距整体压紧。

### 验证结果
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。

## [2026-07-07] Redesign: 产品入口改为双结果路径

### 背景判断
- 当前产品目标同时包含“高级产品思维训练”和“面试跳槽快速强化”，但旧首页仍偏单一今日训练入口，导航也仍像诊断、训练、特训的模块列表。
- 从第一性原理看，用户先关心结果路径：我要冲面试，还是长期练判断。诊断、训练、案例和特训应该服务路径，而不是让用户自己理解模块关系。

### 完成内容
- `/api/dashboard` 增加读取 `bootcamp_sessions`，把简历解析、特训 Day、弱点数量与训练记录、诊断报告一起汇总进 `commandCenter.productPaths`。
- `buildCommandCenter` 新增两条产品路径：`面试跳槽冲刺` 和 `高级产品思维训练`，分别给出状态、证据沉淀和下一步动作。
- `/dashboard` 首屏从“今日只做一件事”改为双路径选择，用户可以直接进入简历/模拟面试路径或今日真实任务训练路径。
- `TopNav` 从模块名改成结果导向：工作台、今日训练、面试冲刺、能力诊断。
- 设计文档补充 2026-07 产品路径调整，明确底层模块继续存在，前台改按结果路径组织。

### 验证结果
- TDD 红灯：新增测试先捕获 `productPaths` 缺失、首页仍是单一模块入口、导航仍使用“训练 / 特训 / 诊断”旧模块名。
- `node --test src/lib/dashboard/training-command-center.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/components/TopNav.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/dashboard/page.tsx' src/app/api/dashboard/route.ts src/lib/dashboard/training-command-center.ts src/lib/dashboard/training-command-center.test.mjs src/components/TopNav.tsx src/components/TopNav.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-07] Feature: 面试项目故事库

### 背景判断
- 双路径首页已经把用户导向“面试跳槽冲刺”，但冲刺路径还缺一个真正可沉淀的资产层。
- 高级 PM 面试的核心不是刷题数量，而是把真实项目讲成“背景、判断、取舍、结果、复盘”的证据链。

### 完成内容
- 新增 `src/lib/bootcamp/story-bank.ts`，从已落库的简历项目和模拟面试记录聚合项目故事。
- 新增 `GET /api/bootcamp/story-bank`，读取 `bootcamp_sessions.parsed_profile`、`weakness_prediction` 和 `bootcamp_interviews.user_answer/ai_evaluation`，返回故事库数据；不新增 schema。
- 新增 `/bootcamp/story-bank` 页面：左侧项目资产列表，右侧展示项目描述、结果证据、证据缺口、可讲版本、面试证据和可能追问。
- Dashboard 面试路径在已有简历/特训进度时改指向故事库；`/bootcamp` 特训首页新增项目故事库入口。
- 产品设计文档补充“项目故事库”作为面试冲刺路径的资产层。

### 验证结果
- TDD 红灯：新增 story-bank 领域测试、API 源测试、页面源测试、特训首页入口测试，均先捕获缺失实现。
- `node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs' 'src/app/(app)/bootcamp/page.test.mjs' src/lib/dashboard/training-command-center.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/components/TopNav.test.mjs` 通过。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/bootcamp/story-bank.ts src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.ts src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.tsx' 'src/app/(app)/bootcamp/story-bank/page.test.mjs' 'src/app/(app)/bootcamp/page.tsx' 'src/app/(app)/bootcamp/page.test.mjs' src/lib/dashboard/training-command-center.ts src/lib/dashboard/training-command-center.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过，新增 `/bootcamp/story-bank` 和 `/api/bootcamp/story-bank` 路由出现在构建结果中。
- `git diff --check` 通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-07] Feature: 项目故事库可编辑证据

### 背景判断
- 故事库第一版已经能从简历和模拟面试记录聚合证据，但用户还不能直接补齐“角色、项目描述、结果指标”这些面试最关键材料。
- 按当前项目规则，避免新增 schema；本轮把补充内容写回现有 `bootcamp_sessions.parsed_profile`，保证前后端与持久化闭环成立。

### 完成内容
- `src/lib/bootcamp/story-bank.ts` 新增 `updateParsedProfileProject`，按项目名更新 `role/description/outcomes`，不影响其他项目。
- `PATCH /api/bootcamp/story-bank` 接收项目证据补充，更新 `bootcamp_sessions.parsed_profile` 后重新聚合并返回故事库。
- `/bootcamp/story-bank` 项目详情右侧新增“补项目证据”表单，可编辑我的角色、项目描述、结果指标并保存。
- 设计文档和 feature_list 同步标记故事库支持可编辑、可持久化。

### 验证结果
- TDD 红灯：新增领域测试先捕获缺少更新函数；API 测试先捕获缺少 PATCH；页面测试先捕获缺少保存交互。
- `node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs' 'src/app/(app)/bootcamp/page.test.mjs' src/lib/dashboard/training-command-center.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/components/TopNav.test.mjs` 通过，14 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/bootcamp/story-bank.ts src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.ts src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.tsx' 'src/app/(app)/bootcamp/story-bank/page.test.mjs' 'src/app/(app)/bootcamp/page.tsx' 'src/app/(app)/bootcamp/page.test.mjs' src/lib/dashboard/training-command-center.ts src/lib/dashboard/training-command-center.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过。
- `git diff --check` 通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-07] Feature: 项目故事库 2 分钟讲述稿

### 背景判断
- 故事库已经能补充项目证据，但用户真正上面试时还需要一段可复述的结构化讲述稿。
- 本轮继续不新增 schema，直接从项目描述、个人角色、结果指标和高质量 AI 改写派生讲述稿。

### 完成内容
- `ProjectStory` 增加 `interviewScript`，包含开场定位、我的角色、关键判断、结果证据、复盘升级和 `fullScript`。
- `buildStoryBank` 为每个项目自动生成 2 分钟讲述稿；优先使用该项目的高分 AI 改写作为关键判断部分。
- `/bootcamp/story-bank` 在“可讲版本”下方新增“2 分钟讲述稿”模块，按段落展示并提供“复制讲述稿”按钮。
- 产品设计文档和 feature_list 同步记录讲述稿能力。

### 验证结果
- TDD 红灯：领域测试先捕获 `interviewScript` 缺失；页面测试先捕获“2 分钟讲述稿 / 复制讲述稿 / clipboard”缺失。
- `node --test src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs' 'src/app/(app)/bootcamp/page.test.mjs' src/lib/dashboard/training-command-center.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/components/TopNav.test.mjs` 通过，15 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/bootcamp/story-bank.ts src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.ts src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.tsx' 'src/app/(app)/bootcamp/story-bank/page.test.mjs' 'src/app/(app)/bootcamp/page.tsx' 'src/app/(app)/bootcamp/page.test.mjs' src/lib/dashboard/training-command-center.ts src/lib/dashboard/training-command-center.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过，新增讲述稿 UI 与故事库 API 构建成功。
- `git diff --check` 通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-07] Feature: 用户画像引擎 — 能力证据账本

### 背景判断
- 当前工作台已经按“面试跳槽冲刺 / 高级产品思维训练”组织路径，但画像仍主要是侧栏里的维度分展示，用户很难看出诊断、训练和面试追问如何共同更新自己的能力状态。
- 从第一性原理看，升阶训练的核心资产不是一次分数，而是可追踪的证据账本：我在哪些维度有证据、哪些维度暴露弱点、下一步该补什么。

### 完成内容
- 新增 `src/lib/profile/growth-profile.ts`，把诊断维度分、训练记录、特训面试回答/评价和成长快照聚合为 `growthProfile`。
- 新增 `GET /api/profile/summary`，从 `diagnosis_reports.dimension_scores`、`training_records`、`bootcamp_interviews` 和 `growth_snapshots` 读取画像证据。
- 新增 `POST /api/profile/summary`，把当前画像维度分、综合分和证据数写入既有 `growth_snapshots`，形成可读回的画像快照；不新增 schema。
- `/api/dashboard` 同步返回 `growthProfile`，Dashboard 新增“能力证据账本”，展示综合画像、证据数、快照数、面试就绪、当前焦点、最弱维度和五维证据。
- 产品设计文档和 feature_list 同步标记 `profile-001` 完成。

### 验证结果
- TDD 红灯：新增画像聚合测试、画像 API 源测试、Dashboard 源测试和 feature_list 状态测试，先捕获缺少画像引擎、缺少 API、Dashboard 无证据账本、profile-001 未完成。
- `node --test src/lib/profile/growth-profile.test.mjs src/app/api/profile/summary/route.test.mjs feature_list.test.mjs src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs' 'src/app/(app)/bootcamp/page.test.mjs' src/lib/dashboard/training-command-center.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/components/TopNav.test.mjs` 通过，20 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/profile/growth-profile.ts src/lib/profile/growth-profile.test.mjs src/app/api/profile/summary/route.ts src/app/api/profile/summary/route.test.mjs 'src/app/(app)/dashboard/page.tsx' 'src/app/(app)/dashboard/page.test.mjs' feature_list.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过，新增 `/api/profile/summary` 路由出现在构建结果中。
- `git diff --check` 通过。
- `feature_list.json` JSON 解析通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-08] Feature: 项目证据处方

### 背景判断
- Dashboard 已能读回已入账项目资产，但推荐引擎仍然把面试建议写成“整理可复述项目证据”这类泛动作。
- 从第一性原理看，真正有用的面试冲刺处方应该点名某个项目和当前缺口：例如“客户健康度评分系统还缺续费归因反证”，这样用户下一步才知道补哪段证据。

### 完成内容
- `buildRecommendationPlan` 在 `growthProfile.storyAssets` 存在时，优先用最近项目故事包生成 interview 类型处方。
- 项目证据处方包含项目名、首个 `proofGaps` 缺口、成熟度证据标签，并指向 `/bootcamp/story-bank`。
- Dashboard 训练处方说明补充“项目证据处方”，让用户理解项目故事包入账后会直接影响推荐。
- `/api/profile/recommendation` 源测试确认读取 `growth_snapshots.dimension_scores`，确保推荐 API 能拿到故事资产来源。
- 产品设计文档和 `feature_list.json` 同步记录这条“已入账资产 → 证据缺口 → 下一步处方”的闭环。

### 验证结果
- TDD 红灯：新增 recommendation 领域测试、推荐 API 源测试和 Dashboard 文案测试，先捕获仍返回泛面试建议、缺少项目证据处方文案等问题。
- `node --test src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 通过，9 项。
- `node --test src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs' feature_list.test.mjs` 通过，11 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/profile/recommendation.ts src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.ts src/app/api/profile/recommendation/route.test.mjs 'src/app/(app)/dashboard/page.tsx' 'src/app/(app)/dashboard/page.test.mjs' feature_list.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过，`/api/profile/recommendation` 和 `/dashboard` 构建正常。
- `git diff --check` 通过。
- `feature_list.json` JSON 解析通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-08] Feature: 已入账项目资产读回

### 背景判断
- 项目故事包已经能写入 `growth_snapshots.dimension_scores.__trigger.projectStory`，但 Dashboard/画像聚合只读取快照计数，没有把可讲项目资产展示出来。
- 从第一性原理看，面试跳槽强化需要用户持续看到“我已经有哪些可复用证据资产”，否则保存动作只是心理安慰，不会影响下一步补证据。

### 完成内容
- `buildGrowthProfile` 新增 `storyAssets`，从 `project_story_saved` 快照读回项目名、公司、角色、成熟度、证据缺口和讲述稿预览。
- `/api/profile/summary` 与 `/api/dashboard` 的 `growth_snapshots` 查询增加 `dimension_scores`，让画像和 Dashboard 都能读回已入账项目资产。
- Dashboard 能力证据账本的面试就绪侧栏新增“已入账项目资产”，展示最新项目故事包、成熟度、首个证据缺口，并链接回 `/bootcamp/story-bank`。
- 产品设计文档和 `feature_list.json` 同步记录项目故事包读回链路。

### 验证结果
- TDD 红灯：新增 storyAssets 领域测试、Dashboard/API 源测试，先捕获缺少 `storyAssets`、缺少 `dimension_scores` select 和 Dashboard 缺少“已入账项目资产”。
- `node --test src/lib/profile/growth-profile.test.mjs src/app/api/profile/summary/route.test.mjs src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs'` 通过，15 项。
- `node --test src/lib/profile/growth-profile.test.mjs src/app/api/profile/summary/route.test.mjs src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.test.mjs' feature_list.test.mjs` 通过，17 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/profile/growth-profile.ts src/lib/profile/growth-profile.test.mjs src/app/api/profile/summary/route.ts src/app/api/profile/summary/route.test.mjs src/app/api/dashboard/route.ts src/app/api/dashboard/route.test.mjs 'src/app/(app)/dashboard/page.tsx' 'src/app/(app)/dashboard/page.test.mjs' feature_list.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过，`/api/dashboard`、`/api/profile/summary` 和 `/dashboard` 构建正常。
- `git diff --check` 通过。
- `feature_list.json` JSON 解析通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-08] Feature: 项目故事包入账

### 背景判断
- 项目故事库已经能把简历项目、模拟追问和日常训练表达资产组织成可讲版本，但它仍然主要停留在故事库页面。
- 从第一性原理看，面试跳槽强化的关键是“可讲项目资产”也进入画像证据账本，这样后续推荐才能知道用户已经具备某个项目故事，而不是反复要求补同类材料。

### 完成内容
- `/api/profile/summary` 的 `POST` 支持 `trigger=project_story_saved`，把项目名、公司、角色、成熟度、证据缺口和 2 分钟讲述稿摘要写入 `growth_snapshots.dimension_scores.__trigger.projectStory`。
- `/bootcamp/story-bank` 项目详情新增“沉淀到画像账本”动作，调用既有画像快照 API，不新增 schema。
- 切换项目会重置故事包入账状态，避免用户误以为另一个项目也已入账。
- 产品设计文档和 `feature_list.json` 同步记录项目故事包进入画像证据链。

### 验证结果
- TDD 红灯：新增 profile summary API 源测试和故事库页面源测试，先捕获缺少 `project_story_saved/projectStory`、缺少 `handleSaveProjectStoryPack` 和“故事包已入账”反馈。
- `node --test src/app/api/profile/summary/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs' src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs feature_list.test.mjs` 通过，20 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/bootcamp/story-bank/page.tsx' 'src/app/(app)/bootcamp/story-bank/page.test.mjs' src/app/api/profile/summary/route.ts src/app/api/profile/summary/route.test.mjs src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs feature_list.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过，`/bootcamp/story-bank` 构建体积更新为 6.28 kB。
- `git diff --check` 通过。
- `feature_list.json` JSON 解析通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-07] Feature: 用户画像引擎 — 个性化训练处方

### 背景判断
- 画像证据账本已经能说明“我现在是什么状态”，但用户还需要系统把状态翻译成下一步行动。
- 从第一性原理看，推荐不是一个泛泛 CTA，而是基于证据的处方：今天练什么、面试补哪类证据、最近反馈如何复盘。

### 完成内容
- 新增 `src/lib/profile/recommendation.ts`，基于 `growthProfile` 的最弱维度、面试就绪度、证据数和当前焦点生成三条处方：训练、面试、复盘。
- 新增 `GET /api/profile/recommendation`，从 `diagnosis_reports`、`training_records`、`bootcamp_interviews`、`growth_snapshots` 构建推荐计划。
- 新增 `POST /api/profile/recommendation`，用户选择推荐后写入 `growth_snapshots.dimension_scores.__recommendation`，形成可读回的处方快照；不新增 schema。
- `/api/dashboard` 返回 `recommendationPlan`，Dashboard 新增“训练处方”模块，支持“设为本周处方”并调用推荐 API 持久化。
- 产品设计文档和 feature_list 同步标记 `profile-002` 完成。

### 验证结果
- TDD 红灯：新增推荐引擎测试、推荐 API 源测试、Dashboard 源测试和 feature_list 状态测试，先捕获缺少推荐引擎、缺少 API、Dashboard 无训练处方、profile-002 未完成。
- `node --test src/lib/profile/growth-profile.test.mjs src/lib/profile/recommendation.test.mjs src/app/api/profile/summary/route.test.mjs src/app/api/profile/recommendation/route.test.mjs feature_list.test.mjs src/lib/bootcamp/story-bank.test.mjs src/app/api/bootcamp/story-bank/route.test.mjs 'src/app/(app)/bootcamp/story-bank/page.test.mjs' 'src/app/(app)/bootcamp/page.test.mjs' src/lib/dashboard/training-command-center.test.mjs 'src/app/(app)/dashboard/page.test.mjs' src/components/TopNav.test.mjs` 通过，25 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/profile/recommendation.ts src/lib/profile/recommendation.test.mjs src/app/api/profile/recommendation/route.ts src/app/api/profile/recommendation/route.test.mjs 'src/app/(app)/dashboard/page.tsx' 'src/app/(app)/dashboard/page.test.mjs' feature_list.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过，新增 `/api/profile/recommendation` 路由出现在构建结果中。
- `git diff --check` 通过。
- `feature_list.json` JSON 解析通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-07] Feature: 处方驱动训练闭环

### 背景判断
- 推荐处方如果只是一个跳转按钮，用户仍然要在训练页重新解释自己该练什么，画像闭环会断掉。
- 本轮把 Dashboard 的 `focus` 直接接入训练页、出题 API 和当天题目缓存，让“画像推荐 → 今日训练 → 题目落库”形成同一条链路。

### 完成内容
- 新增 `getTrainingMissionForProfileFocus`，把 `strategic_thinking/system_design/data_decision/user_insight/commercial_thinking` 映射到具体高阶 PM mission。
- `/training/session?focus=...` 会优先使用处方 mission 出题，并显示“处方训练”提示。
- `/api/train` 支持 `profileFocus` 兜底选 mission，prompt 明示训练处方聚焦。
- `/api/training/questions` 将 `profileFocus/prescriptionId` 与题目缓存一起保存，刷新后可读回。
- 设计文档和 `feature_list.json` 同步记录训练处方闭环。

### 验证结果
- TDD 红灯：新增 mission focus 映射、训练页处方 focus、出题 API profileFocus、题目缓存元数据测试，先确认缺失实现会失败。
- `node --test src/lib/training/training-missions.test.mjs src/lib/training/session-progress.test.mjs src/app/api/train/route.test.mjs src/app/api/training/questions/route.test.mjs` 通过，23 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/lib/training/training-missions.ts src/lib/training/training-missions.test.mjs src/lib/training/session-progress.test.mjs src/app/api/train/route.ts src/app/api/train/route.test.mjs src/app/api/training/questions/route.ts src/app/api/training/questions/route.test.mjs src/components/training/TrainingSessionClient.tsx --max-warnings 0` 通过。
- `npm run build` 通过，`/training/session` 保持动态路由。
- `git diff --check` 通过。
- `feature_list.json` JSON 解析通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-08] Feature: 面试冲刺作战台

### 背景判断
- 用户目标不是“进入特训模块”，而是在跳槽前快速把简历项目、模拟追问和日常训练回答转成可复述的面试证据。
- 因此 `/bootcamp` 应该承担作战台职责：告诉用户当前冲刺状态、资产缺口、下一步最该做什么，而不是只展示 Day 0/Day 1-3/报告入口。

### 完成内容
- 新增 `buildBootcampHub`，聚合 `bootcamp_sessions`、`bootcamp_interviews` 和 `training_records`，输出 `sprintBrief`、`assetPipeline`、`nextActions`。
- 新增 `GET /api/bootcamp/hub`，登录后从 Supabase 读回简历项目、面试评价和最近训练记录，不新增 schema。
- `/bootcamp` 移除客户端 Supabase 直连，改为请求 `/api/bootcamp/hub`；页面重构为“面试冲刺作战台”，展示简历项目、项目故事、模拟追问、训练表达资产四段证据生产线。
- `feature_list.json` 和产品设计文档同步记录作战台改造。

### 验证结果
- TDD 红灯：新增 hub 领域测试、API 源测试和页面源测试，先捕获缺少 `/api/bootcamp/hub`、缺少 API 聚合、页面仍旧客户端直连 Supabase 等问题。
- `node --test src/lib/bootcamp/hub.test.mjs src/app/api/bootcamp/hub/route.test.mjs 'src/app/(app)/bootcamp/page.test.mjs'` 通过，4 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint 'src/app/(app)/bootcamp/page.tsx' 'src/app/(app)/bootcamp/page.test.mjs' src/app/api/bootcamp/hub/route.ts src/app/api/bootcamp/hub/route.test.mjs src/lib/bootcamp/hub.ts src/lib/bootcamp/hub.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过，新增 `/api/bootcamp/hub` 路由出现在构建结果中。
- `git diff --check` 通过。
- `feature_list.json` JSON 解析通过。
- `./init.sh` 通过，环境健康检查 10/10。

## [2026-07-07] Feature: 训练反馈自动更新画像

### 背景判断
- 上一轮已经把 Dashboard 处方带进训练页，但用户提交答案后，AI 反馈仍然主要停留在训练记录里。
- 从第一性原理看，产品思维提升的关键闭环是：一次回答产生证据，证据更新画像，画像再驱动下一次处方。

### 完成内容
- `/api/profile/summary` 的 `POST` 支持接收 `trigger=training_feedback`、`trainingRecordId`、`dimension`、`missionId` 和 `score`。
- 画像快照继续写入既有 `growth_snapshots`，并把触发元数据保存到 `dimension_scores.__trigger`，不新增 schema。
- `/training/session` 在 AI 分析完成并写入 `training_records` 后，自动调用 `POST /api/profile/summary` 创建画像快照。
- 反馈页新增画像同步状态：画像更新中、画像已更新、画像更新失败。

### 验证结果
- TDD 红灯：新增 profile summary API 源测试和训练页源测试，先捕获缺少 `training_feedback/__trigger`、缺少 `/api/profile/summary` 调用和缺少“画像已更新”状态。
- `node --test src/app/api/profile/summary/route.test.mjs src/lib/training/session-progress.test.mjs` 通过，11 项。
- `node --test src/app/api/profile/summary/route.test.mjs src/lib/training/session-progress.test.mjs src/lib/training/training-missions.test.mjs src/app/api/train/route.test.mjs src/app/api/training/questions/route.test.mjs feature_list.test.mjs` 通过，29 项。
- `npx tsc --noEmit` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/app/api/profile/summary/route.ts src/app/api/profile/summary/route.test.mjs src/components/training/TrainingSessionClient.tsx src/lib/training/session-progress.test.mjs feature_list.test.mjs --max-warnings 0` 通过。
- `npm run build` 通过，`/training/session` 保持动态路由。
- `git diff --check` 通过。
- `feature_list.json` JSON 解析通过。
- `./init.sh` 通过，环境健康检查 10/10。
