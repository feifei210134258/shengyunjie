"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BootcampPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("bootcamp_sessions")
        .select("status, current_day")
        .eq("user_id", user.id)
        .single();

      setSession(data);
      setLoading(false);
    }
    fetchSession();
  }, []);

  if (loading) return null;

  // 根据状态决定跳转
  if (!session || session.status === "not_started") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <span className="material-symbols-outlined text-7xl text-primary">
            rocket_launch
          </span>
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">特训冲刺</h1>
            <p className="text-body-lg text-on-surface-variant mt-2">
              3 天高强度面试特训，基于你的履历定制题目，AI 实时评分反馈
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-left">
            <div className="bg-surface-container p-4 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-primary">
                upload_file
              </span>
              <h3 className="font-label-bold text-on-surface mt-2">Day 0</h3>
              <p className="text-body-sm text-on-surface-variant">上传简历，AI 解析能力画像</p>
            </div>
            <div className="bg-surface-container p-4 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-primary">
                psychology
              </span>
              <h3 className="font-label-bold text-on-surface mt-2">Day 1-3</h3>
              <p className="text-body-sm text-on-surface-variant">每日 5 题，难度递增，AI 评分</p>
            </div>
            <div className="bg-surface-container p-4 rounded-xl">
              <span className="material-symbols-outlined text-3xl text-primary">
                assessment
              </span>
              <h3 className="font-label-bold text-on-surface mt-2">报告</h3>
              <p className="text-body-sm text-on-surface-variant">综合成长报告与改进建议</p>
            </div>
          </div>

          <Link
            href="/bootcamp/resume"
            className="inline-block px-8 py-4 bg-primary text-on-primary rounded-xl font-label-bold text-body-lg"
          >
            开始特训
          </Link>
        </div>
      </div>
    );
  }

  // 有进行中的会话，跳转到对应页面
  if (session.status === "in_progress") {
    if (session.current_day === 0) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Link
            href="/bootcamp/resume"
            className="text-primary text-body-lg"
          >
            继续简历上传 →
          </Link>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Link
          href="/bootcamp/interview"
          className="text-primary text-body-lg"
        >
          继续特训 →
        </Link>
      </div>
    );
  }

  // 已完成
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Link href="/bootcamp/report" className="text-primary text-body-lg">
        查看报告 →
      </Link>
    </div>
  );
}
