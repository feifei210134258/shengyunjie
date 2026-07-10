# 产品升云阶 - 设计文档

## 概述

一个 Web 应用工具，帮助产品经理从执行层向高级 PM（B端方向）跃迁。核心思路：深度诊断当前水平 → 针对性训练 → 持续成长追踪。

## 系统架构

```
用户入口
  └── AI 教练引擎（核心调度）
        ├── 诊断模块
        ├── 日常训练模块（题库 + 案例库）
        ├── 特训冲刺模块
        └── 用户画像（数据中枢）
```

**数据流闭环**：诊断 → 画像 → 训练推荐 → 答题反馈 → 画像更新 → 更精准推荐。

## 2026-07 产品路径调整

前台从“诊断 / 训练 / 案例 / 特训”的模块并列，调整为两条结果路径：

1. **面试跳槽冲刺**：围绕简历项目、追问风险、模拟面试和回答改写，帮助用户把真实经历整理成高级 PM 面试证据。
2. **高级产品思维训练**：围绕真实业务任务、微动作训练、AI 反馈和复盘归因，帮助用户长期提升判断、取舍、归因和落地能力。

诊断、训练、案例和特训继续作为底层能力模块存在，但首页与导航优先呈现用户要达成的结果。`/api/dashboard` 会读取训练记录、诊断报告和特训会话状态，生成两条路径的当前状态、下一步动作和证据沉淀提示。

Dashboard 支持用户把“面试跳槽冲刺”或“高级产品思维训练”设为当前主线。该选择通过 `POST /api/profile/summary` 写入 `growth_snapshots.dimension_scores.__goalFocus`，刷新后由 `/api/dashboard` 读回，并用于重排路径顺序、主行动和下一题处方说明；不新增 schema。

Dashboard 还支持保存更具体的“目标简报”：目标岗位、目标场景和目标期限。前端调用 `POST /api/profile/summary`，`trigger=goal_brief_saved`，写入 `growth_snapshots.dimension_scores.__goalBrief`；`/api/dashboard` 刷新时读回 `latestGoalBrief` 并回填首页输入，让用户的面试/升阶目标不再只停留在抽象主线。

目标简报现在会继续进入后续训练链路：`GET /api/profile/recommendation` 从最近的 `__goalBrief` 读回 `latestGoalBrief`，并传入 `buildRecommendationPlan`，让训练处方和项目证据处方直接围绕目标岗位、目标场景和目标期限表达；`GET /api/training/sessions?date=...` 也会返回 `latestGoalBrief`，训练实战页在顶部展示“目标简报”，新生成题目会把 `goalBrief` 写入 `training_sessions.questions`，刷新后不丢失目标上下文；`/api/train` 的出题和评估 prompt 同时接收目标简报，让题目、反馈、示例回答、面试表达资产和下一题建议都服务同一个结果目标。

---

## 模块一：诊断模块

### 定位
非必须入口，但诊断结论驱动后续训练推荐和特训计划。

### 三阶段混合评估

1. **阶段一：能力量表初筛**（~15分钟）
   - 5 维度 × 5 题 = 25 题自评量表，1-5 分制锚点
   - 维度：战略思维、系统设计能力、数据决策能力、用户洞察与需求管理、商业思维
   - 输出：薄弱项雷达图 + 各维度得分 + 初步定级

2. **阶段二：AI 教练深度访谈**
   - 多轮对话，AI 根据初筛结果深挖薄弱维度
   - 追问具体项目经历，探测真实思维深度
   - 非结构化对话，模拟真实导师辅导

3. **阶段三：案例实战验证**
   - 给出 B 端产品场景题
   - AI 评估解题质量（思维框架、决策逻辑、方案完整度）
   - 验证前两阶段结论

### 输出
综合诊断报告，写入用户画像。包含：各维度等级、强项/弱项、具体改进建议。

---

## 模块二：日常训练模块

### 场景训练题库
- **形式**：自由浏览，按 5 维度筛选
- **交互**：用户作答 → AI 评估反馈（给分 + 点评 + 改进建议）
- **个性化**：诊断薄弱项自动推荐相关题目

