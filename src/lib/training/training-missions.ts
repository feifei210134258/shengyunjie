import {
  getTrainingTargetById,
  type TrainingTarget,
} from "./dimension-strategy.ts";

export type TrainingMission = {
  id: string;
  title: string;
  taskType:
    | "业务增长判断"
    | "商业化取舍"
    | "项目推进与资源冲突"
    | "平台/中台/系统抽象"
    | "数据经营分析"
    | "行业与供给侧约束"
    | "组织影响与协同推进";
  primaryDimension: string;
  targetId: string;
  displayLabel: string;
  label: string;
  capability: string;
  framework: string;
  productDomains: string[];
  scenarioPatterns: string[];
  decisionActions: string[];
  evidenceTypes: string[];
  stakeholderConflicts: string[];
  avoidPatterns: string[];
  sourceNotes: string[];
};

const missions: TrainingMission[] = [
  {
    id: "growth-funnel-diagnosis",
    title: "增长漏斗诊断",
    taskType: "业务增长判断",
    primaryDimension: "数据决策能力",
    targetId: "metrics-causality",
    displayLabel: "增长诊断",
    label: "增长诊断",
    capability: "从拉新、转化、留存、复购或续费漏斗中识别真实瓶颈，并判断产品动作是否服务业务目标。",
    framework: "增长诊断框架：先确认业务目标和漏斗环节，再拆用户分层、渠道来源和关键转化行为，最后定义结果指标与反证信号。",
    productDomains: ["本地生活", "内容平台", "电商", "B2B销售线索", "在线教育"],
    scenarioPatterns: ["转化下滑", "留存变差", "渠道质量下降", "新老用户行为分化"],
    decisionActions: ["定位瓶颈", "选择优化动作", "判断是否继续投入"],
    evidenceTypes: ["漏斗数据", "分层指标", "渠道质量", "用户行为"],
    stakeholderConflicts: ["运营要活动", "销售要线索", "老板要增长", "研发资源有限"],
    avoidPatterns: ["只看总转化率", "把所有问题归因给流量", "没有用户分层"],
    sourceNotes: ["国内增长/运营类产品面试常见题型抽象"],
  },
  {
    id: "commercial-packaging",
    title: "商业化打包与定价",
    taskType: "商业化取舍",
    primaryDimension: "商业思维",
    targetId: "value-capture",
    displayLabel: "商业化",
    label: "商业化取舍",
    capability: "判断能力如何转化为套餐、增购包、定价、续费扩容或交付成本控制。",
    framework: "商业化框架：先识别客户分层和价值强度，再判断付费边界、包装方式、迁移节奏、成本和续费风险。",
    productDomains: ["企业软件", "数据产品", "广告平台", "会员体系", "产业互联网"],
    scenarioPatterns: ["免费能力迁移", "增购包设计", "定制服务收敛", "高价值客户优先"],
    decisionActions: ["决定收费边界", "设计套餐", "控制交付成本"],
    evidenceTypes: ["付费意愿", "使用深度", "毛利", "续费", "交付人力"],
    stakeholderConflicts: ["销售要低门槛", "客户成功担心流失", "财务要收入", "研发担心复杂度"],
    avoidPatterns: ["把商业化等同于涨价", "只谈收入不看交付", "忽略免费用户反弹"],
    sourceNotes: ["国内高级产品商业化/会员/广告/企业服务题抽象"],
  },
  {
    id: "delivery-resource-conflict",
    title: "项目推进与资源冲突",
    taskType: "项目推进与资源冲突",
    primaryDimension: "战略思维",
    targetId: "tradeoff",
    displayLabel: "资源排期",
    label: "资源取舍",
    capability: "在老板目标、销售承诺、研发容量和上线窗口冲突时，给出可解释的排期和取舍。",
    framework: "推进取舍框架：先拆目标和不可退让边界，再比较影响面、紧急度、资源消耗和风险，最后确定阶段路径与同步机制。",
    productDomains: ["政企项目", "大客户交付", "内部运营平台", "产业 SaaS", "硬件软件结合"],
    scenarioPatterns: ["研发容量不足", "销售提前承诺", "客户验收卡点", "上线窗口固定"],
    decisionActions: ["重排优先级", "拆阶段上线", "拒绝或延期需求"],
    evidenceTypes: ["合同节点", "影响客户数", "研发人天", "验收风险"],
    stakeholderConflicts: ["销售强推", "研发反对", "客户成功担心续费", "老板插入目标"],
    avoidPatterns: ["平均分配资源", "只说沟通协调", "没有同步节奏"],
    sourceNotes: ["国内 B 端/政企/项目型产品面试题抽象"],
  },
  {
    id: "platform-abstraction",
    title: "平台化和中台抽象",
    taskType: "平台/中台/系统抽象",
    primaryDimension: "系统设计能力",
    targetId: "system-boundary",
    displayLabel: "平台抽象",
    label: "平台抽象",
    capability: "从多个业务线或客户定制中抽象通用能力，并划清配置、权限、流程、数据和异常边界。",
    framework: "平台抽象框架：先找共性对象和差异点，再定义配置边界、模块职责、依赖关系和异常治理。",
    productDomains: ["中台系统", "CRM", "供应链协同", "仓储物流", "数据平台"],
    scenarioPatterns: ["多业务线重复建设", "单客户定制泛化", "流程配置平台化", "权限模型重构"],
    decisionActions: ["抽象模块", "定义边界", "控制复杂度"],
    evidenceTypes: ["复用率", "配置项", "异常路径", "维护成本"],
    stakeholderConflicts: ["业务要灵活", "研发要收敛", "运营要效率", "管理层要统一"],
    avoidPatterns: ["只画页面", "忽略异常", "把所有需求都做成配置"],
    sourceNotes: ["国内中台/平台型产品面试常见题抽象"],
  },
  {
    id: "data-product-governance",
    title: "数据产品与经营分析",
    taskType: "数据经营分析",
    primaryDimension: "数据决策能力",
    targetId: "metrics-causality",
    displayLabel: "经营分析",
    label: "经营分析",
    capability: "围绕指标、标签、看板、埋点和数据质量，判断数据是否能支持经营决策。",
    framework: "经营分析框架：先定义决策问题，再拆指标口径、数据来源、标签质量和使用场景，最后设计校验和应用闭环。",
    productDomains: ["数据产品", "CDP", "经营看板", "广告投放", "风控系统"],
    scenarioPatterns: ["指标口径争议", "标签质量下降", "看板无人使用", "归因结果冲突"],
    decisionActions: ["定义指标", "修正口径", "治理标签", "解释异常"],
    evidenceTypes: ["埋点", "标签覆盖率", "口径文档", "业务使用率"],
    stakeholderConflicts: ["业务要结论", "数据团队要口径", "运营要可用名单", "管理层要看板"],
    avoidPatterns: ["只罗列指标", "忽略数据质量", "没有业务使用场景"],
    sourceNotes: ["牛客/中文数据产品面试题常见结构抽象"],
  },
  {
    id: "supply-side-constraint",
    title: "行业与供给侧约束",
    taskType: "行业与供给侧约束",
    primaryDimension: "商业思维",
    targetId: "lifecycle-judgment",
    displayLabel: "行业约束",
    label: "行业约束判断",
    capability: "在政策、履约、供给、线下服务或行业链条限制下判断产品方案是否成立。",
    framework: "行业约束框架：先识别供给侧瓶颈和外部规则，再判断产品动作能改变什么、不能改变什么，最后确定最小验证场景。",
    productDomains: ["物流履约", "医疗健康", "教育", "跨境电商", "制造业"],
    scenarioPatterns: ["供给不足", "政策变化", "履约成本高", "线下服务质量不稳定"],
    decisionActions: ["判断机会", "选择试点", "收缩范围"],
    evidenceTypes: ["履约成本", "政策边界", "供给质量", "试点反馈"],
    stakeholderConflicts: ["业务要扩张", "运营担心履约", "法务限制", "服务商能力不稳"],
    avoidPatterns: ["只谈线上功能", "忽视线下履约", "虚构宏观市场规模"],
    sourceNotes: ["国内行业产品/产业互联网面试题抽象"],
  },
  {
    id: "stakeholder-decision",
    title: "组织影响与协同推进",
    taskType: "组织影响与协同推进",
    primaryDimension: "用户洞察与需求管理",
    targetId: "stakeholder-influence",
    displayLabel: "协同推进",
    label: "协同推进",
    capability: "在销售、运营、研发、客成、法务和管理层目标不一致时，把争论转成可决策的问题。",
    framework: "协同推进框架：先澄清各方目标和底线，再把分歧转成可验证假设，最后明确决策人、节奏和复盘口径。",
    productDomains: ["B2B销售", "客户成功", "运营后台", "内容治理", "内部工具"],
    scenarioPatterns: ["销售与研发冲突", "运营和产品目标不一致", "法务卡上线", "老板临时插入方向"],
    decisionActions: ["转译冲突", "设计决策机制", "推进共识"],
    evidenceTypes: ["客户影响", "风险等级", "资源消耗", "决策记录"],
    stakeholderConflicts: ["销售", "研发", "运营", "法务", "管理层"],
    avoidPatterns: ["只说拉会沟通", "没有取舍标准", "不明确决策人"],
    sourceNotes: ["国内高级 PM 组织影响力/项目推进题抽象"],
  },
  {
    id: "demand-problem-framing",
    title: "需求洞察与问题重构",
    taskType: "业务增长判断",
    primaryDimension: "用户洞察与需求管理",
    targetId: "problem-framing",
    displayLabel: "需求重构",
    label: "需求重构",
    capability: "从老板、客户或一线团队的功能诉求里识别真实任务、边界和第一版验证范围。",
    framework: "问题重构框架：先还原触发场景和角色目标，再区分症状、根因和约束，最后定义第一版做与不做。",
    productDomains: ["客服质检", "销售工具", "商家后台", "教育产品", "企业协同"],
    scenarioPatterns: ["客户点名要功能", "老板指定方案", "一线集中抱怨", "竞品压力"],
    decisionActions: ["追问澄清", "定义 MVP", "拒绝或转化需求"],
    evidenceTypes: ["访谈", "工单", "任务频次", "成功标准"],
    stakeholderConflicts: ["大客户施压", "销售催排期", "研发担心返工", "运营要马上解决"],
    avoidPatterns: ["照单全收", "只给功能清单", "没有第一版边界"],
    sourceNotes: ["国内产品经理经典需求面试题抽象"],
  },
  {
    id: "quality-release-risk",
    title: "质量交付与发布风险",
    taskType: "项目推进与资源冲突",
    primaryDimension: "系统设计能力",
    targetId: "quality-delivery",
    displayLabel: "质量发布",
    label: "发布风险",
    capability: "在速度、质量、合规、安全和客户承诺之间判断是否发布、灰度或延期。",
    framework: "质量交付框架：先识别不可逆风险和受影响用户，再定义灰度范围、监控、回滚条件和验收标准。",
    productDomains: ["金融科技", "跨境电商", "政企系统", "物流平台", "数据服务"],
    scenarioPatterns: ["缺陷是否阻断发布", "合规未确认", "客户承诺临近", "灰度数据异常"],
    decisionActions: ["发布判断", "灰度设计", "延期说明"],
    evidenceTypes: ["风险等级", "影响用户", "监控指标", "回滚成本"],
    stakeholderConflicts: ["业务催上线", "研发提示风险", "法务要求合规", "客户等交付"],
    avoidPatterns: ["只说按期上线", "没有回滚条件", "忽略客户沟通"],
    sourceNotes: ["国内上线/交付/合规面试题抽象"],
  },
  {
    id: "operations-efficiency",
    title: "运营效率与后台流程",
    taskType: "平台/中台/系统抽象",
    primaryDimension: "系统设计能力",
    targetId: "system-boundary",
    displayLabel: "流程自动化",
    label: "流程效率",
    capability: "围绕运营后台、审批、质检和异常处理，判断流程改造如何提升效率且不放大风险。",
    framework: "流程效率框架：先拆角色、任务和状态，再识别自动化边界、人工兜底、异常回收和审计记录。",
    productDomains: ["运营后台", "客服质检", "仓储物流", "内容审核", "审批系统"],
    scenarioPatterns: ["人工处理低效", "自动化误伤", "异常订单积压", "审核标准不一致"],
    decisionActions: ["自动化边界", "流程重构", "异常兜底"],
    evidenceTypes: ["处理时长", "误判率", "积压量", "人工成本"],
    stakeholderConflicts: ["运营要效率", "风控要安全", "一线担心误伤", "研发要减少规则复杂度"],
    avoidPatterns: ["只画主流程", "忽略异常", "不看一线使用成本"],
    sourceNotes: ["国内后台/运营产品面试题抽象"],
  },
  {
    id: "ecosystem-tradeoff",
    title: "生态角色与交易规则",
    taskType: "行业与供给侧约束",
    primaryDimension: "商业思维",
    targetId: "tradeoff",
    displayLabel: "生态规则",
    label: "生态取舍",
    capability: "在平台、商家、达人、服务商、用户等多边角色间判断规则调整影响和长期生态健康。",
    framework: "生态取舍框架：先拆各角色利益和行为变化，再判断短期指标、长期供给质量和规则公平性。",
    productDomains: ["电商平台", "内容社区", "本地生活", "广告平台", "交易平台"],
    scenarioPatterns: ["补贴规则调整", "商家排序变化", "达人分成", "服务商准入"],
    decisionActions: ["调整规则", "设计分层", "控制副作用"],
    evidenceTypes: ["供给质量", "交易转化", "投诉", "留存", "生态活跃"],
    stakeholderConflicts: ["平台收益", "商家公平", "用户体验", "服务商积极性"],
    avoidPatterns: ["只看平台收入", "忽略供给侧反应", "没有长期护栏"],
    sourceNotes: ["国内平台/电商/本地生活高级产品题抽象"],
  },
  {
    id: "ai-data-automation",
    title: "AI 与自动化落地",
    taskType: "数据经营分析",
    primaryDimension: "数据决策能力",
    targetId: "iteration-review",
    displayLabel: "AI落地",
    label: "AI落地复盘",
    capability: "判断 AI/自动化能力是否真正提升业务效率，并识别误判、信任、成本和人工兜底问题。",
    framework: "AI落地框架：先定义要替代或增强的任务，再看准确率、采纳率、人工兜底、成本和风险反馈。",
    productDomains: ["智能客服", "销售助手", "质检系统", "数据分析助手", "内容审核"],
    scenarioPatterns: ["AI 准确率不稳", "一线不采纳", "成本高于预期", "自动化误伤"],
    decisionActions: ["判断继续投入", "缩小范围", "设计人工兜底"],
    evidenceTypes: ["准确率", "采纳率", "人工节省", "误伤率", "成本"],
    stakeholderConflicts: ["老板要 AI 效果", "一线不信任", "研发担心成本", "风控担心误伤"],
    avoidPatterns: ["只讲模型能力", "没有人工兜底", "不看真实采纳"],
    sourceNotes: ["国内 AI 产品/数据产品面试题抽象"],
  },
];

