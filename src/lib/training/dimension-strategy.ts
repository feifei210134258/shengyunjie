export type TrainingDimensionStrategy = {
  dimension: string;
  positioning: string;
  framework: string;
  questionPatterns: string[];
  answerFocus: string[];
  avoidPatterns: string[];
};

export type TrainingTarget = {
  id: string;
  dimension: string;
  label: string;
  capability: string;
  framework: string;
  answerFocus: string[];
  variationAxes: string[];
  avoidPatterns: string[];
};

const defaultStrategy: TrainingDimensionStrategy = {
  dimension: "通用产品能力",
  positioning: "围绕具体 B 端产品场景训练问题拆解、方案取舍和验证闭环。",
  framework: "产品判断框架",
  questionPatterns: [
    "围绕一个具体产品困境提出判断任务",
    "要求说明关键取舍和验证方式",
  ],
  answerFocus: ["问题理解", "结构化分析", "方案落地", "决策理由"],
  avoidPatterns: ["空泛行业分析", "虚构宏大经营数据", "只罗列功能清单"],
};

const strategies: Record<string, TrainingDimensionStrategy> = {
  "战略思维": {
    dimension: "战略思维",
    positioning:
      "业务判断与取舍：从具体产品动作反推业务意图，在资源约束下判断优先级、放弃项和验证指标。",
    framework: "业务意图识别 / 取舍判断 / 验证指标框架",
    questionPatterns: [
      "产品动作反推业务意图：例如试用、入口、套餐、权限或流程发生变化",
      "两个方向只能选一个：要求说明选择标准、先做什么、暂时不做什么",
      "路线图优先级调整：在客户压力、团队资源和业务目标之间做取舍",
      "机会判断：判断一个新机会是否值得进入，以及先验证什么",
    ],
    answerFocus: [
      "是否识别产品动作背后的业务目标",
      "是否说清选择标准、放弃项和风险边界",
      "是否提出能验证判断的关键指标",
      "是否把产品动作和业务结果连起来",
    ],
    avoidPatterns: [
      "抽象成本计算题或纯框架套用题",
      "制定 12/18 个月战略路线图",
      "寻找第二增长曲线",
      "泛泛分析市场规模、竞争格局或商业模式",
      "虚构 CEO 战略会、融资、营收或市场份额",
    ],
  },
  "系统设计能力": {
    dimension: "系统设计能力",
    positioning:
      "复杂场景建模：拆清角色、流程、权限、边界、异常和模块依赖，把单点需求抽象成可复用能力。",
    framework: "系统思维 / 模块化与依赖关系梳理",
    questionPatterns: [
      "多角色流程设计：明确角色、动作、状态流转和协作边界",
      "权限/审批/合规场景：要求拆权限模型、例外机制和审计链路",
      "异常流程补全：识别失败、撤回、超时、冲突和补偿动作",
      "定制需求抽象：从单客户需求抽象成标准能力",
    ],
    answerFocus: ["角色边界", "流程状态", "权限和异常", "模块抽象", "灰度落地"],
    avoidPatterns: ["只画理想主流程", "只堆功能点", "忽略多角色和异常边界"],
  },
  "数据决策能力": {
    dimension: "数据决策能力",
    positioning:
      "假设验证与指标判断：把业务判断拆成可验证假设，识别指标噪音、因果关系和实验边界。",
    framework: "假设验证 / 因果推断",
    questionPatterns: [
      "指标异动归因：要求判断变化来自产品、流量、季节性还是样本结构",
      "实验是否有效：定义成功指标、护栏指标和观察窗口",
      "最小验证方案：在数据不完整时设计低成本验证",
      "指标体系选择：区分北极星指标、过程指标和反向指标",
    ],
    answerFocus: ["核心假设", "指标口径", "归因逻辑", "验证方案", "反证意识"],
    avoidPatterns: ["只列指标不说明用途", "把相关性当因果", "忽略样本和口径变化"],
  },
  "用户洞察与需求管理": {
    dimension: "用户洞察与需求管理",
    positioning:
      "问题识别与需求取舍：从用户表达中识别真实问题，设计追问，定义 MVP 边界并排序做与不做。",
    framework: "第一性原理 / JTBD（Jobs-to-be-Done）",
    questionPatterns: [
      "用户说要功能：反推真实任务、约束和成功标准",
      "访谈追问设计：要求给出追问路径和判断依据",
      "MVP 边界定义：说明第一版做什么、不做什么以及为什么",
      "需求优先级排序：在客户影响、通用性和交付成本之间取舍",
    ],
    answerFocus: ["真实问题", "追问质量", "MVP 边界", "优先级依据", "需求拒绝方式"],
    avoidPatterns: ["照单全收客户功能", "直接给方案不追问", "把少数客户声音当普遍需求"],
  },
  "商业思维": {
    dimension: "商业思维",
    positioning:
      "价值实现与商业化：判断客户价值、付费逻辑、定价打包、续费扩容和交付成本之间的关系。",
    framework: "单位经济模型 / 商业模式画布推演",
    questionPatterns: [
      "功能是否收费：判断价值强度、客户分层和付费阻力",
      "套餐打包：决定标准版、高级版、增购包或定制服务",
      "高价值客户与长尾客户取舍：判断收入、续费和交付复杂度",
      "ROI 判断：比较客户收益、内部成本和商业回收路径",
    ],
    answerFocus: ["客户价值", "付费逻辑", "收入与成本", "续费扩容影响", "商业风险"],
    avoidPatterns: ["只谈用户体验不谈价值回收", "虚构财务数据", "把商业化等同于涨价"],
  },
};

