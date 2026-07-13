export const TRAINING_DIMENSIONS = [
  "战略思维",
  "系统设计能力",
  "数据决策能力",
  "用户洞察与需求管理",
  "商业思维",
] as const;

export type TrainingDimension = (typeof TRAINING_DIMENSIONS)[number];

export const TRAINING_ARCHETYPES = [
  {
    id: "decision_memo",
    answerFormat: "决策备忘录",
    taskBrief: "在多个可行选择之间作出判断，并说明哪些新证据会改变结论。",
  },
  {
    id: "ambiguous_diagnosis",
    answerFormat: "调查与判断计划",
    taskBrief: "面对相互冲突的信号，排列多个竞争解释并设计区分证据。",
  },
  {
    id: "discovery_plan",
    answerFormat: "探索验证方案",
    taskBrief: "识别最关键的未知量，设计最小验证并设置继续、转向或退出条件。",
  },
  {
    id: "system_boundary",
    answerFormat: "系统边界设计",
    taskBrief: "界定角色、状态、责任、例外与演进边界，让异常情况下也能运行。",
  },
  {
    id: "metric_review",
    answerFormat: "指标评审记录",
    taskBrief: "判断现有指标能否支持决策，并识别口径、样本或激励风险。",
  },
  {
    id: "counterfactual_review",
    answerFormat: "决策复盘",
    taskBrief: "给出已经发生的决策和结果，要求区分判断质量、执行影响与运气。",
  },
  {
    id: "stakeholder_challenge",
    answerFormat: "多方协商方案",
    taskBrief: "让目标冲突的角色形成可执行安排，并明确各方承诺和边界。",
  },
  {
    id: "executive_proposal",
    answerFormat: "管理层提案",
    taskBrief: "对资源承诺提出一项管理层建议，并回应最重要的反对意见。",
  },
] as const;

export type TrainingArchetypeId = (typeof TRAINING_ARCHETYPES)[number]["id"];

export interface TrainingCapabilityDefinition {
  id: string;
  dimension: TrainingDimension;
  label: string;
  advancedBehavior: string;
  executionTrap: string;
  archetypes: TrainingArchetypeId[];
  evaluationFocus: string[];
}

