import {
  getTrainingTarget,
  getTrainingTargetById,
  type TrainingTarget,
} from "./dimension-strategy.ts";
import { questionSimilarity } from "./similarity.ts";

export type TrainingQuestionSeed = {
  id: string;
  title: string;
  dimension: string;
  targetId: string;
  family: string;
  scenarioType: string;
  actionType: string;
  conflictType: string;
  evidenceType: string;
  source: string;
  sourceType: "internal" | "public";
  sourceUrl?: string;
  usageRights: "owned" | "licensed" | "reference-only";
  allowedToCopy: boolean;
  shell: string;
  promptAngle: string;
  variationAxes: string[];
  forbiddenPatterns: string[];
  available: boolean;
};

type SeedContext = {
  dimension?: string;
  targetId?: string | null;
  recentFamilies?: string[];
  recentQuestionTexts?: string[];
  todayQuestionTexts?: string[];
};

type SkeletonSignal = {
  id: string;
  patterns: RegExp[];
};

const skeletonSignals: SkeletonSignal[] = [
  {
    id: "saas-pricing-access",
    patterns: [/SaaS/i, /免费/, /付费/, /试用/, /套餐/, /权限/, /高级版/],
  },
  {
    id: "release-rollback-validation",
    patterns: [/上线/, /灰度/, /回滚/, /验证方案/, /观察周期/, /成功标准/],
  },
  {
    id: "default-permission-change",
    patterns: [/默认/, /开启/, /只读/, /可编辑/, /权限/, /自动生成/],
  },
  {
    id: "metric-guardrail-loop",
    patterns: [/转化率/, /投诉率/, /留存/, /护栏/, /指标/, /数据/],
  },
];