const trainingTargets: TrainingTarget[] = [
  {
    id: "problem-framing",
    dimension: "用户洞察与需求管理",
    label: "问题定义",
    capability: "从用户或业务方的表层诉求中重构真实问题，判断第一版应该解决什么、不解决什么。",
    framework: "问题定义框架：先还原触发场景和角色目标，再区分症状、根因和约束，最后定义可验证的问题边界。",
    answerFocus: ["真实问题", "关键追问", "MVP 边界", "不做什么"],
    variationAxes: ["用户说要功能", "老板直接指定方案", "客户投诉集中爆发", "一线团队反馈流程低效"],
    avoidPatterns: ["直接照单全收需求", "只写功能清单", "把少数客户声音当成普遍需求"],
  },
  {
    id: "business-outcome",
    dimension: "战略思维",
    label: "业务结果判断",
    capability: "把具体产品动作和业务结果连接起来，判断它想优化什么、牺牲什么以及如何验证。",
    framework: "业务结果框架：先识别产品动作改变了谁的行为，再反推业务目标和牺牲项，最后设置结果指标与护栏指标。",
    answerFocus: ["业务目标", "牺牲项", "验证指标", "风险边界"],
    variationAxes: ["入口调整", "套餐能力变化", "默认策略变更", "流程门槛变化", "功能下线或合并"],
    avoidPatterns: ["年度战略规划", "第二增长曲线", "泛泛行业趋势分析", "虚构营收或市场份额"],
  },
  {
    id: "tradeoff",
    dimension: "战略思维",
    label: "复杂取舍",
    capability: "在多方案、多角色和资源约束下说明选择标准、放弃项和阶段性验证方式。",
    framework: "取舍判断框架：先列出方案服务的目标和受影响角色，再声明选择标准、放弃项、风险阈值和复盘窗口。",
    answerFocus: ["选择标准", "放弃项", "阶段性路径", "复盘条件"],
    variationAxes: ["两个需求只能做一个", "大客户定制与通用能力冲突", "短期交付与长期架构冲突", "增长目标与体验风险冲突"],
    avoidPatterns: ["没有资源约束的路线图", "抽象价值排序", "让用户自由发挥三到五个方案"],
  },
  {
    id: "metrics-causality",
    dimension: "数据决策能力",
    label: "指标与因果",
    capability: "识别指标变化背后的归因噪音，用假设、口径、对照和护栏指标验证产品动作是否成立。",
    framework: "因果验证框架：先定义目标指标和口径，再拆可能原因与反证信号，最后设计最小验证或对照方案。",
    answerFocus: ["指标口径", "归因假设", "反证意识", "验证方案"],
    variationAxes: ["转化率上升但留存下降", "活跃增加但付费没变", "投诉减少但工单处理变慢", "试点客户数据与整体数据冲突"],
    avoidPatterns: ["只罗列指标", "把相关性当因果", "忽略样本结构或观察窗口"],
  },
  {
    id: "lifecycle-judgment",
    dimension: "商业思维",
    label: "生命周期判断",
    capability: "根据产品所处阶段判断应优先验证增长、留存、商业化、降本还是重构。",
    framework: "生命周期框架：先判断产品阶段和核心瓶颈，再选择当前最该优化的业务结果，最后说明为什么暂不追其他目标。",
    answerFocus: ["阶段判断", "核心瓶颈", "目标选择", "暂不追什么"],
    variationAxes: ["冷启动", "增长停滞", "留存下滑", "商业化试水", "老产品降本重构"],
    avoidPatterns: ["宏观市场分析", "全公司战略转型", "不落到当前阶段的泛泛建议"],
  },
  {
    id: "system-boundary",
    dimension: "系统设计能力",
    label: "系统边界",
    capability: "在权限、流程、集成、配置和异常场景中划清角色边界与系统责任边界。",
    framework: "系统边界框架：先拆角色、对象和状态，再定义权限/流程规则，最后补异常、审计和回收机制。",
    answerFocus: ["角色边界", "状态流转", "异常路径", "治理机制"],
    variationAxes: ["权限外放", "审批流程改造", "第三方集成", "自动化规则默认开启", "配置能力平台化"],
    avoidPatterns: ["只描述理想主流程", "只堆页面功能", "忽略异常和审计"],
  },
  {
    id: "value-capture",
    dimension: "商业思维",
    label: "价值捕获",
    capability: "判断客户价值如何转化为定价、打包、续费、扩容或交付成本控制。",
    framework: "价值捕获框架：先区分客户价值强度和客户分层，再判断付费边界、包装方式、交付成本和续费风险。",
    answerFocus: ["客户分层", "付费边界", "收入与成本", "续费扩容"],
    variationAxes: ["高级能力打包", "增购包设计", "定制服务收敛", "免费能力迁移", "高价值客户与长尾客户取舍"],
    avoidPatterns: ["把商业化等同于涨价", "虚构财务模型", "只谈体验不谈价值回收"],
  },
  {
    id: "stakeholder-influence",
    dimension: "用户洞察与需求管理",
    label: "组织协同",
    capability: "在销售、客成、研发、客户、管理层目标不一致时制造清晰度并推动决策。",
    framework: "协同推进框架：先澄清各方目标和不可退让边界，再把分歧转成可验证假设，最后确定决策人、节奏和复盘机制。",
    answerFocus: ["干系人目标", "冲突转译", "推进机制", "决策闭环"],
    variationAxes: ["销售与客成冲突", "研发容量不足", "大客户施压", "管理层临时插入目标", "运营和产品目标不一致"],
    avoidPatterns: ["只说沟通协调", "没有决策机制", "回避冲突和取舍"],
  },
  {
    id: "quality-delivery",
    dimension: "系统设计能力",
    label: "质量交付",
    capability: "在速度、质量、合规、安全和体验风险之间做可解释的发布判断。",
    framework: "质量交付框架：先识别不可逆风险和受影响用户，再定义灰度、回滚、监控和验收标准。",
    answerFocus: ["风险等级", "灰度策略", "回滚条件", "验收标准"],
    variationAxes: ["赶上线窗口", "灰度数据异常", "合规风险暴露", "性能问题与客户承诺冲突", "缺陷是否阻断发布"],
    avoidPatterns: ["只说按期上线", "忽略回滚和监控", "把质量问题留给研发处理"],
  },
  {
    id: "iteration-review",
    dimension: "数据决策能力",
    label: "复盘迭代",
    capability: "上线后判断成败、解释偏差，并把复盘结论收敛成下一轮产品动作。",
    framework: "复盘迭代框架：先对照上线前假设，再看结果指标、护栏指标和用户证据，最后决定继续、调整或回滚。",
    answerFocus: ["假设对照", "结果解释", "下一轮动作", "学习沉淀"],
    variationAxes: ["试点结果两极分化", "核心指标未动但用户反馈变好", "短期指标达成但护栏指标恶化", "上线后团队对结论分歧"],
    avoidPatterns: ["只复述数据涨跌", "没有解释偏差", "下一步动作不可执行"],
  },
];

