import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { getChatModel, getThinkingModel } from "@/lib/ai";
import { createServerClient } from "@/lib/supabase-server";
import {
  normalizeTrainingEvaluation,
  parseJsonFromAiText,
} from "@/lib/training/personalization";

const CASE_DIMENSION = "战略思维";

type SimulationScenario = {
  title: string;
  product: string;
  role: string;
  context: string;
  decision: string;
  constraints: string[];
  success_metrics: string[];
  hidden_risks: string[];
};

function fallbackScenario(product: string): SimulationScenario {
  return {
    title: `${product} 的付费转化取舍`,
    product,
    role: "B 端产品负责人",
    context:
      "团队发现新用户激活率稳定，但从试用到付费的转化偏低。销售希望增加强提醒和人工介入，客户成功担心打扰用户，研发资源只能支持一个小版本。",
    decision:
      "你会优先做哪一个动作：优化试用期引导、增加销售触达入口、调整套餐权益，还是先补数据埋点？请说明判断依据和取舍。",
    constraints: ["两周内要看到早期信号", "不能明显增加一线团队工作量", "研发资源只能支持一个主方案"],
    success_metrics: ["试用到付费转化率", "关键功能首次使用率", "销售有效线索率"],
    hidden_risks: ["把相关性误判为因果", "过早打扰高潜用户", "只优化短期转化而牺牲留存"],
  };
}

function safeScenario(raw: unknown, product: string): SimulationScenario {
  const data = (raw || {}) as Partial<SimulationScenario>;
  const fallback = fallbackScenario(product);
  return {
    title: String(data.title || fallback.title).trim(),
    product: String(data.product || product || fallback.product).trim(),
    role: String(data.role || fallback.role).trim(),
    context: String(data.context || fallback.context).trim(),
    decision: String(data.decision || fallback.decision).trim(),
    constraints: Array.isArray(data.constraints) && data.constraints.length
      ? data.constraints.map(String).filter(Boolean).slice(0, 4)
      : fallback.constraints,
    success_metrics:
      Array.isArray(data.success_metrics) && data.success_metrics.length
        ? data.success_metrics.map(String).filter(Boolean).slice(0, 4)
        : fallback.success_metrics,
    hidden_risks: Array.isArray(data.hidden_risks) && data.hidden_risks.length
      ? data.hidden_risks.map(String).filter(Boolean).slice(0, 4)
      : fallback.hidden_risks,
  };
}

function scenarioToQuestion(scenario: SimulationScenario) {
  return [
    `【案例推演】${scenario.title}`,
    "",
    `产品：${scenario.product}`,
    `角色：${scenario.role}`,
    "",
    `背景：${scenario.context}`,
    "",
    `决策问题：${scenario.decision}`,
    "",
    `约束：${scenario.constraints.join("；")}`,
    `成功指标：${scenario.success_metrics.join("；")}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action || "");
    const product = String(body.product || "飞书").trim();
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key 未配置" }, { status: 400 });
    }

    if (action === "generate") {
      const model = getChatModel(apiKey, "deepseek-v4-flash");
      const result = await generateText({
        model,
        system:
          "你是 B 端产品案例训练设计师。请为指定产品生成一个适合高级 PM 训练的真实感决策推演题。只返回 JSON，不要使用 Markdown 代码块。JSON 字段为 title, product, role, context, decision, constraints, success_metrics, hidden_risks。要求场景具体，不编造财务数据，不使用宏大空泛战略会叙事。",
        messages: [
          {
            role: "user",
            content: `请围绕「${product}」生成一个 B 端产品决策推演案例。`,
          },
        ],
      });

      const parsed = parseJsonFromAiText<SimulationScenario>(result.text);
      const scenario = safeScenario(parsed, product);
      return NextResponse.json({ scenario });
    }

    if (action === "evaluate") {
      const scenario = safeScenario(body.scenario, product);
      const userAnswer = String(body.userAnswer || "").trim();
      if (userAnswer.length < 20) {
        return NextResponse.json(
          { error: "回答至少需要 20 个字，才能形成有效复盘。" },
          { status: 400 }
        );
      }

      const model = getThinkingModel(apiKey, "deepseek-v4-flash");
      const result = await generateText({
        model,
        system:
          "你是严格但具体的 B 端产品决策教练。请评估用户在案例推演中的回答。只返回 JSON，不要使用 Markdown 代码块。JSON 结构必须为：overall_score, understanding, framework, solution, decision_logic, feedback, strengths, gaps, suggestions, thinking_framework, example_answer, next_practice。评分 0-10，反馈必须引用用户回答里的具体内容，并指出决策依据、取舍、指标、风险和验证闭环。",
        messages: [
          {
            role: "user",
            content: `案例：${scenarioToQuestion(scenario)}

用户回答：${userAnswer}

请给出结构化评估。`,
          },
        ],
      });

      const evaluation = normalizeTrainingEvaluation(
        parseJsonFromAiText(result.text)
      );
      const { data, error } = await supabase
        .from("training_records")
        .insert({
          user_id: user.id,
          dimension: CASE_DIMENSION,
          difficulty: 4,
          question_scenario: scenarioToQuestion(scenario),
          user_answer: userAnswer,
          ai_feedback: {
            ...evaluation,
            source: "case_simulation",
            product: scenario.product,
            scenario_title: scenario.title,
            hidden_risks: scenario.hidden_risks,
          },
          score: Math.round(evaluation.overall_score * 10),
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ recordId: data.id, evaluation });
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
