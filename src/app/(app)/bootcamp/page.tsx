"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { Rocket, FileUp, Brain, BarChart3, ArrowRight, FileText } from "lucide-react";

export default function BootcampPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  if (loading) return <PageSpinner />;

  if (!session || session.status === "not_started") {
    return (
      <>
        <PageHeader title="特训冲刺" subtitle="3 天高强度面试特训" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-center space-y-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl bg-primary-soft">
            <Rocket className="w-9 h-9 text-primary" />
          </div>
          <div>
            <h1 className="text-display-md font-bold text-ink">
              特训冲刺
            </h1>
            <p className="text-body-lg text-ink-muted mt-3 max-w-md mx-auto">
              3 天高强度面试特训，基于你的履历定制题目，AI 实时评分反馈
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <Card variant="subtle" size="sm">
              <FileUp className="w-6 h-6 text-primary mb-2" strokeWidth={1.5} />
              <h3 className="font-semibold text-ink mt-2">Day 0</h3>
              <p className="text-body-sm text-ink-muted mt-1">
                上传简历，AI 解析能力画像
              </p>
            </Card>
            <Card variant="subtle" size="sm">
              <Brain className="w-6 h-6 text-primary mb-2" strokeWidth={1.5} />
              <h3 className="font-semibold text-ink mt-2">Day 1-3</h3>
              <p className="text-body-sm text-ink-muted mt-1">
                每日 5 题，难度递增，AI 评分
              </p>
            </Card>
            <Card variant="subtle" size="sm">
              <BarChart3 className="w-6 h-6 text-primary mb-2" strokeWidth={1.5} />
              <h3 className="font-semibold text-ink mt-2">报告</h3>
              <p className="text-body-sm text-ink-muted mt-1">
                综合成长报告与改进建议
              </p>
            </Card>
          </div>

          <Link href="/bootcamp/resume">
            <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
              开始特训
            </Button>
          </Link>
        </div>
      </>
    );
  }

  if (session.status === "in_progress") {
    return (
      <>
        <PageHeader title="特训冲刺" />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-xl border border-line bg-surface p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft">
              <Brain className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="mt-4 text-heading-lg font-semibold text-ink">
              特训已准备好
            </h1>
            <p className="mt-2 text-body-md text-ink-muted">
              你可以先整理项目故事库，再进入模拟面试继续补证据。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Link
                href="/bootcamp/resume"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong bg-transparent px-5 py-2.5 text-body-md font-semibold text-ink transition-all hover:bg-bg active:scale-[0.97]"
              >
                查看简历解析
              </Link>
              <Link
                href="/bootcamp/story-bank"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong bg-transparent px-5 py-2.5 text-body-md font-semibold text-ink transition-all hover:bg-bg active:scale-[0.97]"
              >
                <FileText className="h-4 w-4" strokeWidth={1.5} />
                项目故事库
              </Link>
              {session.current_day > 0 ? (
                <Link
                  href="/bootcamp/interview"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
                >
                  继续特训
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/bootcamp/resume"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
                >
                  生成 Day 1 题
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="特训冲刺" />
      <div className="min-h-[60vh] flex items-center justify-center">
        <Link
          href="/bootcamp/report"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.97]"
        >
          查看报告
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  );
}