export function getTrainingDimensionStrategy(dimension?: string): TrainingDimensionStrategy {
  if (!dimension) return defaultStrategy;
  return strategies[dimension] || defaultStrategy;
}

export function getTrainingTargetsForDimension(dimension?: string) {
  return trainingTargets.filter((target) => target.dimension === dimension);
}

export function getTrainingTarget(
  dimension?: string,
  date = new Date(),
  offset = 0
): TrainingTarget {
  const candidates = getTrainingTargetsForDimension(dimension);
  const pool = candidates.length ? candidates : trainingTargets;
  const seed = Math.floor(date.getTime() / 86_400_000);
  return pool[(seed + offset) % pool.length];
}

export function getTrainingTargetById(
  dimension?: string,
  targetId?: string | null
): TrainingTarget {
  const candidates = getTrainingTargetsForDimension(dimension);
  const pool = candidates.length ? candidates : trainingTargets;
  return pool.find((target) => target.id === targetId) || getTrainingTarget(dimension);
}

export function getNextTrainingTarget(
  dimension?: string,
  currentTargetId?: string | null
): TrainingTarget {
  const candidates = getTrainingTargetsForDimension(dimension);
  const pool = candidates.length ? candidates : trainingTargets;
  const currentIndex = pool.findIndex((target) => target.id === currentTargetId);
  if (currentIndex < 0) return getTrainingTarget(dimension, new Date(), 1);
  return pool[(currentIndex + 1) % pool.length];
}

export function formatTrainingDimensionStrategy(strategy: TrainingDimensionStrategy): string {
  return [
    `能力定位：${strategy.positioning}`,
    `推荐框架：${strategy.framework}`,
    `允许题型：${strategy.questionPatterns.map((item) => `- ${item}`).join("\n")}`,
    `回答应训练：${strategy.answerFocus.map((item) => `- ${item}`).join("\n")}`,
    `禁止题型：${strategy.avoidPatterns.map((item) => `- ${item}`).join("\n")}`,
  ].join("\n");
}

export function formatTrainingTarget(target: TrainingTarget): string {
  return [
    `本题训练靶点：${target.label}`,
    `高阶能力：${target.capability}`,
    `思考框架：${target.framework}`,
    `回答应训练：${target.answerFocus.map((item) => `- ${item}`).join("\n")}`,
    `可用变化轴：${target.variationAxes.map((item) => `- ${item}`).join("\n")}`,
    `靶点禁区：${target.avoidPatterns.map((item) => `- ${item}`).join("\n")}`,
  ].join("\n");
}