const seedPool: TrainingQuestionSeed[] = [
  {
    id: "seed-business-outcome-01",
    title: "订阅门槛调整后的业务结果判断",
    dimension: "战略思维",
    targetId: "business-outcome",
    family: "growth-gating",
    scenarioType: "SaaS订阅策略",
    actionType: "门槛调整",
    conflictType: "增长 vs 转化",
    evidenceType: "结果指标 + 护栏指标",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "企业协作工具把免费试用从无限期改为 7 天，并把完整功能改为预约开通。",
    promptAngle: "判断业务意图、牺牲项与验证路径",
    variationAxes: ["免费试用", "预约开通", "销售介入", "转化验证"],
    forbiddenPatterns: ["抽象战略规划", "宏观市场分析", "大作文"],
    available: true,
  },
  {
    id: "seed-business-outcome-02",
    title: "套餐分层后的价值判断",
    dimension: "战略思维",
    targetId: "value-capture",
    family: "pricing-tiering",
    scenarioType: "套餐设计",
    actionType: "分层打包",
    conflictType: "付费转化 vs 长尾覆盖",
    evidenceType: "转化率 + 客单价 + 续费",
    source: "公开产品文章改写",
    sourceType: "public",
    sourceUrl: "https://productschool.com/blog/job-search/the-ultimate-list-product-manager-interview-questions",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "企业知识管理产品计划把模板、协作和权限能力拆成免费版、专业版和企业版。",
    promptAngle: "判断哪个能力该收费，哪个能力该保留免费入口",
    variationAxes: ["免费迁移", "高级能力", "增购包", "客户分层"],
    forbiddenPatterns: ["泛泛涨价", "市场规模", "战略口号"],
    available: true,
  },
  {
    id: "seed-system-boundary-01",
    title: "外部协作者权限边界",
    dimension: "系统设计能力",
    targetId: "system-boundary",
    family: "permission-boundary",
    scenarioType: "权限模型",
    actionType: "边界定义",
    conflictType: "开放协作 vs 安全治理",
    evidenceType: "角色 + 状态 + 异常",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "文档协作产品要支持外部客户、供应商和临时协作者进入同一工作区。",
    promptAngle: "定义外部角色、访问边界和回收机制",
    variationAxes: ["外部角色", "超期访问", "离职回收", "审计记录"],
    forbiddenPatterns: ["只讲主流程", "只堆页面", "不讲异常"],
    available: true,
  },
  {
    id: "seed-data-causality-01",
    title: "指标异动后的归因判断",
    dimension: "数据决策能力",
    targetId: "metrics-causality",
    family: "metric-shift",
    scenarioType: "指标分析",
    actionType: "归因判断",
    conflictType: "表面增长 vs 真实改善",
    evidenceType: "对照组 + 口径 + 护栏",
    source: "公开案例整理",
    sourceType: "public",
    sourceUrl: "https://www.productplan.com/product-manager-interview-questions/",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "某功能上线后，活跃率上升但留存下滑，业务方认为方案有效。",
    promptAngle: "拆出指标口径、可能原因和最小验证",
    variationAxes: ["转化变化", "留存变化", "样本结构", "反证信号"],
    forbiddenPatterns: ["只罗列指标", "把相关性当因果"],
    available: true,
  },
  {
    id: "seed-user-insight-01",
    title: "客户点名要功能时的真实问题识别",
    dimension: "用户洞察与需求管理",
    targetId: "problem-framing",
    family: "request-reframing",
    scenarioType: "需求澄清",
    actionType: "问题重构",
    conflictType: "客户诉求 vs 真实任务",
    evidenceType: "访谈 + 任务 + 成功标准",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "一线客户连续提出多个具体功能，希望产品团队尽快排期。",
    promptAngle: "重构真实问题并定义 MVP 边界",
    variationAxes: ["客户声音", "老板指派", "一线抱怨", "任务场景"],
    forbiddenPatterns: ["照单全收", "直接给功能清单"],
    available: true,
  },
  {
    id: "seed-commercial-01",
    title: "功能收费与价值捕获",
    dimension: "商业思维",
    targetId: "value-capture",
    family: "monetization",
    scenarioType: "商业化设计",
    actionType: "收费判断",
    conflictType: "价值实现 vs 体验阻力",
    evidenceType: "客户分层 + 付费意愿 + 成本",
    source: "公开产品文章改写",
    sourceType: "public",
    sourceUrl: "https://theproductmanager.com/product-manager-interview-questions/",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "某协同产品希望把批量自动化能力从免费版迁移到高级版。",
    promptAngle: "判断收费边界和迁移节奏",
    variationAxes: ["免费迁移", "高级能力", "续费", "交付成本"],
    forbiddenPatterns: ["直接涨价", "空泛商业模式"],
    available: true,
  },
  {
    id: "seed-business-outcome-03",
    title: "短期留存与长期质量的取舍",
    dimension: "战略思维",
    targetId: "tradeoff",
    family: "tradeoff-quality",
    scenarioType: "增长取舍",
    actionType: "资源排序",
    conflictType: "短期增长 vs 长期稳定",
    evidenceType: "目标指标 + 风险指标",
    source: "公开面试题整理",
    sourceType: "public",
    sourceUrl: "https://interviewing.io/blog/product-manager-interview-questions",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "一个流量入口优化能让转化变快，但会显著增加后续客服和交付压力。",
    promptAngle: "判断先做什么、暂不做什么、如何验证",
    variationAxes: ["转化", "留存", "客服压力", "交付风险"],
    forbiddenPatterns: ["只谈愿景", "不谈放弃项"],
    available: true,
  },
  {
    id: "seed-business-outcome-04",
    title: "默认策略从关闭改为开启",
    dimension: "战略思维",
    targetId: "business-outcome",
    family: "default-setting",
    scenarioType: "默认策略",
    actionType: "默认值调整",
    conflictType: "转化提升 vs 用户摩擦",
    evidenceType: "漏斗 + 护栏",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "某产品把原先需要手动开启的自动提醒改为默认开启。",
    promptAngle: "判断这个动作在优化什么业务结果，以及如何验证",
    variationAxes: ["默认开启", "漏斗变化", "用户摩擦", "反向护栏"],
    forbiddenPatterns: ["宏观战略", "单指标结论"],
    available: true,
  },
  {
    id: "seed-tradeoff-01",
    title: "大客户定制与通用能力取舍",
    dimension: "战略思维",
    targetId: "tradeoff",
    family: "custom-vs-standard",
    scenarioType: "能力建设",
    actionType: "资源排序",
    conflictType: "大客户定制 vs 通用能力",
    evidenceType: "交付成本 + 复用率 + 收入",
    source: "公开面试题整理",
    sourceType: "public",
    sourceUrl: "https://interviewing.io/blog/product-manager-interview-questions",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "几个大客户同时要求单独的流程定制，但产品团队只有一条主线资源。",
    promptAngle: "判断先做通用还是定制，以及放弃什么",
    variationAxes: ["通用能力", "定制需求", "资源约束", "复用价值"],
    forbiddenPatterns: ["平均主义", "只谈客户满意"],
    available: true,
  },
  {
    id: "seed-tradeoff-02",
    title: "合规风险与上线节奏取舍",
    dimension: "战略思维",
    targetId: "tradeoff",
    family: "risk-release",
    scenarioType: "发布策略",
    actionType: "上线判断",
    conflictType: "速度 vs 风险",
    evidenceType: "风险阈值 + 灰度",
    source: "公开产品文章改写",
    sourceType: "public",
    sourceUrl: "https://productschool.com/blog/job-search/the-ultimate-list-product-manager-interview-questions",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "产品上线前发现部分地区的数据合规规则还没有完全确认。",
    promptAngle: "判断是延期、灰度还是先上线部分能力",
    variationAxes: ["合规风险", "灰度发布", "回滚条件", "范围收缩"],
    forbiddenPatterns: ["只说按时上线", "不谈风险边界"],
    available: true,
  },
  {
    id: "seed-tradeoff-03",
    title: "短期指标与长期架构的平衡",
    dimension: "战略思维",
    targetId: "tradeoff",
    family: "architecture-payoff",
    scenarioType: "架构投入",
    actionType: "长期投入",
    conflictType: "短期增长 vs 长期稳定",
    evidenceType: "短期指标 + 架构收益",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "当前版本改动可以立刻提升转化，但会让后续多个模块的维护复杂度大幅上升。",
    promptAngle: "判断现在是否值得为长期架构付出短期代价",
    variationAxes: ["短期转化", "长期维护", "技术债", "复盘窗口"],
    forbiddenPatterns: ["空谈愿景", "只说技术"],
    available: true,
  },
  {
    id: "seed-tradeoff-04",
    title: "增长机会优先级重排",
    dimension: "战略思维",
    targetId: "business-outcome",
    family: "expansion-priority",
    scenarioType: "机会排序",
    actionType: "优先级调整",
    conflictType: "现有产品增长 vs 新机会探索",
    evidenceType: "机会成本 + 验证信号",
    source: "公开案例整理",
    sourceType: "public",
    sourceUrl: "https://theproductmanager.com/product-manager-interview-questions/",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "团队同时看到一个新的增长方向和一个现有功能升级机会，但资源只能支持一个。",
    promptAngle: "判断先做哪个，并说明另一个为什么暂缓",
    variationAxes: ["新机会", "现有功能", "资源约束", "验证信号"],
    forbiddenPatterns: ["战略空话", "平铺直叙"],
    available: true,
  },
  {
    id: "seed-system-boundary-02",
    title: "审批流程改造的异常回收",
    dimension: "系统设计能力",
    targetId: "system-boundary",
    family: "approval-recovery",
    scenarioType: "审批流程",
    actionType: "规则改造",
    conflictType: "效率 vs 风险",
    evidenceType: "异常路径 + 审计链路",
    source: "公开产品文章改写",
    sourceType: "public",
    sourceUrl: "https://productschool.com/blog/job-search/the-ultimate-list-product-manager-interview-questions",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "企业审批系统把普通申请改为自动审批，但保留高风险订单人工复核。",
    promptAngle: "定义自动审批边界和异常回收机制",
    variationAxes: ["自动审批", "高风险复核", "异常回收", "审计"],
    forbiddenPatterns: ["只讲理想流程", "不谈异常和审计"],
    available: true,
  },
  {
    id: "seed-system-boundary-03",
    title: "第三方集成后的边界治理",
    dimension: "系统设计能力",
    targetId: "system-boundary",
    family: "integration-boundary",
    scenarioType: "第三方集成",
    actionType: "边界定义",
    conflictType: "开放集成 vs 系统责任",
    evidenceType: "权限 + 回收 + 审计",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "平台要接入第三方 CRM，用户希望同步客户、工单和状态变更。",
    promptAngle: "明确平台负责什么、不负责什么，以及异常如何回收",
    variationAxes: ["第三方同步", "失败回收", "权限", "审计"],
    forbiddenPatterns: ["只讲接口", "忽略失败"],
    available: true,
  },
  {
    id: "seed-system-boundary-04",
    title: "平台化能力抽象",
    dimension: "系统设计能力",
    targetId: "system-boundary",
    family: "module-abstraction",
    scenarioType: "能力平台化",
    actionType: "模块抽象",
    conflictType: "单客户需求 vs 通用能力",
    evidenceType: "模块边界 + 依赖关系",
    source: "公开面试题整理",
    sourceType: "public",
    sourceUrl: "https://www.productplan.com/product-manager-interview-questions/",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "某单客户流程已经被反复扩展，团队准备把它抽成可复用能力。",
    promptAngle: "判断要抽象哪些模块，以及先补哪些边界",
    variationAxes: ["通用能力", "模块依赖", "定制回收", "复用率"],
    forbiddenPatterns: ["只讲页面拆分", "没有边界意识"],
    available: true,
  },
  {
    id: "seed-system-boundary-05",
    title: "发布风险与灰度回滚",
    dimension: "系统设计能力",
    targetId: "quality-delivery",
    family: "release-rollback",
    scenarioType: "质量交付",
    actionType: "发布判断",
    conflictType: "上线速度 vs 稳定性",
    evidenceType: "灰度 + 回滚 + 监控",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "新版本上线前，压测通过，但少量核心客户担心功能切换后的稳定性。",
    promptAngle: "定义灰度、回滚和验收标准",
    variationAxes: ["灰度", "回滚", "监控", "验收"],
    forbiddenPatterns: ["只说按期发布", "不谈风险"],
    available: true,
  },
  {
    id: "seed-data-causality-02",
    title: "实验有效性与护栏指标",
    dimension: "数据决策能力",
    targetId: "metrics-causality",
    family: "experiment-guardrail",
    scenarioType: "A/B实验",
    actionType: "验证判断",
    conflictType: "结果指标 vs 风险指标",
    evidenceType: "实验设计 + 护栏",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "某实验把首页改版后转化率提升，但客服工单也同步上升。",
    promptAngle: "判断实验是否真的有效，以及该看哪些护栏",
    variationAxes: ["A/B测试", "护栏指标", "工单变化", "留存变化"],
    forbiddenPatterns: ["只看结果", "忽略风险", "误判相关性"],
    available: true,
  },
  {
    id: "seed-data-causality-03",
    title: "样本结构变化下的归因",
    dimension: "数据决策能力",
    targetId: "metrics-causality",
    family: "sample-shift",
    scenarioType: "指标分析",
    actionType: "归因判断",
    conflictType: "整体提升 vs 局部下滑",
    evidenceType: "分层对照 + 样本结构",
    source: "公开产品文章改写",
    sourceType: "public",
    sourceUrl: "https://productschool.com/blog/job-search/the-ultimate-list-product-manager-interview-questions",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "整体转化率提升了，但核心大客户分层里的转化却明显下降。",
    promptAngle: "判断是不是样本结构变化带来的假象",
    variationAxes: ["样本结构", "分层对照", "局部下滑", "整体提升"],
    forbiddenPatterns: ["只看总指标", "忽视分层"],
    available: true,
  },
  {
    id: "seed-data-causality-04",
    title: "最小验证方案设计",
    dimension: "数据决策能力",
    targetId: "metrics-causality",
    family: "minimum-viable-test",
    scenarioType: "验证设计",
    actionType: "最小验证",
    conflictType: "证据不足 vs 决策需要",
    evidenceType: "假设 + 验证 + 反证",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "团队没法立刻做完整实验，但需要尽快判断一个功能是否值得继续投资源。",
    promptAngle: "设计一个最低成本的验证方案",
    variationAxes: ["最小实验", "低成本验证", "反证", "决策窗口"],
    forbiddenPatterns: ["空泛指标", "没有验证路径"],
    available: true,
  },
  {
    id: "seed-data-causality-05",
    title: "复盘中的因果边界",
    dimension: "数据决策能力",
    targetId: "iteration-review",
    family: "post-launch-review",
    scenarioType: "复盘迭代",
    actionType: "结果解释",
    conflictType: "短期达成 vs 长期偏差",
    evidenceType: "上线前假设 + 结果指标 + 反向信号",
    source: "公开案例整理",
    sourceType: "public",
    sourceUrl: "https://www.productplan.com/product-manager-interview-questions/",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "功能上线后短期指标达成了，但长期用户反馈出现新的负面迹象。",
    promptAngle: "判断结果算不算成功，以及下一步该怎么调",
    variationAxes: ["复盘", "反向信号", "假设对照", "下一步动作"],
    forbiddenPatterns: ["只复述数据", "不谈偏差"],
    available: true,
  },
  {
    id: "seed-user-insight-02",
    title: "老板拍板后的追问路径",
    dimension: "用户洞察与需求管理",
    targetId: "problem-framing",
    family: "boss-directive",
    scenarioType: "需求输入",
    actionType: "追问澄清",
    conflictType: "管理层意图 vs 用户真实任务",
    evidenceType: "场景 + 约束 + 成功标准",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "管理层直接要求团队在两周内上线一个新入口，不给更多背景。",
    promptAngle: "从指定动作中重构真实问题和边界",
    variationAxes: ["老板指派", "两周上线", "成功标准", "不做什么"],
    forbiddenPatterns: ["直接执行", "不追问"],
    available: true,
  },
  {
    id: "seed-user-insight-03",
    title: "客户投诉背后的真实任务",
    dimension: "用户洞察与需求管理",
    targetId: "problem-framing",
    family: "complaint-reframe",
    scenarioType: "用户反馈",
    actionType: "问题重构",
    conflictType: "表层抱怨 vs 真实任务",
    evidenceType: "追问 + 场景 + 成功标准",
    source: "公开面试题整理",
    sourceType: "public",
    sourceUrl: "https://theproductmanager.com/product-manager-interview-questions/",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "客户反馈产品难用，希望团队直接加一个更醒目的按钮。",
    promptAngle: "判断这是真问题还是症状，并定义第一版边界",
    variationAxes: ["投诉", "追问", "MVP", "不做什么"],
    forbiddenPatterns: ["照单全收", "直接堆功能"],
    available: true,
  },
  {
    id: "seed-user-insight-04",
    title: "需求优先级与拒绝方式",
    dimension: "用户洞察与需求管理",
    targetId: "stakeholder-influence",
    family: "priority-rejection",
    scenarioType: "需求排序",
    actionType: "优先级判断",
    conflictType: "销售诉求 vs 研发容量",
    evidenceType: "影响面 + 成本 + 决策机制",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "销售和客户成功同时要求不同的高优先级需求，但研发排期已经满了。",
    promptAngle: "判断怎么排，并怎么拒绝",
    variationAxes: ["销售", "客成", "研发容量", "决策机制"],
    forbiddenPatterns: ["只说沟通", "没有排序依据"],
    available: true,
  },
  {
    id: "seed-user-insight-05",
    title: "MVP 边界与第一版不做什么",
    dimension: "用户洞察与需求管理",
    targetId: "problem-framing",
    family: "mvp-boundary",
    scenarioType: "版本定义",
    actionType: "边界收敛",
    conflictType: "一次做完 vs 先验证",
    evidenceType: "任务优先级 + 风险",
    source: "公开产品文章改写",
    sourceType: "public",
    sourceUrl: "https://productschool.com/blog/job-search/the-ultimate-list-product-manager-interview-questions",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "你要为一个新功能定第一版范围，但业务方一直希望一次性覆盖全部场景。",
    promptAngle: "定义第一版做什么、不做什么，以及为什么",
    variationAxes: ["MVP", "不做什么", "验证路径", "范围收敛"],
    forbiddenPatterns: ["一口吃成胖子", "没有边界"],
    available: true,
  },
  {
    id: "seed-commercial-02",
    title: "高价值客户与长尾客户取舍",
    dimension: "商业思维",
    targetId: "value-capture",
    family: "segment-tradeoff",
    scenarioType: "客户分层",
    actionType: "资源分配",
    conflictType: "高价值客户 vs 长尾覆盖",
    evidenceType: "收入 + 交付成本 + 续费",
    source: "公开案例整理",
    sourceType: "public",
    sourceUrl: "https://theproductmanager.com/product-manager-interview-questions/",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "产品团队发现少数大客户能带来明显收入，但定制需求会显著拉高交付复杂度。",
    promptAngle: "判断是否该偏向高价值客户，以及如何控制交付成本",
    variationAxes: ["客户分层", "交付复杂度", "收入", "续费"],
    forbiddenPatterns: ["空泛商业模式", "直接涨价"],
    available: true,
  },
  {
    id: "seed-commercial-03",
    title: "增购包如何设计",
    dimension: "商业思维",
    targetId: "value-capture",
    family: "upsell-packaging",
    scenarioType: "套餐设计",
    actionType: "打包设计",
    conflictType: "付费升级 vs 体验阻力",
    evidenceType: "升级率 + 续费 + 使用深度",
    source: "公开产品文章改写",
    sourceType: "public",
    sourceUrl: "https://productschool.com/blog/job-search/the-ultimate-list-product-manager-interview-questions",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "基础版客户已经能覆盖核心任务，但高级能力的需求开始明显增长。",
    promptAngle: "判断增购包怎么切，以及何时推出",
    variationAxes: ["增购包", "升级率", "客户分层", "使用深度"],
    forbiddenPatterns: ["只提涨价", "不考虑升级路径"],
    available: true,
  },
  {
    id: "seed-commercial-04",
    title: "免费能力迁移节奏",
    dimension: "商业思维",
    targetId: "value-capture",
    family: "free-migration",
    scenarioType: "免费迁移",
    actionType: "能力迁移",
    conflictType: "免费口碑 vs 付费转化",
    evidenceType: "流失率 + 转化率 + 留存",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "团队准备把原来免费开放的部分核心能力迁移到付费版。",
    promptAngle: "判断迁移节奏和对免费用户的影响",
    variationAxes: ["免费迁移", "留存", "转化", "口碑"],
    forbiddenPatterns: ["简单涨价", "忽视用户反弹"],
    available: true,
  },
  {
    id: "seed-commercial-05",
    title: "交付成本与商业回收",
    dimension: "商业思维",
    targetId: "value-capture",
    family: "delivery-recovery",
    scenarioType: "商业化设计",
    actionType: "成本控制",
    conflictType: "收入增长 vs 交付成本",
    evidenceType: "毛利 + 交付成本 + 续费",
    source: "公开面试题整理",
    sourceType: "public",
    sourceUrl: "https://www.productplan.com/product-manager-interview-questions/",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "某项高价值能力虽然能带来收入，但每次实施都要消耗大量售前和交付资源。",
    promptAngle: "判断这项能力是否值得商业化，以及怎么控成本",
    variationAxes: ["商业化", "交付成本", "毛利", "续费"],
    forbiddenPatterns: ["只谈收入", "不看成本"],
    available: true,
  },
  {
    id: "seed-commercial-06",
    title: "免费与付费边界回收",
    dimension: "商业思维",
    targetId: "free-migration",
    family: "boundary-migration",
    scenarioType: "免费能力",
    actionType: "边界收缩",
    conflictType: "免费体验 vs 付费转化",
    evidenceType: "留存 + 转化 + 口碑",
    source: "内部整理",
    sourceType: "internal",
    usageRights: "owned",
    allowedToCopy: true,
    shell: "产品准备把原先免费开放的高级筛选能力收回到付费版。",
    promptAngle: "判断边界怎么收、怎么解释、怎么验证",
    variationAxes: ["免费边界", "转化", "留存", "用户反弹"],
    forbiddenPatterns: ["简单涨价", "不看反弹"],
    available: true,
  },
  {
    id: "seed-commercial-07",
    title: "按使用深度做分层",
    dimension: "商业思维",
    targetId: "value-capture",
    family: "usage-tiering",
    scenarioType: "套餐设计",
    actionType: "分层打包",
    conflictType: "收入优化 vs 体验阻力",
    evidenceType: "使用深度 + 升级率 + 客单价",
    source: "公开产品文章改写",
    sourceType: "public",
    sourceUrl: "https://productschool.com/blog/job-search/the-ultimate-list-product-manager-interview-questions",
    usageRights: "reference-only",
    allowedToCopy: false,
    shell: "某协作产品想根据使用深度把能力拆成基础、进阶和企业三档。",
    promptAngle: "判断分层依据和升级信号",
    variationAxes: ["使用深度", "升级率", "套餐分层", "续费"],
    forbiddenPatterns: ["只提涨价", "没有分层依据"],
    available: true,
  },
];

