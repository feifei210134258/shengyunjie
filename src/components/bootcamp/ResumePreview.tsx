"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ParsedProfile } from "@/types/bootcamp";

interface Props {
  profile: ParsedProfile;
  rawMarkdown?: string;
}

export default function ResumePreview({ profile, rawMarkdown }: Props) {
  if (rawMarkdown) {
    return (
      <div className="rounded-xl bg-surface p-6">
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{rawMarkdown}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Work experience */}
      <section>
        <h3 className="text-heading-md font-semibold text-ink mb-3">工作经历</h3>
        <div className="space-y-3">
          {profile.work_experience?.map((work, idx) => (
            <div key={idx} className="bg-surface p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-ink">{work.company}</p>
                  <p className="text-body-sm text-ink-muted">{work.title}</p>
                </div>
                <span className="text-label text-ink-faint">{work.duration}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {work.highlights?.map((h, i) => (
                  <li
                    key={i}
                    className="text-body-sm text-ink-muted flex items-start gap-2"
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

      {/* Projects */}
      <section>
        <h3 className="text-heading-md font-semibold text-ink mb-3">项目经历</h3>
        <div className="space-y-3">
          {profile.projects?.map((project, idx) => (
            <div key={idx} className="bg-surface p-4 rounded-xl">
              <p className="font-semibold text-ink">{project.name}</p>
              <p className="text-body-sm text-ink-muted mt-1">
                {project.description}
              </p>
              <p className="text-label text-primary mt-2">
                {project.company ? `公司：${project.company} · ` : ""}
                角色：{project.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section>
        <h3 className="text-heading-md font-semibold text-ink mb-3">技能栈</h3>
        <div className="flex flex-wrap gap-2">
          {profile.skills?.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-secondary-soft text-secondary rounded-lg text-label font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
