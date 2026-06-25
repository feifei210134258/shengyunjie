import test from "node:test";
import assert from "node:assert/strict";
import {
  buildResumeProjectAnchors,
  formatResumeGroundingContext,
  questionUsesInvalidProjectCompanyPair,
  sanitizeFeedbackForCurrentQuestion,
} from "./grounding.ts";

const parsedProfile = {
  work_experience: [
    {
      company: "万商云集",
      title: "产品经理",
      highlights: ["负责教师智能助理低使用率场景筛选与策略调整"],
    },
    {
      company: "另一家公司",
      title: "产品经理",
      highlights: ["负责 BPM 流程引擎重构，配置耗时从 4 小时降到 1 小时"],
    },
  ],
  projects: [
    {
      name: "教师智能助理低使用率优化",
      description: "万商云集项目，围绕 AI 助理使用率提升做场景筛选。",
      role: "产品负责人",
      outcomes: ["低使用率场景完成试点优化"],
    },
    {
      name: "BPM 流程引擎重构",
      description: "另一家公司项目，重构流程配置能力。",
      role: "产品负责人",
      outcomes: ["配置耗时从 4 小时降到 1 小时"],
    },
  ],
};

test("project anchors preserve the company where the resume explicitly places each project", () => {
  const anchors = buildResumeProjectAnchors(parsedProfile);

  assert.equal(anchors[0].name, "教师智能助理低使用率优化");
  assert.equal(anchors[0].company, "万商云集");
  assert.equal(anchors[1].name, "BPM 流程引擎重构");
  assert.equal(anchors[1].company, "另一家公司");
});

test("project company parsed from markdown takes precedence over nearby work experience", () => {
  const anchors = buildResumeProjectAnchors({
    work_experience: [
      { company: "万商云集", highlights: ["负责教师智能助理"] },
      { company: "另一家公司", highlights: ["负责流程产品"] },
    ],
    projects: [
      {
        name: "BPM 流程引擎重构",
        company: "另一家公司",
        description: "重构流程配置能力，涉及万商云集客户反馈。",
      },
    ],
  });

  assert.equal(anchors[0].company, "另一家公司");
});

test("bootcamp generation rejects questions that mix a project with another company's name", () => {
  assert.equal(
    questionUsesInvalidProjectCompanyPair(
      "你在万商云集做 BPM 流程引擎重构时，怎么判断优先级最高？",
      parsedProfile
    ),
    true
  );

  assert.equal(
    questionUsesInvalidProjectCompanyPair(
      "你做 BPM 流程引擎重构时，怎么判断优先级最高？",
      parsedProfile
    ),
    false
  );
});

test("grounding context tells the model not to infer company-project ownership", () => {
  const context = formatResumeGroundingContext(parsedProfile);

  assert.match(context, /项目「教师智能助理低使用率优化」 \| 所属公司：万商云集/);
  assert.match(context, /项目「BPM 流程引擎重构」 \| 所属公司：另一家公司/);
});

test("feedback must overlap with the current question or answer before it is accepted", () => {
  assert.equal(
    sanitizeFeedbackForCurrentQuestion(
      "回答完全偏离了题目。题目要求围绕教师智能助理的 10 个场景选出过程。",
      "你做 BPM 流程引擎重构时，怎么判断优先级最高？",
      "我会先说明这个项目的背景，并比较改良和重构两个方案。"
    ),
    ""
  );

  assert.match(
    sanitizeFeedbackForCurrentQuestion(
      "你的回答提到了改良和重构两个方案，但需要补充 BPM 流程引擎重构的判断证据。",
      "你做 BPM 流程引擎重构时，怎么判断优先级最高？",
      "我会先说明这个项目的背景，并比较改良和重构两个方案。"
    ),
    /BPM 流程引擎重构/
  );
});

test("generic feedback that only mentions this project is not enough to pass grounding", () => {
  assert.equal(
    sanitizeFeedbackForCurrentQuestion(
      "这个项目的核心问题不是覆盖更多场景，而是识别低使用率场景。",
      "你做 BPM 流程引擎重构时，怎么判断优先级最高？",
      "我会先说明这个项目的背景，并比较改良和重构两个方案。"
    ),
    ""
  );
});
