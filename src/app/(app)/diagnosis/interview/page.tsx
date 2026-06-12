"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StepProgress } from "@/components/ui/step-progress";
import { Spinner } from "@/components/ui/spinner";
import { getPendingDiagnosisReportId } from "@/lib/browser/safe-storage";
import { parseInterviewReadiness } from "@/lib/diagnosis/interview-readiness";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles, User, Send } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_AI_MESSAGE: Message = {
  role: "assistant",
  content:
    "你好！我是你的 AI 教练。基于你刚才的量表自评结果，我注意到你在「系统设计能力」和「商业思维」两个维度上有一些值得深挖的地方。\n\n我们先聊聊你的工作背景吧，简单介绍一下你最近负责的产品和你在团队中的角色？",
};

export default function InterviewPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([INITIAL_AI_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [interviewReady, setInterviewReady] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: "deepseek-v4-flash",
        }),
      });

      if (!res.body) {
        throw new Error("AI response stream is empty");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              if (typeof text === "string") {
                aiContent += text;
                const readiness = parseInterviewReadiness(aiContent);
                if (readiness.isReady) {
                  setInterviewReady(true);
                }
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = {
                    role: "assistant",
                    content: readiness.content,
                  };
                  return newMsgs;
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        const errorMessage: Message = {
          role: "assistant",
          content: "抱歉，连接出现问题，请稍后重试。",
        };

        if (last?.role === "assistant" && !last.content) {
          newMsgs[newMsgs.length - 1] = errorMessage;
          return newMsgs;
        }

        return [...newMsgs, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    const reportId = getPendingDiagnosisReportId();
    try {
      await fetch("/api/diagnosis/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          summary: {
            messageCount: messages.length,
            interviewReady,
            lastMessages: messages
              .slice(-4)
              .map((m) => ({
                role: m.role,
                preview: m.content.slice(0, 100),
              })),
          },
        }),
      });
    } catch {}
    router.push(
      reportId
        ? `/diagnosis/case?reportId=${encodeURIComponent(reportId)}`
        : "/diagnosis/case"
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100dvh-64px)] flex flex-col bg-bg">
      {/* 顶部栏 */}
      <header className="border-b border-line bg-bg/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-heading-sm font-semibold text-ink">诊断模块</h2>
          <div className="hidden sm:block h-5 w-px bg-line" />
          <Badge>阶段二：教练深度访谈</Badge>
          <StepProgress
            steps={["量表", "访谈", "案例"]}
            current={1}
            className="hidden sm:flex w-24"
          />
        </div>
        <Button
          onClick={handleFinish}
          loading={saving}
          disabled={isLoading || saving}
          size="sm"
          variant={interviewReady ? "primary" : "secondary"}
        >
          {saving
            ? "保存中..."
            : interviewReady
              ? "进入案例分析"
              : "提前进入案例"}
        </Button>
      </header>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {interviewReady && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary-soft/70 px-4 py-3 text-body-sm text-ink"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                strokeWidth={1.8}
              />
              <div>
                <p className="font-semibold">AI 教练认为信息已足够</p>
                <p className="mt-1 text-ink-muted">
                  你可以继续补充细节，也可以进入下一阶段的案例分析。
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isPendingAssistant =
              msg.role === "assistant" &&
              !msg.content &&
              i === messages.length - 1 &&
              isLoading;

            return (
              <div
                key={i}
                className={cn(
                  "flex gap-3 sm:gap-4",
                  msg.role === "user" && "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === "assistant"
                      ? "bg-[linear-gradient(135deg,#4338CA_0%,#0F766E_100%)] text-white"
                      : "bg-secondary-soft text-secondary"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="relative flex h-full w-full items-center justify-center">
                      <span className="font-mono text-label font-bold">AI</span>
                      <Sparkles
                        className="absolute right-1.5 top-1.5 h-3 w-3 text-white/80"
                        strokeWidth={1.8}
                      />
                    </div>
                  ) : (
                    <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[80%] sm:max-w-[70%] rounded-xl p-4 whitespace-pre-wrap leading-relaxed text-body-md",
                    msg.role === "assistant"
                      ? "bg-surface-raised border border-line rounded-tl-sm"
                      : "bg-primary text-white rounded-tr-sm",
                    isPendingAssistant &&
                      "border-primary/30 bg-primary-soft/70 text-ink"
                  )}
                >
                  {isPendingAssistant ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="flex items-center gap-3 whitespace-normal"
                    >
                      <Spinner size="sm" />
                      <div>
                        <p className="font-semibold text-ink">
                          AI 教练正在思考...
                        </p>
                        <p className="mt-1 text-body-sm text-ink-muted">
                          正在结合你的回答生成追问，请稍等。
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t border-line bg-bg/90 px-4 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-6 lg:px-8 shrink-0">
        <div className="mx-auto flex max-w-5xl items-end gap-3 rounded-xl border border-line bg-surface p-2 shadow-sm">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading ? "AI 教练回复后可继续输入" : "分享你的判断、例子或追问"
            }
            rows={2}
            disabled={isLoading}
            wrapperClassName="flex-1"
            className="min-h-[56px] border-0 bg-transparent px-3 py-3 shadow-none focus:border-transparent focus:ring-0"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            loading={isLoading}
            icon={<Send className="w-4 h-4" />}
            className="h-14 w-32 shrink-0"
          >
            {isLoading ? "等待回复" : "发送"}
          </Button>
        </div>
        <p className="mx-auto mt-2 max-w-5xl px-1 text-label text-ink-faint">
          Enter 发送，Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
