"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { getPendingDiagnosisReportId } from "@/lib/browser/safe-storage";
import { parseInterviewReadiness } from "@/lib/diagnosis/interview-readiness";
import { cn } from "@/lib/utils";
import { CheckCircle2, User, Send } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_AI_MESSAGE: Message = {
  role: "assistant",
  content: "先说最近负责的产品、你的角色和一个关键结果。",
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
    <div className="flex h-[calc(100dvh-64px)] flex-col bg-bg">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-bg px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-9 text-ink">深度访谈</h1>
          <p className="text-label font-semibold text-primary">访谈 2/3</p>
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

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-5">
          {interviewReady && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-3 rounded-lg border border-primary/25 bg-primary-soft px-4 py-3 text-body-sm text-ink"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                strokeWidth={1.8}
              />
              <div>
                <p className="font-semibold">AI 教练认为信息已足够</p>
                <p className="mt-1 text-ink-muted">可以继续补充，或进入案例分析。</p>
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
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    msg.role === "assistant"
                      ? "bg-primary-soft text-primary"
                      : "bg-secondary-soft text-secondary"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <span className="font-mono text-label font-bold">AI</span>
                  ) : (
                    <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  )}
                </div>

                <div
                  className={cn(
                    "max-w-[82%] whitespace-pre-wrap rounded-lg px-4 py-3 text-body-md leading-relaxed sm:max-w-[70%]",
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

      <div className="shrink-0 border-t border-line bg-bg px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-lg border border-line bg-white p-2">
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
            className="min-h-[56px] border-0 bg-transparent px-3 py-3 focus:border-transparent focus:ring-0"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            loading={isLoading}
            icon={<Send className="w-4 h-4" />}
            className="h-14 shrink-0 px-4 sm:w-28"
          >
            {isLoading ? "等待回复" : "发送"}
          </Button>
        </div>
      </div>
    </div>
  );
}
