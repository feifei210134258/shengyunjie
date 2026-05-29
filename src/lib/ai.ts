import { createOpenAI } from "@ai-sdk/openai";

export function createDeepSeekClient(apiKey: string, enableThinking = false) {
  return createOpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com/v1",
    fetch: async (url, options) => {
      if (enableThinking && options?.body && typeof options.body === "string") {
        try {
          const body = JSON.parse(options.body);
          body.reasoning_effort = "max";
          body.thinking = { type: "enabled" };
          options.body = JSON.stringify(body);
        } catch {}
      }
      return fetch(url, options);
    },
  });
}

export function getChatModel(apiKey: string, model: string = "deepseek-v4-flash") {
  const openai = createDeepSeekClient(apiKey);
  return openai(model);
}

// 启用深度思考模式的模型
export function getThinkingModel(apiKey: string, model: string = "deepseek-v4-flash") {
  const openai = createDeepSeekClient(apiKey, true);
  return openai(model);
}
