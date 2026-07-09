import assert from "node:assert/strict";
import test from "node:test";

import { buildStoryBank, updateParsedProfileProject } from "./story-bank.ts";

const parsedProfile = {
  work_experience: [
    {
      company: "云杉科技",
      title: "高级产品经理",
      duration: "2021-2025",
      highlights: ["负责客户健康度和续费增长相关产品"],
    },
  ],
  projects: [
    {
      name: "客户健康度评分系统",
      company: "云杉科技",
      description: "面向客户成功团队识别续费风险和扩容机会。",
      role: "产品负责人",
      outcomes: ["续费风险识别提前 14 天", "CS 跟进效率提升 23%"],
    },
    {
      name: "权限审批流重构",
      company: "云杉科技",
      description: "重构企业客户复杂权限与审批配置。",
      role: "产品负责人",
      outcomes: [],
    },
  ],
  skills: ["B 端 SaaS", "数据产品"],
  education: [],
};

test("builds project stories from resume projects and evaluated interviews", () => {
  const result = buildStoryBank({
    session: {
      id: "session-1",
      current_day: 2,
      status: "in_progress",
      parsed_profile: parsedProfile,
      weakness_prediction: {
        weak_dimensions: [
          {
            dimension: "指标归因",
            severity: "high",
            gap_description: "容易只说结果，缺少归因证据。",
          },
        ],
        recommended_focus: ["项目复盘", "指标归因"],
      },
    },
    interviews: [
      {
        id: "q1",
        day_number: 1,
        question_index: 1,
        question_text:
          "请复盘客户健康度评分系统：业务问题是什么，如何证明续费结果来自产品动作？",
        question_type: "data_driven",
        difficulty: 3,
        user_answer: "我先拆客户分层，再看续费风险命中率和 CS 跟进动作。",
        ai_evaluation: {
          overall_score: 7.4,
          strengths: ["能提到客户分层和风险命中率"],
          gaps: ["还缺少反证和归因排除"],
          improved_answer:
            "这个项目我会先讲清续费风险识别滞后的问题，再说明评分模型如何拆分客户行为、工单和使用深度，最后用命中率、提前量和 CS 转化动作证明效果。",
        },
        status: "evaluated",
      },
    ],
  });

  assert.equal(result.summary.totalProjects, 2);
  assert.equal(result.summary.answeredQuestions, 1);
  assert.equal(result.projectStories[0].projectName, "客户健康度评分系统");
  assert.equal(result.projectStories[0].evidenceItems.length, 1);
  assert.match(result.projectStories[0].interviewReadyAnswer, /续费风险识别/);
  assert.match(result.projectStories[0].interviewScript.fullScript, /客户健康度评分系统/);
  assert.match(result.projectStories[0].interviewScript.sections[0].label, /开场/);
  assert.ok(result.projectStories[0].interviewScript.sections.length >= 4);
  assert.ok(result.projectStories[0].readinessScore > result.projectStories[1].readinessScore);
  assert.ok(result.projectStories[1].proofGaps.some((gap) => gap.includes("结果指标")));
});

test("keeps unmatched interview answers as general story assets", () => {
  const result = buildStoryBank({
    session: {
      id: "session-1",
      current_day: 1,
      status: "in_progress",
      parsed_profile: parsedProfile,
      weakness_prediction: null,
    },
    interviews: [
      {
        id: "q2",
        day_number: 1,
        question_index: 2,
        question_text: "请讲一次你推翻原方案的经历。",
        question_type: "strategy",
        difficulty: 2,
        user_answer: "我在一次项目评审里用客户反馈推翻了原方案。",
        ai_evaluation: {
          overall_score: 6.1,
          strengths: ["有推翻方案的动作"],
          gaps: ["缺少项目对象和结果"],
          improved_answer: "我会用一次具体评审说明自己如何识别风险、调整方案并复盘结果。",
        },
        status: "evaluated",
      },
    ],
  });

  assert.equal(result.generalAssets.length, 1);
  assert.equal(result.generalAssets[0].questionId, "q2");
  assert.match(result.recommendedNextAction.href, /interview|resume/);
});

