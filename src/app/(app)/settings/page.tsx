"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Cpu, ToggleLeft, ToggleRight } from "lucide-react";

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
    return <PageSpinner />;
  }

  return (
    <>
      <PageHeader title="设置" subtitle="配置你的 AI 模型参数" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Card size="lg">
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h3 className="text-heading-lg font-semibold text-ink">
              AI 模型配置
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-label font-semibold text-ink mb-3">
                AI 供应商
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setProvider("deepseek")}
                  className={cn(
                    "px-5 py-2.5 rounded-xl font-semibold text-body-sm transition-all duration-200 active:scale-[0.97]",
                    provider === "deepseek"
                      ? "bg-primary text-white shadow-sm"
                      : "border border-line text-ink-muted hover:bg-surface"
                  )}
                >
                  DeepSeek（内置推荐）
                </button>
                <button
                  onClick={() => setProvider("custom")}
                  className={cn(
                    "px-5 py-2.5 rounded-xl font-semibold text-body-sm transition-all duration-200 active:scale-[0.97]",
                    provider === "custom"
                      ? "bg-primary text-white shadow-sm"
                      : "border border-line text-ink-muted hover:bg-surface"
                  )}
                >
                  自定义（OpenAI 兼容）
                </button>
              </div>
            </div>

            <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxx"
            />

            <div>
              <label className="block text-label font-semibold text-ink mb-2">
                模型选择
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-line bg-surface-raised text-body-md text-ink focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-200"
              >
                <option value="deepseek-v4-flash">
                  DeepSeek V4 Flash（快，省）
                </option>
                <option value="deepseek-v4-pro">
                  DeepSeek V4 Pro（强，略贵）
                </option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-line">
              <div>
                <p className="font-semibold text-ink">深度思考 (Reasoning)</p>
                <p className="text-body-sm text-ink-muted mt-0.5">
                  开启后模型会输出思考过程，诊断评估效果更好
                </p>
              </div>
              <button
                onClick={() => setReasoning(!reasoning)}
                className={cn(
                  "transition-colors duration-200",
                  reasoning ? "text-primary" : "text-ink-faint"
                )}
              >
                {reasoning ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            <Button fullWidth size="lg" onClick={handleSave}>
              {saved ? "已保存" : "保存配置"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
