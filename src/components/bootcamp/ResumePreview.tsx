"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ParsedProfile } from "@/types/bootcamp";

interface Props {
  profile: ParsedProfile;
  rawMarkdown?: string;
}

export default function ResumePreview({ profile, rawMarkdown }: Props) {
  // 如果有原始 Markdown，优先用 react-markdown 渲染
  if (rawMarkdown) {
    return (
      <div className="bg-surface-container p-6 rounded-xl">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{rawMarkdown}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // 否则用结构化展示
  return (
    <div className="space-y-6">
      {/* 工作经历 */}
      <section>
        <h3 className="text-title-md font-bold text-on-surface mb-3">工作经历</h3>
        <div className="space-y-3">
          {profile.work_experience?.map((work, idx) => (
            <div key={idx} className="bg-surface-container p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-label-bold text-on-surface">{work.company}</p>
                  <p className="text-body-sm text-on-surface-variant">{work.title}</p>
                </div>
                <span className="text-label-sm text-on-surface-variant">{work.duration}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {work.highlights?.map((h, i) => (
                  <li
                    key={i}
                    className="text-body-sm text-on-surface-variant flex items-start gap-2"
                  >
                    <span className="text-primary mt-1">•</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 项目经历 */}
      <section>
        <h3 className="text-title-md font-bold text-on-surface mb-3">项目经历</h3>
        <div className="space-y-3">
          {profile.projects?.map((project, idx) => (
            <div key={idx} className="bg-surface-container p-4 rounded-lg">
              <p className="font-label-bold text-on-surface">{project.name}</p>
              <p className="text-body-sm text-on-surface-variant mt-1">
                {project.description}
              </p>
              <p className="text-label-sm text-primary mt-2">角色：{project.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 技能栈 */}
      <section>
        <h3 className="text-title-md font-bold text-on-surface mb-3">技能栈</h3>
        <div className="flex flex-wrap gap-2">
          {profile.skills?.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