export function getTrainingMissions() {
  return missions;
}

function getDaySeed(date: Date) {
  return Math.floor(date.getTime() / 86_400_000);
}

export function getDailyTrainingMissionPlan(date = new Date(), count = 5) {
  const pool = getTrainingMissions();
  if (!pool.length) return [];

  const seed = getDaySeed(date);
  const offset = (seed * 3 + 2) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  const selected: TrainingMission[] = [];
  const usedTaskTypes = new Set<string>();

  for (const mission of rotated) {
    if (selected.length >= count) break;
    if (usedTaskTypes.has(mission.taskType)) continue;
    selected.push(mission);
    usedTaskTypes.add(mission.taskType);
  }

  for (const mission of rotated) {
    if (selected.length >= count) break;
    if (!selected.some((item) => item.id === mission.id)) selected.push(mission);
  }

  return selected;
}

export function getTrainingMissionById(missionId?: string | null) {
  if (!missionId) return undefined;
  return getTrainingMissions().find((mission) => mission.id === missionId);
}

export function getNextTrainingMission(currentMissionId?: string | null) {
  const pool = getTrainingMissions();
  const currentIndex = pool.findIndex((mission) => mission.id === currentMissionId);
  if (currentIndex < 0) return pool[0];
  return pool[(currentIndex + 1) % pool.length];
}

