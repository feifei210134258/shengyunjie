import { streamText } from "ai";
import { getChatModel, getThinkingModel } from "@/lib/ai";
import { createServerClient } from "@/lib/supabase-server";
import {
  formatTrainingTarget,
  formatTrainingDimensionStrategy,
  getTrainingTargetById,
  getTrainingTarget,
  getTrainingDimensionStrategy,
} from "@/lib/training/dimension-strategy";
import { buildTrainingPersonalization } from "@/lib/training/personalization";

async function getPersonalizationContext(dimension?: string) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return buildTrainingPersonalization({ requestedDimension: dimension });
    }

    const [{ data: latestReport }, { data: recentRecords }, { data: session }] =
      await Promise.all([
        supabase
          .from("diagnosis_reports")
          .select("*, dimension_scores(*)")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("training_records")
          .select("dimension, question_scenario, score, ai_feedback, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("bootcamp_sessions")
          .select("weakness_prediction")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    return buildTrainingPersonalization({
      requestedDimension: dimension,
      latestReport,
      recentRecords: recentRecords || [],
      latestBootcampSession: session,
    });
  } catch {
    return buildTrainingPersonalization({ requestedDimension: dimension });
  }
}

export async function POST(req: Request) {
  const { action, dimension, targetId, level, userAnswer, question } = await req.json();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API Key 未配置" }), { status: 400 });
  }

  const chatModel = getChatModel(apiKey, "deepseek-v4-flash");

  if (action === "generate") {
    const dimensionStrategy = getTrainingDimensionStrategy(dimension);
    const target = targetId
      ? getTrainingTargetById(dimension, targetId)
      : getTrainingTarget(dimension);
    const framework = target.framework;
    const personalization = await getPersonalizationContext(dimension);

    const result = streamText({
      model: chatModel,
      system: `你是 B 端产品训练题库的策展人和出题人。你的用户是"执行层产品经理"，训练目标是帮助他们向"高阶产品"进阶。

核心原则：
1. **小而真**：场景必须具体、真实、可感知。可以是对真实知名产品/功能的分析，也可以是真实PM日常会遇到的具体困境。坚决禁止虚构公司名、营收数字、市场份额、融资额等宏大叙事数据。
2. **高阶 PM 靶点导向**：每道题必须训练「${target.label}」这一高阶 PM 能力靶点，并让答题者运用「${framework}」。难度来自"判断质量"，不是"信息阅读量"。
3. **执行层进阶定位**：题目要让执行层PM跳出现有执行思维，但不要用"年营收5亿、CEO战略会、全公司资源重组"这种虚假宏大场景来堆难度。

当前维度：${dimension}
本题靶点：${target.label}
对应思维框架：${framework}
维度出题策略：
${formatTrainingDimensionStrategy(dimensionStrategy)}

高阶 PM 训练靶点：
${formatTrainingTarget(target)}

个性化上下文：
- 本题聚焦维度：${personalization.focusDimension || dimension}
- 用户当前短板：${personalization.weakDimensions.join("、") || "暂无明确画像"}
- 最近低分维度：${personalization.recentLowDimensions.join("、") || "暂无"}
- 最近训练盲区：${personalization.recentGaps.join("；") || "暂无"}
- 近期训练均分：${personalization.averageScore ? `${personalization.averageScore}/10` : "暂无"}
- 近期已练题目：${personalization.recentQuestions.join(" | ") || "暂无"}
- 推荐理由：${personalization.recommendationReason}

要求：
- 必须围绕维度「${dimension}」出题
- 必须围绕训练靶点「${target.label}」出题，页面会把它作为本题第二标签
- **每道题不超过 300 字**
- 避免与近期已练题目重复
- 不要复用近期已练题目的产品类型、业务动作、冲突角色、指标组合和问题结构
- 题目要自然嵌入用户短板，但不要暴露内部评分细节
- 从维度“允许题型”和靶点“可用变化轴”中选择 2-3 个变化轴自然组合，不能写成机械填空题
- 题目必须严格包含 2 个具体判断问题，避免开放式大作文
- 两个问题的分工必须清晰：一个核心判断，一个落地、风险或验证追问
- 不要生成第 3 个问题，也不要在题尾追加“注意”“补充要求”“额外思考”等隐性第三问
- 必须生成一条“答题提点”，它的本质是框架思维引导，不是题目细节提示
- 生成框架思维引导的原因：降低初阶用户的上手门槛，帮助他们在类似题目中形成可迁移的产品思维，而不是只会针对当前题目猜答案
- 答题提点要帮助初阶用户识别问题本质、建立拆解路径，并知道怎样形成判断闭环
- 答题提点可以是一句或两句，不强制固定句式；允许 40-90 字，表达要自然、可迁移
- 不要复述题干里的具体业务名词、角色名、产品名或指标名，不要给具体答案，也不要替用户选择方案
- 输出格式严格为三段：
【为什么练这题：一句话说明这题如何对应用户短板】
【答题提点：40-90 字的框架思维引导】
题目正文`,
      messages: [
        {
          role: "user",
          content: `请出一道关于「${dimension}」维度、「${target.label}」靶点的训练题，要求答题者运用「${framework}」思维框架。`,
        },
      ],
    });
    return result.toDataStreamResponse();
  }

  if (action === "analyze") {
    // 使用深度思考模型
    const thinkingModel = getThinkingModel(apiKey, "deepseek-v4-flash");
    const dimensionStrategy = getTrainingDimensionStrategy(dimension);
    const result = streamText({
      model: thinkingModel,
      system: `你是一位要求严格但不刻薄的 B 端产品教练。你的目标不是只打分，而是把用户的回答改到真实高阶 PM 训练可用。
当前题目维度的训练策略：
${formatTrainingDimensionStrategy(dimensionStrategy)}

请只返回 JSON，不要使用 Markdown 代码块，不要添加解释。
JSON 结构必须为：
{
  "overall_score": 0-10,
  "understanding": 0-10,
  "framework": 0-10,
  "solution": 0-10,
  "decision_logic": 0-10,
  "feedback": "总体评价，必须具体指出这份回答为什么像或不像高级 PM",
  "strengths": ["亮点，引用用户回答里的具体内容"],
  "gaps": ["盲区，指出缺失的证据、取舍、指标、风险或复盘"],
  "suggestions": ["可执行改进建议"],
  "thinking_framework": ["这道题推荐的答题框架，4-6 条"],
  "example_answer": "给一段 120-220 字的示例回答，示范高阶 PM 应该怎么答",
  "next_practice": "下一题前最该练的一件事"
}
评分标准：
1. 理解问题：是否抓住真实业务矛盾和关键角色。
2. 思维框架：是否有结构化分析路径，而不是罗列功能。
3. 方案质量：是否具体、可落地，并考虑边界条件。
4. 决策逻辑：是否解释为什么这样做，有取舍标准、证据和反证意识。
5. 维度专项：必须优先参考上面的“回答应训练”，指出用户在哪些专项动作上做到了或缺失了什么。
反馈必须引用用户原文，避免空泛夸奖或空泛批评。`,
      messages: [
        {
          role: "user",
          content: `题目维度：${dimension || "未知"}
题目：${question}

用户的回答：${userAnswer}

请给出结构化教练反馈。`,
        },
      ],
    });
    return result.toDataStreamResponse();
  }

  return new Response(JSON.stringify({ error: "未知 action" }), { status: 400 });
}
