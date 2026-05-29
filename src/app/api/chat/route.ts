import { streamText } from "ai";
import { getChatModel, getThinkingModel } from "@/lib/ai";

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "请先在 .env.local 中配置 DEEPSEEK_API_KEY" }), {
      status: 400,
    });
  }

  const thinkingModel = getThinkingModel(apiKey, model || "deepseek-v4-flash");

  const result = streamText({
    model: thinkingModel,
    system: `你是一位 B 端产品 VP 级别的导师，正在对一位产品经理进行 1v1 深度辅导面谈。
你的目标不是考倒对方，而是通过对话挖掘他/她真实的思维深度和盲区。
- 每次只问 1-2 个问题，不要连续炮轰
- 如果对方回答模糊，礼貌追问"能举个具体例子吗？"
- 不要评判对错，而是通过提问帮助对方自己发现盲区
- 对话结束时，总结关键发现`,
    messages,
  });

  return result.toDataStreamResponse();
}
