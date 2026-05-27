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
    // 维度 → 思维框架映射
    const frameworkMap: Record<string, string> = {
      "战略思维": "机会成本分析 / 战略取舍框架",
      "系统设计能力": "系统思维 / 模块化与依赖关系梳理",
      "数据决策能力": "假设验证 / 因果推断",
      "用户洞察与需求管理": "第一性原理 / JTBD（Jobs-to-be-Done）",
      "商业思维": "单位经济模型 / 商业模式画布推演",
    };
    const framework = frameworkMap[dimension] || "产品思维框架";

    const result = streamText({
      model: chatModel,
      system: `你是 B 端产品训练题库的策展人和出题人。你的用户是"执行层产品经理"，训练目标是帮助他们向"高阶产品"进阶。

核心原则：
1. **小而真**：场景必须具体、真实、可感知。可以是对真实知名产品/功能的分析，也可以是真实PM日常会遇到的具体困境。坚决禁止虚构公司名、营收数字、市场份额、融资额等宏大叙事数据。
2. **思维框架导向**：每道题必须让答题者运用「${framework}」这一思维框架。难度来自"思维深度"，不是"信息阅读量"。
3. **执行层进阶定位**：题目要让执行层PM跳出现有执行思维，但不要用"年营收5亿、CEO战略会、全公司资源重组"这种虚假宏大场景来堆难度。

当前维度：${dimension}
对应思维框架：${framework}

要求：
- 必须围绕维度「${dimension}」出题
- **每道题不超过 300 字**
- 只出题，不加任何分析和引导`,
      messages: [{ role: "user", content: `请出一道关于「${dimension}」维度的训练题，要求答题者运用「${framework}」思维框架。` }],
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