export const TRAINING_CAPABILITY_CATALOG: TrainingCapabilityDefinition[] = [
  {
    id: "strategy.problem_scope",
    dimension: "战略思维",
    label: "问题定义与机会范围",
    advancedBehavior: "在讨论方案前重新界定问题、影响人群、时间窗口和真正值得投入的机会。",
    executionTrap: "把业务方提出的功能或表面症状直接当成需要解决的问题。",
    archetypes: ["ambiguous_diagnosis", "discovery_plan", "executive_proposal"],
    evaluationFocus: ["重新定义核心问题", "识别影响人群和边界", "说明为什么值得现在投入"],
  },
  {
    id: "strategy.positioning_alignment",
    dimension: "战略思维",
    label: "定位与战略一致性",
    advancedBehavior: "判断一个机会是否强化目标客群、核心价值和可持续差异，而不只看短期收益。",
    executionTrap: "将所有能带来客户或收入的需求都视为同等合理的增长机会。",
    archetypes: ["decision_memo", "executive_proposal", "counterfactual_review"],
    evaluationFocus: ["说清目标客群与核心价值", "评估对定位的强化或稀释", "区分收入机会与战略机会"],
  },
  {
    id: "strategy.portfolio_sequencing",
    dimension: "战略思维",
    label: "组合取舍与路线图节奏",
    advancedBehavior: "根据依赖、学习价值、时间窗口和可逆性安排投资顺序，而不是静态排名。",
    executionTrap: "用单一分数或声音大小排优先级，忽略方案之间的时序和学习依赖。",
    archetypes: ["decision_memo", "executive_proposal", "stakeholder_challenge"],
    evaluationFocus: ["识别时间窗口与依赖", "区分可逆与不可逆投资", "给出顺序而非只给排名"],
  },
  {
    id: "strategy.competitive_response",
    dimension: "战略思维",
    label: "竞争变化下的差异化选择",
    advancedBehavior: "区分必须跟进的基础能力与应该坚持的差异化，预判竞争反应和客户转换逻辑。",
    executionTrap: "看到竞品新功能就立刻跟进，或因为强调差异化而忽略基础门槛。",
    archetypes: ["decision_memo", "counterfactual_review", "executive_proposal"],
    evaluationFocus: ["识别客户的真实转换条件", "区分门槛与差异化", "预判对手反应和长期位置"],
  },
  {
    id: "strategy.short_long_balance",
    dimension: "战略思维",
    label: "短期结果与长期能力",
    advancedBehavior: "同时评估当期业务结果和对数据、平台、渠道或组织能力的长期复利影响。",
    executionTrap: "只优化当期可见指标，或用遥远的长期价值回避近期结果责任。",
    archetypes: ["decision_memo", "counterfactual_review", "executive_proposal"],
    evaluationFocus: ["量化近期结果与长期复利", "识别能力建设的真实受益者", "设定阶段性承诺与校验点"],
  },
  {
    id: "strategy.boundary_choice",
    dimension: "战略思维",
    label: "停止、自建、采购与合作边界",
    advancedBehavior: "根据战略控制点、学习速度、替换成本和组织能力选择做、买、合作或停止。",
    executionTrap: "默认所有产品需求都应由自己团队开发，并将已投入成本当成继续的理由。",
    archetypes: ["decision_memo", "executive_proposal", "counterfactual_review"],
    evaluationFocus: ["识别战略控制点", "评估替换成本与可逆性", "敢于设定停止条件"],
  },
  {
    id: "system.multi_role_workflow",
    dimension: "系统设计能力",
    label: "多角色跨组织工作流",
    advancedBehavior: "从目标、职责、信息和例外出发设计跨角色协作，而不是只画理想主流程。",
    executionTrap: "只按一个主要用户的顺畅路径设计，忽略移交、撤回、代办和组织边界。",
    archetypes: ["system_boundary", "stakeholder_challenge", "counterfactual_review"],
    evaluationFocus: ["覆盖目标不同的关键角色", "识别移交与例外状态", "说明责任和信息的流转"],
  },
  {
    id: "system.governance_efficiency",
    dimension: "系统设计能力",
    label: "治理、合规与效率平衡",
    advancedBehavior: "根据风险等级设置权限、审批、审计和例外机制，让控制成本与业务风险匹配。",
    executionTrap: "把所有操作套上同样严格的审批，或为了效率绕过必要的追责链路。",
    archetypes: ["system_boundary", "decision_memo", "stakeholder_challenge"],
    evaluationFocus: ["根据风险分级控制", "定义例外与追责机制", "衡量治理成本和操作效率"],
  },
  {
    id: "system.domain_boundary",
    dimension: "系统设计能力",
    label: "业务域边界与平台抽象",
    advancedBehavior: "以稳定业务责任和变化速度划分边界，识别真正可复用能力与伪平台化。",
    executionTrap: "把相似界面当成相同业务，或在只有一个使用者时过早抽象通用平台。",
    archetypes: ["system_boundary", "decision_memo", "counterfactual_review"],
    evaluationFocus: ["用业务责任而非界面划边界", "证明复用需求真实存在", "评估抽象的变更与协同成本"],
  },
  {
    id: "system.consistency_recovery",
    dimension: "系统设计能力",
    label: "状态一致性与异常恢复",
    advancedBehavior: "除主流程外同时设计失败、重试、补偿、幂等、人工介入和最终状态可见性。",
    executionTrap: "只描述成功时如何流转，用一个笼统的失败提示代替恢复与对账设计。",
    archetypes: ["system_boundary", "ambiguous_diagnosis", "counterfactual_review"],
    evaluationFocus: ["定义源状态与最终一致边界", "设计重试补偿和人工介入", "说明用户如何看见和处理中间态"],
  },
  {
    id: "system.batch_concurrency_audit",
    dimension: "系统设计能力",
    label: "批量、并发、版本与审计",
    advancedBehavior: "在批量或并发场景中界定原子性、局部失败、版本冲突、回滚和审计粒度。",
    executionTrap: "把单条操作简单循环复制成批量功能，忽略部分成功和并发修改。",
    archetypes: ["system_boundary", "ambiguous_diagnosis", "decision_memo"],
    evaluationFocus: ["定义批次与单条的原子边界", "处理并发和版本冲突", "保留可追溯的细粒度记录"],
  },
  {
    id: "system.legacy_evolution",
    dimension: "系统设计能力",
    label: "历史系统迁移与渐进演进",
    advancedBehavior: "把目标架构拆成可验证的迁移阶段，同时管理双轨期数据、回退和业务连续性。",
    executionTrap: "将重构当成一次性替换项目，只描述终局而没有可安全停留的中间状态。",
    archetypes: ["decision_memo", "system_boundary", "executive_proposal"],
    evaluationFocus: ["设计可独立验证的迁移阶段", "处理双轨数据与回退", "设置业务连续性与停止条件"],
  },
  {
    id: "data.metric_system",
    dimension: "数据决策能力",
    label: "目标、指标树与先行信号",
    advancedBehavior: "从业务目标拆出结果、过程、质量和约束指标，避免单一指标驱动错误行为。",
    executionTrap: "选择最容易获取或看起来最好的数字，缺少指标间的因果与制衡关系。",
    archetypes: ["metric_review", "executive_proposal", "counterfactual_review"],
    evaluationFocus: ["将指标与业务目标连接", "同时定义先行与结果指标", "设置质量或反作用约束"],
  },
  {
    id: "data.attribution",
    dimension: "数据决策能力",
    label: "异常定位与混杂因素",
    advancedBehavior: "从时间、人群、流程和外部变化分解异常，为多个可能解释设计区分证据。",
    executionTrap: "把同时发生的功能上线当成指标变化的原因，或只验证第一个直觉。",
    archetypes: ["ambiguous_diagnosis", "counterfactual_review", "metric_review"],
    evaluationFocus: ["提出可区分的竞争解释", "按人群时间和流程分解", "说明哪种证据会推翻当前判断"],
  },
  {
    id: "data.causal_validation",
    dimension: "数据决策能力",
    label: "可证伪假设与因果验证",
    advancedBehavior: "将争议转化为可被推翻的假设，选择能够排除替代解释的对照和最小验证。",
    executionTrap: "只收集支持方案的正向数据，或把一次前后对比当成因果证据。",
    archetypes: ["discovery_plan", "ambiguous_diagnosis", "counterfactual_review"],
    evaluationFocus: ["定义可被推翻的假设", "设计可信对照或替代验证", "预先说明判定标准和偏差"],
  },
  {
    id: "data.decision_threshold",
    dimension: "数据决策能力",
    label: "不完全信息下的决策阈值",
    advancedBehavior: "根据决策的可逆性、等待成本和错误代价，判断现有证据是否已足够行动。",
    executionTrap: "要求所有信息完整后才决策，或在没有设置损失边界时凭一个弱信号全量投入。",
    archetypes: ["decision_memo", "discovery_plan", "executive_proposal"],
    evaluationFocus: ["区分可逆与不可逆决策", "衡量等待信息的成本", "设置加码、停止和回退阈值"],
  },
  {
    id: "data.measurement_bias",
    dimension: "数据决策能力",
    label: "口径、样本与测量偏差",
    advancedBehavior: "检查指标定义、埋点、样本选择和漏斗存活偏差，确认数字是否代表目标人群。",
    executionTrap: "把仪表盘数字当成客观事实，忽略数据是如何被生产、排除和聚合的。",
    archetypes: ["metric_review", "ambiguous_diagnosis", "counterfactual_review"],
    evaluationFocus: ["核对指标口径与数据生成过程", "识别样本与存活偏差", "评估偏差会如何改变决策"],
  },
  {
    id: "data.insight_to_action",
    dimension: "数据决策能力",
    label: "从分析结论到产品动作",
    advancedBehavior: "将分析结论转化为明确的干预对象、行动强度、监测信号和可恢复的实施路径。",
    executionTrap: "以生产一份正确分析报告为终点，没有定义谁因此做什么以及如何知道有效。",
    archetypes: ["executive_proposal", "decision_memo", "metric_review"],
    evaluationFocus: ["将结论对应到具体可控动作", "定义行动对象和强度", "设置监测、回滚和复盘节点"],
  },
  {
    id: "insight.evidence_synthesis",
    dimension: "用户洞察与需求管理",
    label: "多源证据合并与冲突解释",
    advancedBehavior: "将访谈、行为、工单、销售反馈和数据按来源偏差组合，解释信号为何冲突。",
    executionTrap: "简单计数哪种声音出现最多，或用一个鲜活案例覆盖更广泛的反向证据。",
    archetypes: ["ambiguous_diagnosis", "discovery_plan", "counterfactual_review"],
    evaluationFocus: ["区分证据来源和选择偏差", "解释冲突信号而非平均化", "指出最值得补充的证据"],
  },
  {
    id: "insight.problem_definition",
    dimension: "用户洞察与需求管理",
    label: "任务、动机与约束区分",
    advancedBehavior: "从功能表述中还原用户想完成的任务、取得的进展和不能打破的约束。",
    executionTrap: "将用户提出的解决方案当成需求本身，然后围绕该功能做细节调优。",
    archetypes: ["discovery_plan", "ambiguous_diagnosis", "decision_memo"],
    evaluationFocus: ["把解决方案还原为用户进展", "识别现有替代行为与约束", "不在未验证问题时锁定功能"],
  },
  {
    id: "insight.role_conflict",
    dimension: "用户洞察与需求管理",
    label: "多角色价值冲突与决策者",
    advancedBehavior: "区分使用者、购买者、管理者和承担成本者，设计能让整个系统成立的价值交换。",
    executionTrap: "只优化高频使用者的便捷，或只满足最终签约者的管控需求。",
    archetypes: ["stakeholder_challenge", "decision_memo", "discovery_plan"],
    evaluationFocus: ["区分使用购买管理和成本角色", "说明各角色价值与损失", "设计可持续的角色平衡与验证"],
  },
  {
    id: "insight.segmentation",
    dimension: "用户洞察与需求管理",
    label: "人群分层与不可平均的需求",
    advancedBehavior: "按行为、场景、成本和价值差异分层，为值得服务的子群做明确选择。",
    executionTrap: "将少数大客户与大量低频用户的声音平均，产生没有人真正满意的折中方案。",
    archetypes: ["ambiguous_diagnosis", "decision_memo", "executive_proposal"],
    evaluationFocus: ["使用行为与价值而非表面属性分层", "识别各子群的规模与代价", "明确选择服务和不服务谁"],
  },
  {
    id: "insight.mvp_validation",
    dimension: "用户洞察与需求管理",
    label: "MVP 范围、顺序与退出条件",
    advancedBehavior: "根据最关键未知量设计最小验证，区分验证价值的 MVP 与缩水交付版。",
    executionTrap: "将完整方案删减一半功能就称为 MVP，没有说明它要消除哪个未知。",
    archetypes: ["discovery_plan", "decision_memo", "counterfactual_review"],
    evaluationFocus: ["识别最高风险未知量", "让最小方案直接验证该未知", "设定继续转向和退出标准"],
  },
  {
    id: "insight.demand_evidence",
    dimension: "用户洞察与需求管理",
    label: "需求声量、价值与证据质量",
    advancedBehavior: "分开评估需求的声音强度、问题价值、证据可信度和解决方案成本。",
    executionTrap: "根据提需求人的职级、客户合同金额或反复催促次数直接排期。",
    archetypes: ["decision_memo", "stakeholder_challenge", "ambiguous_diagnosis"],
    evaluationFocus: ["分离声量强度与问题价值", "评估证据选择偏差与可信度", "对比不同解法而非只判断做不做"],
  },
  {
    id: "commercial.value_capture",
    dimension: "商业思维",
    label: "用户价值、付费意愿与价值捕获",
    advancedBehavior: "将用户可感知的业务改善连接到付费主体、付费时机和产品可捕获的价值。",
    executionTrap: "认为功能使用频率高就一定适合收费，或认为用户喜欢就代表企业愿意付费。",
    archetypes: ["discovery_plan", "decision_memo", "executive_proposal"],
    evaluationFocus: ["说清客户获得的可量化价值", "识别付费主体与时机", "区分用户价值与可捕获价值"],
  },
  {
    id: "commercial.pricing_packaging",
    dimension: "商业思维",
    label: "定价、包装与客户分层",
    advancedBehavior: "根据价值尺度、使用差异和采购逻辑设计包装，让客户增长与收入扩张方向一致。",
    executionTrap: "只通过涨价降价或增减功能调整定价，没有选对计费单位与客户边界。",
    archetypes: ["decision_memo", "executive_proposal", "counterfactual_review"],
    evaluationFocus: ["选择与客户价值同向的尺度", "解释包装如何区分客群", "评估客户行为与收入的反作用"],
  },
  {
    id: "commercial.unit_economics",
    dimension: "商业思维",
    label: "单位经济、边际成本与规模效应",
    advancedBehavior: "识别真正的收入、服务成本、获客成本和扩张路径，判断增长是否可持续。",
    executionTrap: "只看总收入或签约客户数，忽略交付、客服、定制和渠道带来的边际成本。",
    archetypes: ["decision_memo", "metric_review", "executive_proposal"],
    evaluationFocus: ["选对单位经济对象和口径", "包含交付服务与变动成本", "评估规模增长后结构是否改善"],
  },
  {
    id: "commercial.gtm_adoption",
    dimension: "商业思维",
    label: "GTM、采购链路与产品配合",
    advancedBehavior: "将产品能力与线索、决策、采购、上线和采用链路连接，识别真正的商业化阻力。",
    executionTrap: "把销售转化低全部解释为功能不够，忽略客户内部采购与导入过程。",
    archetypes: ["ambiguous_diagnosis", "executive_proposal", "stakeholder_challenge"],
    evaluationFocus: ["拆分从线索到采用的完整链路", "区分产品与非产品阻力", "设计销售客成与产品的协同验证"],
  },
  {
    id: "commercial.retention_expansion",
    dimension: "商业思维",
    label: "留存、扩张与客户成功机制",
    advancedBehavior: "从客户持续获得业务结果出发，设计产品使用、组织渗透、续费和扩展的连锁机制。",
    executionTrap: "将续费视为客户成功或销售团队的独立责任，只看登录活跃不看业务成果。",
    archetypes: ["ambiguous_diagnosis", "metric_review", "executive_proposal"],
    evaluationFocus: ["连接采用行为与客户业务结果", "区分留存、扩展和续费驱动", "设计产品与客成的联合行动"],
  },
  {
    id: "commercial.roi_sustainability",
    dimension: "商业思维",
    label: "客户 ROI 与企业可持续回报",
    advancedBehavior: "同时说清客户为何获得可证明回报，以及自身公司如何在长期服务中保持收益。",
    executionTrap: "只展示功能价值或理论节省时间，没有考虑落地成本、实现概率和供应方回报。",
    archetypes: ["executive_proposal", "decision_memo", "counterfactual_review"],
    evaluationFocus: ["证明客户回报的实现路径", "计入导入与组织变革成本", "同时评估供应方长期可持续性"],
  },
];

export function getCapabilitiesForDimension(dimension: string) {
  return TRAINING_CAPABILITY_CATALOG.filter((item) => item.dimension === dimension);
}

export function isTrainingDimension(value: string): value is TrainingDimension {
  return (TRAINING_DIMENSIONS as readonly string[]).includes(value);
}

export function getAnswerFormat(archetype: TrainingArchetypeId) {
  return (
    TRAINING_ARCHETYPES.find((item) => item.id === archetype)?.answerFormat ||
    "结构化产品判断"
  );
}

export function getArchetypeTaskBrief(archetype: TrainingArchetypeId) {
  return (
    TRAINING_ARCHETYPES.find((item) => item.id === archetype)?.taskBrief ||
    "要求用户对题设中的核心矛盾作出结构化判断。"
  );
}