function normalizeText(value: string | undefined) {
  return String(value || "").trim();
}

function skeletonText(seed: TrainingQuestionSeed) {
  return [
    seed.title,
    seed.family,
    seed.scenarioType,
    seed.actionType,
    seed.conflictType,
    seed.evidenceType,
    seed.shell,
    seed.promptAngle,
    ...seed.variationAxes,
  ].join(" ");
}

function detectSkeletonSignals(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return new Set<string>();

  return new Set(
    skeletonSignals
      .filter((signal) =>
        signal.patterns.some((pattern) => pattern.test(normalized))
      )
      .map((signal) => signal.id)
  );
}

function getCrowdedTodaySignals(todayTexts: string[]) {
  const counts = new Map<string, number>();
  for (const text of todayTexts) {
    for (const signal of detectSkeletonSignals(text)) {
      counts.set(signal, (counts.get(signal) || 0) + 1);
    }
  }

  return new Set(
    Array.from(counts.entries())
      .filter(
        ([signal, count]) =>
          count >= 2 ||
          (todayTexts.length >= 3 &&
            signal === "release-rollback-validation" &&
            count >= 1)
      )
      .map(([signal]) => signal)
  );
}

function hasCrowdedSkeleton(seed: TrainingQuestionSeed, crowdedSignals: Set<string>) {
  if (!crowdedSignals.size) return false;
  const seedSignals = detectSkeletonSignals(skeletonText(seed));
  for (const signal of seedSignals) {
    if (crowdedSignals.has(signal)) return true;
  }
  return false;
}

