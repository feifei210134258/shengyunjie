export type TrainingDimensionStrategy = {
  dimension: string;
  positioning: string;
  framework: string;
  questionPatterns: string[];
  answerFocus: string[];
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

export function getTrainingDimensionStrategy(dimension?: string): TrainingDimensionStrategy {
  if (!dimension) return defaultStrategy;
  return strategies[dimension] || defaultStrategy;
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