### 案例库
- **经典 B 端产品拆解**：AI 动态生成（如 Salesforce、Figma、Notion 等产品的决策复盘）
- **决策推演案例**：AI 动态生成「如果你是 XX PM，遇到 X 问题怎么决策」类思维训练
- **内容策略**：动态按需生成，每次访问都是新鲜内容，无需预置或定时刷新

---

## 模块三：特训冲刺模块

### 定位
3-5 天高强度面试备战，AI 当面试教练

### 流程

**Day 0：简历解析**
- 用户上传简历
- AI 生成简历能力画像 + 面试弱点预测
- 系统把简历项目整理为“项目故事库”，标记每个项目的可讲版本、结果证据、潜在追问和证据缺口

**Day 1-5：每日循环（约 1 小时）**
1. AI 模拟面试（30min）：根据简历动态出题
2. 即时诊断反馈（15min）：指出思路漏洞，给出框架思维纠偏
3. 针对性补充材料推送
4. 回答与 AI 改写自动沉淀回项目故事库，形成可复用的面试证据资产

### AI 面试教练策略
- 根据简历经历动态出题，非模板化
- 追问深挖思路漏洞
- 框架思维诊断与纠偏（帮助建立结构化回答模式）

### 项目故事库
- 从 `bootcamp_sessions.parsed_profile` 读取简历项目，从 `bootcamp_interviews` 读取面试题、用户回答和 AI 评价。
- 按项目聚合面试证据，输出可讲版本、结果证据、证据缺口、可能追问和下一步建议。
- 用户可在故事库内直接补充“我的角色、项目描述、结果指标”，通过 `PATCH /api/bootcamp/story-bank` 写回 `bootcamp_sessions.parsed_profile`。
- 系统基于项目描述、个人角色、结果指标和高质量面试改写，派生“2 分钟讲述稿”，包含开场定位、我的角色、关键判断、结果证据和复盘升级，并支持一键复制。
- 当目标证据已修补并通过追问后，项目故事库会生成“终版面试表达”工作台：基于目标证据、讲述稿和目标简报生成 90 秒表达底稿，用户可编辑后通过 `PATCH /api/bootcamp/story-bank` 写回 `bootcamp_sessions.parsed_profile.projects[].finalInterviewAnswer`，刷新后读回并支持复制；故事包入账时会把 `finalInterviewAnswer` 写入 `growth_snapshots.dimension_scores.__trigger.projectStory`，`buildGrowthProfile` 与 Dashboard 再读回为项目资产里的“终版面试表达”。
- 不新增 schema；第一版使用已落库的简历解析和面试记录派生，确保每次打开页面都能从数据库读回。

### 面试证据库
- `/bootcamp` 是面试跳槽路径的证据库入口，而不是静态模块入口或单纯训练营首页。
- `GET /api/bootcamp/hub` 从 `bootcamp_sessions`、`bootcamp_interviews` 和 `training_records` 读回当前冲刺状态，生成 `sprintBrief`、`assetPipeline`、`evidenceBank` 和 `nextActions`。
- 证据库首屏展示“可讲项目、证据缺口、追问风险、表达资产”，并根据最弱证据链生成“下一步只做这件事”。
- `GET /api/bootcamp/hub` 还会从最近 `growth_snapshots.dimension_scores.__goalBrief` 读回 `latestGoalBrief`；证据库首屏展示“目标证据令”，并把目标岗位、目标场景和目标期限写入主目标、证据缺口说明和下一步动作理由。
- 证据库继续保留简历项目、项目故事、模拟追问、日常训练表达资产四段生产线；已有简历后优先引导补项目证据，而不是继续泛化开新题。
- 页面不直接连接 Supabase；所有状态经 API 聚合后读回，确保特训首页、故事库和日常训练表达资产使用同一套后端事实。

---

## 模块四：用户画像

### 定位
画像数据中枢，UI 展示集成在工作台（Dashboard）中，不设独立页面。

### 数据来源
- 诊断报告（阶段一/二/三）
- 训练答题记录 + AI 评分
- 特训模拟面试记录