function scoreSeedMatch(seed: TrainingQuestionSeed, context: SeedContext) {
  let score = 0;

  if (context.dimension && seed.dimension === context.dimension) score += 4;
  if (context.targetId && seed.targetId === context.targetId) score += 3;
  if (context.recentFamilies?.includes(seed.family)) score -= 8;

  const recentTexts = context.recentQuestionTexts || [];
  if (recentTexts.length) {
    const overlap = recentTexts.reduce(
      (max, text) => Math.max(max, questionSimilarity(text, seed.shell + seed.promptAngle)),
      0
    );
    score -= overlap * 6;
  }

  const todayTexts = context.todayQuestionTexts || [];
  if (todayTexts.length) {
    const overlap = todayTexts.reduce(
      (max, text) => Math.max(max, questionSimilarity(text, seed.shell + seed.promptAngle)),
      0
    );
    score -= overlap * 8;

    const crowdedSignals = getCrowdedTodaySignals(todayTexts);
    const seedSignals = detectSkeletonSignals(skeletonText(seed));
    for (const signal of seedSignals) {
      if (crowdedSignals.has(signal)) score -= 7;
    }
  }

  return score;
}

export function getTrainingQuestionSeeds() {
  return seedPool.filter((seed) => seed.available);
}

export function getTrainingQuestionSeedById(seedId?: string | null) {
  if (!seedId) return undefined;
  return getTrainingQuestionSeeds().find((seed) => seed.id === seedId);
}

