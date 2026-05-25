import { streamText } from "ai";
import { getChatModel, getThinkingModel } from "@/lib/ai";

export async function POST(req: Request) {
  const { action, dimension, level, userAnswer, question } = await req.json();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API Key 未配置" }), { status: 400 });
  }

  const chatModel = getChatModel(apiKey, "deepseek-v4-flash");

  if (action === "generate") {
    const result = streamText({
      model: chatModel,
      system: `你是 B 端产品训练题库的策展人和出题人。你的题目服务于有经验的产品经理向高级 PM 跃迁。
题目要有真实感、有决策压力、有思考深度。

要求：
- 必须围绕维度「${dimension}」出题
- 在题目开头标注难度，格式严格为「【难度：初级/中级/高级】」
- 初级：单点功能设计，有明确约束条件
- 中级：跨模块决策，涉及多利益方
- 高级：产品方向级决策，涉及商业和市场判断
- **每道题不超过 300 字**
- 体裁不限、结构不限，自由发挥
- 只出题，不加任何分析和引导`,
      messages: [{ role: "user", content: `出一道关于「${dimension}」维度的训练题。` }],
    });
    return result.toDataStreamResponse();
  }

  if (action === "analyze") {
    // 使用深度思考模型
    const thinkingModel = getThinkingModel(apiKey, "deepseek-v4-flash");
    const result = streamText({
      model: thinkingModel,
      system: `你是一位要求严格但不刻薄的 B 端产品教练。你的反馈目标是：让学生知道自己哪里好、哪里不够、怎么改进。

你必须使用深度思考模式来分析用户的答案，给出高质量、有深度的反馈。

输出格式（Markdown，必须严格分为两大块）：

## 诊断
先写一段总体评价（2-3 句话），然后分两部分：

### 核心亮点
- 引用用户原文中做得好的地方，具体指出为什么好
- 至少列出 1-2 个亮点

### 思维盲区
- 引用用户原文中不够的地方，具体指出缺了什么
- 至少列出 1-2 个盲区
- 批评要有建设性，说"具体缺什么"，而不是泛泛而谈

## 建议
给出 2-3 条具体、可操作的改进建议：
- 每条建议都要具体，不能是空话
- 建议要针对这道题的维度（战略思维/系统设计/数据决策/用户洞察/商业思维）
- 如果可以，给出可参考的学习资源或思考框架

约束：
- 必须引用用户原文中的表述来支撑你的观点
- 批评要有建设性，说"具体缺什么"
- 答案过短时提示"思考再深入一些"
- 保持专业、尊重的语气
- 请在分析开头给出 1-10 分的综合评分，格式严格为「【评分：X/10】」
- 评分标准：1-3 初级水平，4-6 中等水平，7-8 良好水平，9-10 优秀水平`,
      messages: [
        { role: "user", content: `题目：${question}\n\n用户的回答：${userAnswer}\n\n请给出诊断和建议。` },
      ],
    });
    return result.toDataStreamResponse();
  }

  return new Response(JSON.stringify({ error: "未知 action" }), { status: 400 });
}
