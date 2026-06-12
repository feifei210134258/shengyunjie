"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BarChart3, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthShowcaseProps {
  mode: "login" | "register";
}

const metrics = [
  { label: "诊断维度", value: "5" },
  { label: "训练闭环", value: "AI" },
  { label: "案例视角", value: "9" },
];

const sampleReports = [
  {
    label: "能力诊断报告",
    title: "五维能力画像与 7 天补强计划",
    src: "/showcase/sample-ability-report.svg",
    tone: "bg-primary-soft text-primary",
  },
  {
    label: "训练复盘报告",
    title: "AI 评分、关键反馈和下一题建议",
    src: "/showcase/sample-training-report.svg",
    tone: "bg-secondary-soft text-secondary",
  },
  {
    label: "成长工作台样例",
    title: "诊断、训练和案例推演汇总",
    src: "/showcase/sample-dashboard-cockpit.png",
    tone: "bg-accent-soft text-accent",
  },
];

export function AuthShowcase({ mode }: AuthShowcaseProps) {
  const isRegister = mode === "register";
  const [activeReport, setActiveReport] = useState(0);
  const currentReport = sampleReports[activeReport];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveReport((index) => (index + 1) % sampleReports.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <aside className="relative hidden min-h-[100dvh] overflow-hidden bg-[#121821] lg:flex lg:w-[56%]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0,transparent_42%),radial-gradient(circle_at_18%_18%,rgba(199,210,254,0.16),transparent_24rem)]" />
      <div className="absolute inset-y-0 right-0 w-px bg-white/12" />

      <div className="relative z-10 flex w-full flex-col justify-between p-10 text-ink-inverse xl:p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/16">
            <GraduationCap className="h-5 w-5 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-heading-sm font-bold text-white">升云阶</p>
            <p className="text-label text-white/52">PM growth cockpit</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <p className="mb-3 text-label font-semibold text-white/56">
            {isRegister ? "建立你的成长基线" : "回到你的成长工作台"}
          </p>
          <h1 className="max-w-xl text-display-lg font-bold leading-tight text-white xl:text-display-xl">
            {isRegister ? "先诊断，再训练。" : "把产品判断练成肌肉记忆。"}
          </h1>
          <p className="mt-4 max-w-lg text-body-md leading-relaxed text-white/68 xl:text-body-lg">
            {isRegister
              ? "注册前先看看样例报告的形态：能力画像、训练反馈和下一步计划都会围绕真实短板展开。"
              : "登录前也能先预览样例报告，看看诊断画像、训练反馈和案例拆解如何沉淀成可复用框架。"}
          </p>

          <div className="mt-6 grid max-w-lg grid-cols-3 gap-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5"
              >
                <p className="font-mono text-data-md font-bold text-white">
                  {metric.value}
                </p>
                <p className="mt-1 text-label text-white/48">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl rounded-2xl border border-white/12 bg-white/[0.07] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-4 px-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    currentReport.tone
                  )}
                >
                  <BarChart3 className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <p className="text-label font-semibold text-white/52">
                  样例报告预览
                </p>
              </div>
              <p className="mt-1 truncate text-body-md font-bold text-white">
                {currentReport.label}
              </p>
              <p className="mt-0.5 truncate text-body-sm text-white/58">
                {currentReport.title}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {sampleReports.map((report, index) => (
                <button
                  key={report.src}
                  type="button"
                  aria-label={`查看${report.label}`}
                  aria-pressed={activeReport === index}
                  onClick={() => setActiveReport(index)}
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    activeReport === index
                      ? "w-7 bg-white"
                      : "w-2.5 bg-white/28 hover:bg-white/48"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="relative aspect-[2/1] overflow-hidden rounded-xl border border-white/12 bg-white shadow-2xl">
            <Image
              key={currentReport.src}
              src={currentReport.src}
              alt={currentReport.label}
              fill
              sizes="(min-width: 1280px) 640px, 56vw"
              className="animate-fade-in object-cover object-top"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
