"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_AI_MESSAGE: Message = {
  role: "assistant",
  content:
    "你好！我是你的 AI 教练。基于你刚才的量表自评结果，我注意到你在「系统设计能力」和「商业思维」两个维度上有一些值得深挖的地方。\n\n我们先聊聊你的工作背景吧——简单介绍一下你最近负责的产品和你在团队中的角色？",
};

export default function InterviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([INITIAL_AI_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),

          model: "deepseek-v4-flash",
        }),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // AI SDK v4 数据流格式：0:"text content"
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              if (typeof text === "string") {
                aiContent += text;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = { role: "assistant", content: aiContent };
                  return newMsgs;
                });
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    const reportId = sessionStorage.getItem("reportId");
    try {
      await fetch("/api/diagnosis/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          summary: {
            messageCount: messages.length,
            lastMessages: messages.slice(-4).map((m) => ({ role: m.role, preview: m.content.slice(0, 100) })),
          },
        }),
      });
    } catch {}
    router.push("/diagnosis/case");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 顶部栏 */}
      <header className="h-16 border-b border-outline-variant bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-headline-md font-bold text-on-surface">诊断模块</h2>
          <div className="h-6 w-px bg-outline-variant mx-1" />
          <span className="text-label-bold text-primary px-3 py-1 bg-primary/10 rounded-full">
            阶段二：教练深度访谈
          </span>
          {/* Stepper dots */}
          <div className="flex items-center gap-1 ml-4">
            <div className="w-8 h-1.5 rounded-full bg-primary" />
            <div className="w-8 h-1.5 rounded-full bg-primary" />
            <div className="w-8 h-1.5 rounded-full bg-surface-container-highest" />
          </div>
        </div>
        <button
          onClick={handleFinish}
          disabled={saving}
          className="px-5 py-2 bg-primary text-on-primary rounded-lg font-bold text-body-sm hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? "保存中..." : "完成访谈，进入案例实战"}
        </button>
      </header>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "assistant"
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-secondary-container text-on-secondary-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {msg.role === "assistant" ? "smart_toy" : "person"}
                </span>
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[70%] p-4 rounded-xl whitespace-pre-wrap leading-relaxed text-body-md ${
                  msg.role === "assistant"
                    ? "bg-surface-container-lowest border border-outline-variant rounded-tl-none"
                    : "bg-primary text-on-primary rounded-tr-none"
                }`}
              >
                <p>{msg.content || (i === messages.length - 1 && isLoading ? "思考中..." : "")}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t border-outline-variant bg-white/80 backdrop-blur-md px-8 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="分享您的思考...（Enter 发送，Shift+Enter 换行）"
            rows={2}
            className="flex-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