test("adds daily training expression cards as interview story assets", () => {
  const result = buildStoryBank({
    session: {
      id: "session-1",
      current_day: 1,
      status: "in_progress",
      parsed_profile: parsedProfile,
      weakness_prediction: null,
    },
    interviews: [],
    trainingRecords: [
      {
        id: "training-1",
        dimension: "commercial_thinking",
        question_scenario: "CRM 套餐调整后，续费团队和交付团队对客户分层口径产生冲突。",
        user_answer: "我会先按客户价值和交付成本分层。",
        score: 82,
        ai_feedback: {
          strength: "你能把客户价值、付费边界和交付成本放在同一个判断里。",
          weakness: "还需要补充续费结果如何归因到产品动作。",
          __revision: {
            revisedAnswer:
              "我会先按客户价值和交付成本分层，再明确哪些客户适合升级套餐，并用续费率和交付投入变化验证。",
            savedAt: "2026-07-08T08:00:00.000Z",
          },
        },
      },
    ],
  });

  assert.equal(result.trainingExpressionAssets.length, 1);
  assert.equal(result.trainingExpressionAssets[0].sourceRecordId, "training-1");
  assert.equal(result.trainingExpressionAssets[0].readiness, "面试可用");
  assert.match(result.trainingExpressionAssets[0].copyScript, /客户价值/);
  assert.equal(result.generalAssets[0].questionId, "training-1");
  assert.equal(result.generalAssets[0].sourceLabel, "日常训练");
});

test("prioritizes projects against the persisted interview target brief", () => {
  const result = buildStoryBank({
    session: {
      id: "session-target",
      current_day: 1,
      status: "in_progress",
      parsed_profile: parsedProfile,
      weakness_prediction: null,
    },
    interviews: [],
    latestGoalBrief: {
      targetRole: "高级 B 端产品经理",
      targetScenario: "SaaS 平台负责人面试，重点考续费增长和数据经营",
      targetDeadline: "2026-07-22",
    },
  });

  assert.deepEqual(result.latestGoalBrief, {
    targetRole: "高级 B 端产品经理",
    targetScenario: "SaaS 平台负责人面试，重点考续费增长和数据经营",
    targetDeadline: "2026-07-22",
  });
  assert.equal(result.summary.targetPriorityProject, "客户健康度评分系统");
  assert.equal(result.projectStories[0].targetFit.priorityLabel, "优先讲");
  assert.ok(result.projectStories[0].targetFit.score > result.projectStories[1].targetFit.score);
  assert.match(result.projectStories[0].targetFit.reason, /续费增长|SaaS|数据经营/);
  assert.match(result.projectStories[0].targetFit.missingEvidence.join(" "), /目标岗位|目标场景/);
});

test("builds a target evidence repair workspace from saved project evidence", () => {
  const result = buildStoryBank({
    session: {
      id: "session-target-repair",
      current_day: 1,
      status: "in_progress",
      parsed_profile: {
        ...parsedProfile,
        projects: [
          {
            ...parsedProfile.projects[0],
            targetEvidence:
              "面向 SaaS 平台负责人面试，我会补充：客户健康度模型上线后续费风险提前 14 天识别，CS 跟进动作使高风险客户续费率提升 8.6%。",
          },
        ],
      },
      weakness_prediction: null,
    },
    interviews: [],
    latestGoalBrief: {
      targetRole: "高级 B 端产品经理",
      targetScenario: "SaaS 平台负责人面试，重点考续费增长",
      targetDeadline: "两周内",
    },
  });

  const story = result.projectStories[0];
  assert.match(story.targetEvidenceRepair.focusGap, /目标证据已补/);
  assert.match(story.targetEvidenceRepair.savedEvidence, /续费率提升 8\.6%/);
  assert.match(story.targetEvidenceRepair.prompt, /高级 B 端产品经理|SaaS 平台负责人面试/);
  assert.match(story.interviewScript.fullScript, /续费率提升 8\.6%/);
});

