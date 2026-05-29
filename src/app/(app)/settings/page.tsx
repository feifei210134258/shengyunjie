"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("deepseek-v4-flash");
  const [provider, setProvider] = useState("deepseek");
  const [reasoning, setReasoning] = useState(true);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setApiKey(data.ai_api_key || "");
          setModel(data.ai_model || "deepseek-v4-flash");
          setProvider(data.ai_provider || "deepseek");
          setReasoning(data.ai_reasoning !== false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ai_provider: provider,
        ai_model: model,
        ai_api_key: apiKey,
        ai_reasoning: reasoning,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-20 border-b border-outline-variant bg-white/80 backdrop-blur-md flex items-center px-8">
          <h2 className="text-headline-md font-bold text-on-surface">设置</h2>
        </header>
        <div className="max-w-2xl mx-auto px-8 py-8">
          <p className="text-body-md text-on-surface-variant">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-20 border-b border-outline-variant bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center px-8">
        <h2 className="text-headline-md font-bold text-on-surface">设置</h2>
      </header>
      <div className="max-w-2xl mx-auto px-8 py-8 space-y-8">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8">
          <h3 className="text-headline-md font-bold text-on-surface mb-6">AI 模型配置</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-label-bold text-on-surface mb-2">AI 供应商</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setProvider("deepseek")}
                  className={`px-5 py-2.5 rounded-lg font-bold text-body-sm transition-all ${
                    provider === "deepseek"
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  DeepSeek（内置推荐）
                </button>
                <button
                  onClick={() => setProvider("custom")}
                  className={`px-5 py-2.5 rounded-lg font-bold text-body-sm transition-all ${
                    provider === "custom"
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  自定义（OpenAI 兼容）
                </button>
              </div>
            </div>

            <div>
              <label className="block text-label-bold text-on-surface mb-2">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-label-bold text-on-surface mb-2">模型选择</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              >
                <option value="deepseek-v4-flash">DeepSeek V4 Flash（快，省）</option>
                <option value="deepseek-v4-pro">DeepSeek V4 Pro（强，略贵）</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-on-surface">深度思考 (Reasoning)</p>
                <p className="text-body-sm text-on-surface-variant">开启后模型会输出思考过程，诊断评估效果更好</p>
              </div>
              <button
                onClick={() => setReasoning(!reasoning)}
                className={`w-12 h-7 rounded-full p-1 flex transition-colors ${
                  reasoning ? "bg-primary justify-end" : "bg-surface-container-highest justify-start"
                }`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </button>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-bold text-body-md hover:opacity-90 transition-all"
            >
              {saved ? "已保存 ✓" : "保存配置"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
