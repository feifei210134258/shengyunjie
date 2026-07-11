"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
    setSaving(true);
    setSaveError("");
    try {
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
      if (!res.ok || !data.ok) throw new Error(data.error || "保存失败");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      setSaveError(error.message || "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSpinner />;
  }

  return (
    <main className="mx-auto max-w-[980px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-5">
        <p className="text-label font-bold text-primary">系统设置</p>
        <h1 className="mt-1 text-[28px] font-bold leading-9 text-ink">设置</h1>
      </header>

      <section className="mt-5 border-y border-line bg-white px-4 py-5 sm:px-6">
        <div className="mb-5 flex items-center gap-3">
          <Cpu className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <h2 className="text-[20px] font-semibold leading-7 text-ink">
            AI 模型
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-label font-semibold text-ink">
              AI 供应商
            </label>
            <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider("deepseek")}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-body-sm font-semibold transition duration-200 active:scale-[0.97]",
                    provider === "deepseek"
                      ? "bg-primary text-white"
                      : "border border-line text-ink-muted hover:bg-surface"
                  )}
                >
                  DeepSeek（内置推荐）
                </button>
                <button
                  type="button"
                  onClick={() => setProvider("custom")}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-body-sm font-semibold transition duration-200 active:scale-[0.97]",
                    provider === "custom"
                      ? "bg-primary text-white"
                      : "border border-line text-ink-muted hover:bg-surface"
                  )}
                >
                  自定义（OpenAI 兼容）
                </button>
            </div>
          </div>

          {provider === "custom" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxx"
              />
              <Input
                label="模型名称"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="例如：gpt-4.1-mini"
              />
            </div>
          )}

          {provider !== "custom" && (
            <div>
              <label className="mb-2 block text-label font-semibold text-ink">
                模型选择
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-md border border-line bg-surface-raised px-4 py-2.5 text-body-md text-ink outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="deepseek-v4-flash">
                  DeepSeek V4 Flash（快，省）
                </option>
                <option value="deepseek-v4-pro">
                  DeepSeek V4 Pro（强，略贵）
                </option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-line py-4">
              <div>
                <p className="font-semibold text-ink">深度思考 (Reasoning)</p>
                <p className="mt-0.5 text-body-sm text-ink-muted">
                  用于复杂诊断与反馈
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReasoning(!reasoning)}
                aria-pressed={reasoning}
                aria-label="深度思考"
                className={cn(
                  "rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
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

          {saveError && (
            <p
              role="alert"
              className="rounded-md bg-danger-soft px-3 py-2 text-body-sm text-danger"
            >
              {saveError}
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中" : saved ? "已保存" : "保存配置"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