test("marks target evidence as satisfied after the user repairs it", () => {
  const result = buildStoryBank({
    session: {
      id: "session-target-satisfied",
      current_day: 1,
      status: "in_progress",
      parsed_profile: {
        ...parsedProfile,
        projects: [
          {
            ...parsedProfile.projects[0],
            targetEvidence:
              "这段项目证明我能面向续费增长做高级判断：先用健康度模型提前识别风险，再用 CS 跟进转化和续费率提升排除偶然波动。",
          },
        ],
      },
      weakness_prediction: null,
    },
    interviews: [],
    latestGoalBrief: {
      targetRole: "高级 B 端产品经理",
      targetScenario: "SaaS 平台负责人面试，重点考续费增长",
      targetDeadline: "两周内",
    },
  });

  const story = result.projectStories[0];
  assert.deepEqual(story.targetFit.missingEvidence, []);
  assert.match(story.targetFit.reason, /已补目标证据|续费增长/);
  assert.match(story.targetEvidenceRepair.focusGap, /目标证据已补/);
  assert.equal(result.recommendedNextAction.label, "沉淀项目故事包");
  assert.match(result.recommendedNextAction.reason, /目标证据已补|画像账本/);
});

test("builds a final interview answer package from defended target evidence", () => {
  const result = buildStoryBank({
    session: {
      id: "session-final-package",
      current_day: 1,
      status: "in_progress",
      parsed_profile: {
        ...parsedProfile,
        projects: [
          {
            ...parsedProfile.projects[0],
            targetEvidence:
              "客户健康度模型上线后续费风险提前 14 天识别，并通过 CS 跟进转化排除单纯运营动作影响。",
            finalInterviewAnswer:
              "我主讲客户健康度评分系统：先判断续费风险识别滞后不是单点提醒问题，而是客户分层和跟进优先级问题；我负责定义健康度模型、风险分层和 CS 跟进机制，最终让续费风险提前 14 天识别，并用高风险客户续费率变化验证效果。",
          },
        ],
      },
      weakness_prediction: null,
    },
    interviews: [],
    latestGoalBrief: {
      targetRole: "高级 B 端产品经理",
      targetScenario: "SaaS 平台负责人面试，重点考续费增长",
      targetDeadline: "两周内",
    },
  });

  const story = result.projectStories[0];
  assert.match(story.finalInterviewPackage.prompt, /90 秒|终版表达/);
  assert.match(story.finalInterviewPackage.suggestedAnswer, /客户健康度评分系统/);
  assert.match(story.finalInterviewPackage.suggestedAnswer, /续费风险提前 14 天/);
  assert.match(story.finalInterviewPackage.savedAnswer, /续费风险识别滞后/);
  assert.equal(story.finalInterviewPackage.isSaved, true);
});

test("updates one resume project evidence without changing other projects", () => {
  const updated = updateParsedProfileProject(parsedProfile, {
    projectName: "权限审批流重构",
    role: "从 0 到 1 负责权限模型、审批链路和灰度上线",
    description: "解决大客户多角色权限配置混乱、审批链路不可追踪的问题。",
    outcomesText: "审批配置时长下降 31%\n权限相关工单下降 18%",
    targetEvidenceText:
      "这段项目能证明我处理复杂 B 端权限治理：先定义角色边界，再用工单下降验证效果。",
    finalInterviewAnswerText:
      "我会把权限审批流重构打包成 90 秒表达：先讲权限治理的客户价值，再讲角色边界、审批链路和灰度上线，最后用配置时长下降 31% 证明结果。",
  });

  assert.equal(updated.projects[0].role, "产品负责人");
  assert.equal(
    updated.projects[1].role,
    "从 0 到 1 负责权限模型、审批链路和灰度上线"
  );
  assert.equal(
    updated.projects[1].description,
    "解决大客户多角色权限配置混乱、审批链路不可追踪的问题。"
  );
  assert.deepEqual(updated.projects[1].outcomes, [
    "审批配置时长下降 31%",
    "权限相关工单下降 18%",
  ]);
  assert.equal(
    updated.projects[1].targetEvidence,
    "这段项目能证明我处理复杂 B 端权限治理：先定义角色边界，再用工单下降验证效果。"
  );
  assert.equal(
    updated.projects[1].finalInterviewAnswer,
    "我会把权限审批流重构打包成 90 秒表达：先讲权限治理的客户价值，再讲角色边界、审批链路和灰度上线，最后用配置时长下降 31% 证明结果。"
  );
});