export function getMissionPlanWithCachedQuestions(
  cachedMissionIds: readonly string[],
  fallbackPlan = getDailyTrainingMissionPlan()
) {
  const pool = getTrainingMissions();
  const used = new Set<string>();
  const cachedMissions = cachedMissionIds
    .map((missionId) => pool.find((mission) => mission.id === missionId))
    .filter((mission): mission is TrainingMission => Boolean(mission))
    .filter((mission) => {
      if (used.has(mission.id)) return false;
      used.add(mission.id);
      return true;
    });
  const remaining = fallbackPlan.filter((mission) => !used.has(mission.id));

  return [...cachedMissions, ...remaining].slice(0, fallbackPlan.length);
}

export function getMissionTarget(mission: TrainingMission): TrainingTarget {
  return getTrainingTargetById(mission.primaryDimension, mission.targetId);
}

export function formatTrainingMission(mission: TrainingMission) {
  return [
    `训练任务：${mission.title}`,
    `任务类型：${mission.taskType}`,
    `页面标签：${mission.displayLabel} / ${mission.label}`,
    `高阶能力：${mission.capability}`,
    `思考框架：${mission.framework}`,
    `可选产品域：${mission.productDomains.map((item) => `- ${item}`).join("\n")}`,
    `常见题型：${mission.scenarioPatterns.map((item) => `- ${item}`).join("\n")}`,
    `决策动作：${mission.decisionActions.map((item) => `- ${item}`).join("\n")}`,
    `证据类型：${mission.evidenceTypes.map((item) => `- ${item}`).join("\n")}`,
    `角色冲突：${mission.stakeholderConflicts.map((item) => `- ${item}`).join("\n")}`,
    `禁区：${mission.avoidPatterns.map((item) => `- ${item}`).join("\n")}`,
    `来源摘要：${mission.sourceNotes.join("；")}`,
  ].join("\n");
}
