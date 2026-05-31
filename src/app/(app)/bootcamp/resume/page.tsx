"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ResumeUploader from "@/components/bootcamp/ResumeUploader";
import ResumePreview from "@/components/bootcamp/ResumePreview";
import WeaknessReport from "@/components/bootcamp/WeaknessReport";
import { ParsedProfile, WeaknessPrediction } from "@/types/bootcamp";

export default function ResumePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [parsedProfile, setParsedProfile] = useState<ParsedProfile | null>(
    null
  );
  const [weaknessPrediction, setWeaknessPrediction] =
    useState<WeaknessPrediction | null>(null);
  const [error, setError] = useState("");

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
    } catch (err: any) {
      setError(err.message || "上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  const startBootcamp = async () => {
    // 生成 Day 1 题目
    const res = await fetch("/api/bootcamp/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day_number: 1 }),
    });

    if (res.ok) {
      router.push("/bootcamp/interview");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">简历解析</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            上传你的简历，AI
            将解析你的工作经历和项目经验，生成针对性的面试弱点预测
          </p>
        </div>

        {!parsedProfile && (
          <ResumeUploader onUpload={handleUpload} isUploading={isUploading} />
        )}

        {error && (
          <div className="bg-error-container p-4 rounded-xl text-error">
            {error}
          </div>
        )}

        {parsedProfile && (
          <div className="space-y-8">
            <ResumePreview profile={parsedProfile} />

            {weaknessPrediction && (
              <WeaknessReport prediction={weaknessPrediction} />
            )}

            <button
              onClick={startBootcamp}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-label-bold text-body-lg"
            >
              开始特训
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