### 画像内容
- 各维度能力等级（A/B/C 字母等级）
- 成长曲线（近 6 个月趋势）
- 薄弱项追踪
- 训练完成度（总进度 + 连击天数）
- 能力证据账本：聚合诊断维度分、训练得分、AI 反馈、特训追问评价和成长快照，展示综合画像、证据数、快照数、面试就绪度、最弱维度和下一步补强动作。
- 画像快照：`POST /api/profile/summary` 可把当前聚合结果写入既有 `growth_snapshots` 表；`GET /api/profile/summary` 与 Dashboard 均从 Supabase 读回同一份画像证据，不新增 schema。

### 作用
驱动各模块个性化：训练题推荐、案例推送优先级、特训重点方向。所有模块读写同一张画像表。

### 推荐逻辑
- `buildRecommendationPlan` 基于画像最弱维度、证据数量、面试就绪度和当前焦点生成三条处方：今日训练、项目面试证据、复盘动作。
- `GET /api/profile/recommendation` 从 Supabase 画像证据实时生成处方；`POST /api/profile/recommendation` 把用户选择的处方写入 `growth_snapshots.dimension_scores.__recommendation`，不新增 schema。
- Dashboard 在能力证据账本下方展示“训练处方”，用户可以直接开始训练、进入模拟面试或把某条建议设为本周处方。
- Dashboard 会从最近的 `growth_snapshots.dimension_scores.__recommendation` 读回用户已选的本周处方，刷新后继续高亮对应推荐，并展示“本周处方”执行入口。
- 当画像中已有 `storyAssets` 时，`buildRecommendationPlan` 会优先把最近一个项目故事包的 `targetFit.missingEvidence` 或 `proofGaps` 转成“项目证据处方”，指向 `/bootcamp/story-bank`，让推荐不再泛泛要求整理项目，而是明确补齐某个已入账项目的证据缺口；如果该项目已经有 `targetEvidence` 且缺口为空，推荐会转为“模拟追问验证”，指向 `/bootcamp/interview?focus=target_evidence`，避免证据入账后继续补同一条材料。`GET/POST /api/bootcamp/interview` 会从 `growth_snapshots.dimension_scores.__trigger.projectStory` 读回最近入账目标证据，把它作为 `targetEvidenceFocus` 返回页面，并在出题 prompt 与兜底题里围绕这段证据做归因、取舍、角色价值、协同和可复用机制的高压追问。`POST /api/bootcamp/interview/answer` 在该模式下会要求评分返回 `target_evidence_validation`，写回 `bootcamp_interviews.ai_evaluation`，并把验证结果以 `target_evidence_validated` 快照写入 `growth_snapshots.dimension_scores.__trigger.targetEvidenceValidation`；`buildGrowthProfile` 与 Dashboard 会读回“目标证据验证”，展示抗追问评分和击穿风险。推荐引擎会继续读取 `targetEvidenceValidations`：如果验证暴露 `unresolvedRisks`、状态为弱或分数低于 8，下一步处方回到 `/bootcamp/story-bank` 补击穿点；如果证据已扛住追问，处方转为打包终版面试表达；如果 `storyAssets[].finalInterviewAnswer` 已入账，处方会停止重复打包，转为 `/bootcamp/interview?focus=target_evidence` 的模拟复述，验证临场稳定度。模拟复述评分会额外返回 `final_answer_rehearsal`，并随同一个 `target_evidence_validated` 快照写入 `growth_snapshots.dimension_scores.__trigger.finalAnswerRehearsal`；`buildGrowthProfile` 读回为 `finalAnswerRehearsals`，Dashboard 能力证据账本展示“终版表达复述 / 复述稳定度 / 不稳定点”，推荐引擎会在复述不稳定时继续安排“再练复述”，避免终版表达只被复制而没有临场验证。
- 今日训练处方链接会携带 `focus` 进入 `/training/session`，训练页把画像维度映射为具体高阶 PM 任务（如资源排期、平台抽象、增长诊断），并把 `profileFocus/prescriptionId` 与题目一起写入 `training_sessions.questions`，刷新后可读回。
- 直接进入 `/training/session` 时，`GET /api/training/sessions?date=...` 会读回最近 `growth_snapshots.dimension_scores.__goalFocus` 并返回 `latestGoalFocus`；训练实战页用它恢复主线任务计划和顶部训练框架，避免用户绕过首页后退回默认刷题。
- 训练页作答区会把用户草稿保存到当天 `training_sessions.questions[missionId].draftAnswer`，刷新或重新进入当天训练时恢复答案；提交前展示“判断、依据、取舍、验证”四项作答质检，并在输入区提供可插入的高级 PM 作答骨架（判断、依据、取舍、验证），插入内容仍进入同一份草稿自动保存链路。质检区会把第一个未满足项转成“下一步补齐”动作，用户可一键插入对应起手句，帮助回答从直觉表达拉回结构化表达。
- 训练实战页作答区进一步收束为“答案构建台”：当前最该补的一步被提升到输入区顶部，骨架按钮降级为“写作动作”，提交按钮统一为“提交这一版”，避免用户在文本框、骨架侧栏和质检区之间来回找下一步。
- AI 反馈页提供“二次修正”输入，用户可基于反馈当场重写关键答案；`PATCH /api/training/record` 会把修正内容写入 `training_records.ai_feedback.__revision`，历史复盘页会读回原回答、AI 反馈和用户修正版。
- AI 反馈页会从本次 `evaluation.suggestions` 或 `evaluation.gaps` 提炼“本轮修正指令”，放在二次修正输入上方；用户可一键“带入修正”，把最关键缺口写进修正草稿，再通过既有 `PATCH /api/training/record` 落库，避免反馈只停留在阅读状态。
- AI 反馈页顶部会展示“本轮升级闭环”，把反馈入账、修正版、下一题处方三个状态放在同一轨道里，帮助用户明确本题不是拿到评分就结束，而是要完成修正保存和下一题处方承接。
- AI 反馈页会把闭环里第一个未完成步骤提升为“本轮下一步”主行动：没有修正版时先带入修正指令或保存修正版，修正版已保存后设为本周处方，处方也完成后直接进入下一题；这些动作继续复用既有训练记录、画像处方和下一题流程，不新增 schema。
- 训练首页通过 `/api/training/stats` 读取最近训练记录，生成“复盘队列”：优先展示还没有二次修正的记录，引导用户先把反馈改成能复述的版本，再继续开新题。
- 用户保存二次修正后，前端会再次调用 `POST /api/profile/summary` 创建画像快照，`dimension_scores.__trigger` 标记为 `revision_saved`，把复盘行为纳入能力证据账本。
- 训练页完成 AI 反馈并写入 `training_records` 后，会自动调用 `POST /api/profile/summary` 创建 `growth_snapshots` 快照；快照的 `dimension_scores.__trigger` 标记来源为 `training_feedback`，让下一轮 Dashboard 推荐能读取最新训练证据。
- `/api/train?action=analyze` 会接收训练实战页传入的 `profileFocus`：面试跳槽主线要求 AI 反馈产出 `interview_expression`（开场判断、证据抓手、追问风险、可复述版本），高级产品思维主线要求产出 `thinking_upgrade`（判断质量、取舍质量、归因深度、落地严谨度）。这些结构化字段随 `training_records.ai_feedback` 落库，并在训练反馈面板直接展示。
- 画像快照保存成功后，训练反馈页会立即读取 `GET /api/profile/recommendation`，展示基于新证据生成的“下一轮处方”；用户可直接在反馈页调用 `POST /api/profile/recommendation` 把该处方设为本周处方，形成“反馈 → 画像 → 推荐 → 下一题”的闭环。
- 训练首页的主行动也读取 `GET /api/profile/recommendation`，优先使用画像处方中的训练建议作为开始训练入口，确保二次修正和画像快照能影响下一次打开训练页时练什么。
- `GET /api/profile/recommendation` 会同时返回最近 `growth_snapshots.dimension_scores.__goalFocus`；训练首页据此把主行动框定为“面试跳槽主线”或“高级产品思维主线”，让同一题训练明确服务面试表达资产或高级判断训练。
- 训练首页进一步改为“今日作战台”：首屏把画像处方、目标作战令、作战顺序、复盘队列和能力证据资产串成一条行动链。用户进入后先看到目标岗位/场景/期限，再决定“先复盘、再开题、沉淀证据”，避免训练页退回统计看板或模块入口。
- 训练首页首屏会把“今日最高杠杆动作”提升为唯一主 CTA：如果存在待二次修正记录，优先进入复盘修正；否则使用画像训练处方；没有处方时才兜底开新题。目标作战令和作战顺序继续保留为决策背景，但不再与主动作抢入口。
- 训练首页不再把累计完成、连续天数、维度覆盖和本月节奏渲染成独立 KPI 卡片区，而是收束为“行动证据带”：这些数字作为主动作为什么被推荐、完成后如何判断训练节奏的背景证据，避免首屏下方重新出现统计看板感。
- 训练首页把“复盘队列”和“能力证据资产”合并为“训练资产流水线”：同一工作区左侧显示待修正与已可用资产数量，右侧先列待修正回答，再列可用证据资产；开新题被明确放在流水线处理之后，避免用户在两个卡片区之间重新选择模块。
- 训练首页底部不再保留“维度训练分布 / 本月训练概览 / 复盘归档”三张并列看板卡，而是合并为“训练节奏与归因”辅助面板：维度偏移、本月节奏和最近归档只作为主动作后的低权重校准信息，不再抢夺训练流水线的行动焦点。
- `/api/training/stats` 会把最近训练记录、AI 反馈和二次修正整理为 `evidenceAssets`；训练首页展示“能力证据资产”，区分“面试可用”和“待修正后可用”，并链接到历史复盘或项目故事库，让日常训练能沉淀为跳槽面试可复用材料。
- `/api/training/history/[id]` 在读回训练记录时派生 `interviewExpressionCard`，历史复盘页展示“面试表达卡”：开场判断、证据抓手、追问风险和可复制表达版本。该卡片优先使用二次修正内容，也会优先读回 `ai_feedback.interview_expression`；历史复盘页还会把 `interview_expression` 与 `thinking_upgrade` 抬到“主线资产复盘”，不新增 schema，让每次复盘都能转成面试表达材料或思维升级材料。
- 历史复盘页进一步改为“训练复盘工作台”：顶部“复盘处理台”根据当前状态只突出一个主动作（先保存修正版、沉淀表达卡、沉淀思维升级、回到训练流水线），并把“原答与修正版 / 入账动作台 / 回到训练流水线”展示为本轮处理顺序；二次修正入口常驻，避免用户从普通历史记录进入时只能阅读反馈。
- 历史复盘页的面试表达卡支持“沉淀到画像账本”：前端调用 `POST /api/profile/summary`，`trigger=expression_card_saved`，把表达卡摘要写入 `growth_snapshots.dimension_scores.__trigger.expressionCard` 并读回 snapshot，让表达资产进入后续画像推荐闭环。
- 历史复盘页的思维升级卡支持“沉淀思维升级”：前端调用 `POST /api/profile/summary`，`trigger=thinking_upgrade_saved`，把判断质量、取舍质量、归因深度和落地严谨度写入 `growth_snapshots.dimension_scores.__trigger.thinkingUpgrade` 并读回 snapshot，让高级产品思维训练也进入画像证据账本。
- Dashboard 首屏新增“今日行动档案”：`buildCommandCenter` 从最近训练记录派生 `actionDossier`，把最新面试资产、待修正材料和下一题处方直接放到两条结果路径之后，避免表达资产只埋在训练详情页。
- Dashboard 首屏进一步从双路径大卡片改为“今日主动作 + 资产流水线”指挥舱：首屏只突出一个最高杠杆动作，展示行动理由、完成后入账说明和主 CTA；面试跳槽/高级产品思维保留为紧凑主线切换；右侧用“目标简报 → 今日动作 → 证据入账 → 下一步处方”串起资产流转，避免用户先在模块或路径卡片中选择。
- Dashboard 的 `actionDossier` 不再作为首屏下方的独立卡片墙渲染，而是嵌入右侧“主动作证据”区：有终版表达时直接复制或模拟复述，有已修补目标证据时直接入账，没有资产时进入训练或故事库生成证据。旧的 `ActionDossierPanel` 组件已删除，避免后续维护时把首屏重新退回重复行动中心。
- 今日行动档案会继续读取 `growthProfile.storyAssets` 和 `latestGoalBrief`，当已入账项目故事包含目标匹配缺口时，首屏生成“目标证据行动”：明确今天先修哪个项目、目标匹配分、优先级标签和第一条待补证据，入口指向 `/bootcamp/story-bank`。
- 今日行动档案也会读取 `bootcamp_sessions.parsed_profile.projects[].targetEvidence`，识别“目标证据已补但还没入画像账本”的项目，并优先提示“现在入账这份证据”；用户可在 Dashboard 直接点击入账，前端调用 `POST /api/profile/summary`，`trigger=project_story_saved`，把目标证据写入画像账本后刷新 `/api/dashboard` 读回成功态。故事库保存项目故事包时也会把 `targetEvidence` 一并写入 `growth_snapshots.dimension_scores.__trigger.projectStory`，Dashboard 证据账本刷新后可读回这段目标证据。
- 当 `growthProfile.storyAssets` 已包含 `finalInterviewAnswer`，今日行动档案会把它提升为“面试弹药包”：首屏展示项目、成熟度和终版表达，支持复制终版表达，并提供进入 `/bootcamp/interview?focus=target_evidence` 的模拟复述入口，避免终版表达只停在账本展示。
- 项目故事库会读取最近 `training_records`，复用面试表达卡生成逻辑派生 `trainingExpressionAssets`，并在 `/bootcamp/story-bank` 展示“日常训练表达资产”。这些资产链接回训练复盘页，不新增 schema，让日常训练回答可以进入面试跳槽资产链。
- 项目故事库的项目详情页支持把当前项目故事包沉淀到画像账本：前端调用 `POST /api/profile/summary`，`trigger=project_story_saved`，把项目名、角色、成熟度、证据缺口、目标匹配信息和 2 分钟讲述稿写入 `growth_snapshots.dimension_scores.__trigger.projectStory`，让可讲项目资产进入后续画像推荐闭环。
- 项目故事库会从最近 `growth_snapshots.dimension_scores.__goalBrief` 读回 `latestGoalBrief`，并为每个简历项目生成“目标匹配度、优先讲/备选讲/暂缓讲、补齐目标证据”。页面左侧展示“目标项目优先级”，项目详情页展示该项目对目标岗位/目标场景的证据缺口，帮助用户先打磨最能支撑跳槽目标的项目。
- 项目故事库详情页提供“目标证据修补台”：根据 `targetFit.missingEvidence` 给出当前最该补的一条目标证据，用户填写后通过 `PATCH /api/bootcamp/story-bank` 写回 `bootcamp_sessions.parsed_profile.projects[].targetEvidence`；刷新后 `buildStoryBank` 读回 `targetEvidenceRepair.savedEvidence`，并把这段目标证据合入 2 分钟讲述稿，不新增 schema。已补目标证据的项目不再重复生成同一组目标缺口，故事库会提示下一步沉淀到画像账本或进入模拟追问验证。
- `buildGrowthProfile` 会从 `growth_snapshots.dimension_scores.__trigger.projectStory` 读回已保存的项目故事包，Dashboard 能力证据账本展示“已入账项目资产”、最新项目名、角色、成熟度、目标匹配和证据缺口，并链接回 `/bootcamp/story-bank` 继续补证据；推荐引擎优先使用目标匹配里的 `missingEvidence` 生成项目证据处方。
- `buildGrowthProfile` 会从 `growth_snapshots.dimension_scores.__trigger.thinkingUpgrade` 读回已保存的思维升级卡，Dashboard 能力证据账本展示“已入账思维升级”、最新维度和判断/取舍/归因/落地摘要，并链接回对应训练复盘页。
- `buildRecommendationPlan` 会优先读取最近的 `thinkingAssets`，把最新思维升级卡转成下一题训练处方：标题延续对应维度，理由引用判断/取舍/归因/落地摘要，入口指向 `/training/session?focus=thinking_training`，复盘处方指向原训练复盘页，让“思维升级卡入账 → 下一题迁移练习”形成闭环。
- `/api/training/sessions?date=...` 会把最近一张 `thinking_upgrade_saved` 资产作为 `latestThinkingUpgrade` 返回训练实战页；当用户进入高级产品思维主线时，作答前会看到“本题迁移目标”，明确上一张思维升级卡中的判断、取舍、归因和落地要求，并随题目缓存写入 `training_sessions.questions`，刷新后不丢失迁移上下文。
- 训练实战页提交答案时会把 `migrationTarget` 传给 `/api/train?action=analyze`，AI 反馈在 `thinking_upgrade.migration_check` 中判断用户是否把上一张思维升级卡迁移到本题，并在反馈面板展示“迁移验证”；该结果随既有 `training_records.ai_feedback` 落库，不新增 schema。
- 历史复盘页会在“主线资产复盘 / 思维升级卡”中读回并展示 `thinking_upgrade.migration_check`，用户点击“沉淀思维升级”时会把迁移验证一起写入 `growth_snapshots.dimension_scores.__trigger.thinkingUpgrade`；`buildGrowthProfile` 再读回为 `thinkingAssets[].migrationCheck`，让“上一题升级点是否迁移成功”成为后续画像和处方可引用的长期证据。
- 当 `thinkingAssets[].migrationCheck` 显示用户没有迁移成功、证据不足或仍停留在功能清单时，`buildRecommendationPlan` 会把下一题训练处方改为“补迁移缺口”，训练实战页也会在“本题迁移目标”中展示“上次迁移验证”；`/api/training/questions` 会把这条迁移验证随 `migrationTarget` 存入当天题目缓存，确保刷新后仍围绕同一个缺口练习。