export function pickTrainingQuestionSeed(context: SeedContext = {}) {
  const pool = getTrainingQuestionSeeds();
  const target = context.targetId
    ? getTrainingTargetById(context.dimension, context.targetId)
    : getTrainingTarget(context.dimension);
  const crowdedSignals = getCrowdedTodaySignals(context.todayQuestionTexts || []);
  const dimensionPool = pool.filter(
    (seed) => !context.dimension || seed.dimension === context.dimension
  );
  const lessCrowdedPool = dimensionPool.filter(
    (seed) => !hasCrowdedSkeleton(seed, crowdedSignals)
  );
  const candidatePool = lessCrowdedPool.length ? lessCrowdedPool : dimensionPool;

  const scored = candidatePool
    .map((seed) => ({
      seed,
      score: scoreSeedMatch(seed, context),
      isTargetMatch: seed.targetId === target.id,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.isTargetMatch !== b.isTargetMatch) return a.isTargetMatch ? -1 : 1;
      return a.seed.id.localeCompare(b.seed.id);
    });

  return scored[0]?.seed || pool[0];
}

export function formatTrainingQuestionSeed(seed: TrainingQuestionSeed) {
  return `题库种子：
【标题】${seed.title}
【来源】${seed.source}（${seed.sourceType}）
【训练家族】${seed.family}
【场景壳子】${seed.shell}
【决策动作】${seed.actionType}
【冲突类型】${seed.conflictType}
【证据类型】${seed.evidenceType}
【可用变化轴】${seed.variationAxes.join("、")}
【靶点禁区】${seed.forbiddenPatterns.join("、")}
【改写要求】${seed.promptAngle}`;
}

export function describeSeedForPrompt(seed: TrainingQuestionSeed) {
  const target = getTrainingTargetById(seed.dimension, seed.targetId);

  return {
    ...seed,
    targetLabel: target.label,
    targetFramework: target.framework,
  };
}

export function getRecentQuestionFamiliesFromSeeds(
  questionTexts: string[],
  maxCount = 3
) {
  return questionTexts
    .slice(0, maxCount)
    .map((text) => normalizeText(text))
    .filter(Boolean)
    .map((text) => {
      const matchedSeed = getTrainingQuestionSeeds().find(
        (seed) =>
          questionSimilarity(text, seed.shell) >= 0.4 ||
          questionSimilarity(text, seed.promptAngle) >= 0.5
      );
      return matchedSeed?.family || "";
    })
    .filter(Boolean);
}
