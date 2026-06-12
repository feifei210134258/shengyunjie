"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResumeUploader from "@/components/bootcamp/ResumeUploader";
import ResumePreview from "@/components/bootcamp/ResumePreview";
import WeaknessReport from "@/components/bootcamp/WeaknessReport";
import { ParsedProfile, WeaknessPrediction } from "@/types/bootcamp";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ResumePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [parsedProfile, setParsedProfile] = useState<ParsedProfile | null>(null);
  const [weaknessPrediction, setWeaknessPrediction] = useState<WeaknessPrediction | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState("");
  const [error, setError] = useState("");
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadExistingResume = async () => {
      try {
        const res = await fetch("/api/bootcamp/resume");
        if (res.status === 404) return;

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "读取简历解析记录失败");
          return;
        }

        if (!isMounted) return;
        setParsedProfile(data.parsed_profile);
        setWeaknessPrediction(data.weakness_prediction);
      } catch (err: any) {
        if (isMounted) setError(err.message || "读取简历解析记录失败");
      } finally {
        if (isMounted) setIsLoadingResume(false);
      }
    };

    loadExistingResume();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/bootcamp/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "上传失败");
        return;
      }

      setParsedProfile(data.parsed_profile);
      setWeaknessPrediction(data.weakness_prediction);
      setRawMarkdown("");
    } catch (err: any) {
      setError(err.message || "上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSubmit = async (text: string) => {
    setIsUploading(true);
    setError("");

    try {
      const blob = new Blob([text], { type: "text/markdown" });
      const file = new File([blob], "resume.md", { type: "text/markdown" });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/bootcamp/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "提交失败");
        return;
      }

      setParsedProfile(data.parsed_profile);
      setWeaknessPrediction(data.weakness_prediction);
      setRawMarkdown(text);
    } catch (err: any) {
      setError(err.message || "提交失败");
    } finally {
      setIsUploading(false);
    }
  };

  const startBootcamp = async () => {
    setError("");
    const res = await fetch("/api/bootcamp/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day_number: 1 }),
    });

    if (res.ok) {
      router.push("/bootcamp/interview");
      return;
    }

    const data = await res.json().catch(() => null);
    setError(data?.error || "生成特训题失败，请稍后重试");
  };

  const resetResume = async () => {
    setIsResetting(true);
    setError("");

    try {
      const res = await fetch("/api/bootcamp/resume", {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "清空简历失败");
        return;
      }

      setParsedProfile(null);
      setWeaknessPrediction(null);
      setRawMarkdown("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "清空简历失败");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <PageHeader title="简历解析" backHref="/bootcamp" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-display-md font-bold text-ink">简历解析</h1>
          <p className="text-body-lg text-ink-muted mt-2">
            上传你的简历，AI 将解析你的工作经历和项目经验，生成针对性的面试弱点预测
          </p>
        </div>

        {isLoadingResume && (
          <div className="rounded-xl border border-line bg-surface p-6 text-body-sm text-ink-muted">
            正在读取简历解析记录...
          </div>
        )}

        {!isLoadingResume && !parsedProfile && (
          <ResumeUploader
            onUpload={handleUpload}
            onTextSubmit={handleTextSubmit}
            isUploading={isUploading}
          />
        )}

        {error && (
          <div className="bg-danger-soft p-4 rounded-xl text-danger text-body-sm">
            {error}
          </div>
        )}

        {parsedProfile && (
          <div className="space-y-8">
            <ResumePreview
              profile={parsedProfile}
              rawMarkdown={rawMarkdown || undefined}
            />

            {weaknessPrediction && (
              <WeaknessReport prediction={weaknessPrediction} />
            )}

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Button fullWidth size="lg" onClick={startBootcamp}>
                生成 Day 1 题并进入特训
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={resetResume}
                loading={isResetting}
                disabled={isUploading}
              >
                清空并重新上传
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