---

## 技术栈

- **平台**：Web 应用（桌面优先，暂不做移动端适配）
- **框架**：Next.js (App Router) + Tailwind CSS + shadcn/ui
- **AI 交互**：Vercel AI SDK（流式对话、多轮上下文管理）
- **数据层**：Supabase（账密登录 + PostgreSQL 数据库）
- **部署**：Vercel
- **核心依赖**：AI 大模型（DeepSeek V4 Flash 默认，支持用户自定义配置）

## 关键技术决策

### 内容生成策略
**动态按需生成**。不预置题库和案例库，用户选择维度/等级时 AI 实时出题。优势：零库存维护、始终新鲜、可结合用户画像个性化出题。案例库同理——每次访问按需生成经典拆解或决策推演内容。

### 数据持久化
Supabase 完整方案。账密登录 + PostgreSQL 存储用户画像、答题记录、诊断报告、特训进度。支持跨设备访问，数据不丢失。

### Prompt 架构
统一人格底座 + 阶段性指令叠加。每个 AI 角色有固定基础人格，子场景叠加阶段性指令，并携带前阶段结论确保上下文衔接。详见 `docs/2026-05-19-prompt-strategy.md`。

### AI 模型策略

**默认统一模型：DeepSeek V4 Flash + thinking 开启。**

每个 AI 调用都直接影响用户体验质量——量表题目质量决定诊断准确性，简历解析质量决定特训方向，案例生成质量决定学习效果。省 token 在这些场景上毫无意义。

**模型配置方式**：
- 内置 DeepSeek V4 Flash 为默认模型，用户填写 API Key 即可使用
- 提供设置页，用户可切换至 DeepSeek V4 Pro（更强，略贵）
- 支持自定义 OpenAI 兼容 API（扩展）
- **深度思考 (reasoning) 默认开启**，确保诊断和评分质量
- API Key 由用户自行配置，存储在应用数据库中

**实现方式**：Vercel AI SDK provider 中动态读取用户配置的模型和 API Key，统一开启 reasoning 参数。
