"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileUp, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  onUpload: (file: File) => void;
  onTextSubmit?: (text: string) => void;
  isUploading: boolean;
}

export default function ResumeUploader({
  onUpload,
  onTextSubmit,
  isUploading,
}: Props) {
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [error, setError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const validateAndUpload = useCallback(
    (file: File) => {
      if (isUploading) return;

      const fileName = file.name.toLowerCase();
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/markdown",
      ];
      const isMarkdownFile =
        fileName.endsWith(".md") || fileName.endsWith(".markdown");

      if (!allowedTypes.includes(file.type) && !isMarkdownFile) {
        setError("请上传 PDF、Word 或 Markdown 格式的简历");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("文件大小不能超过 10MB");
        return;
      }

      onUpload(file);
    },
    [isUploading, onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isUploading) return;
    setIsDragActive(true);
  }, [isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      if (isUploading) return;
      setError("");

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      validateAndUpload(files[0]);
    },
    [isUploading, validateAndUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");
      const file = e.target.files?.[0];
      if (!file) return;

      validateAndUpload(file);
    },
    [validateAndUpload]
  );

  const handleTextSubmit = () => {
    if (!pastedText.trim()) {
      setError("请输入简历内容");
      return;
    }
    if (pastedText.trim().length < 50) {
      setError("简历内容过于简短，请补充更多信息");
      return;
    }
    setError("");
    onTextSubmit?.(pastedText);
  };

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg bg-surface p-1">
        <button
          disabled={isUploading}
          onClick={() => {
            setMode("file");
            setError("");
          }}
          className={cn(
            "flex-1 rounded-md py-2 text-body-sm font-semibold transition-colors",
            mode === "file"
              ? "bg-primary text-white"
              : "text-ink-muted hover:text-ink"
          )}
        >
          上传文件
        </button>
        <button
          disabled={isUploading}
          onClick={() => {
            setMode("paste");
            setError("");
          }}
          className={cn(
            "flex-1 rounded-md py-2 text-body-sm font-semibold transition-colors",
            mode === "paste"
              ? "bg-primary text-white"
              : "text-ink-muted hover:text-ink"
          )}
        >
          粘贴文本
        </button>
      </div>

      {mode === "file" ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "rounded-lg border-2 border-dashed px-5 py-8 text-center transition-colors sm:px-8",
            isUploading ? "cursor-wait opacity-80" : "cursor-pointer",
            isDragActive
              ? "border-primary bg-primary-soft"
              : "border-line hover:border-primary/50"
          )}
        >
          <input
            type="file"
            accept=".pdf,.docx,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className={cn("block", isUploading ? "cursor-wait" : "cursor-pointer")}
          >
            {isUploading ? (
              <Loader2
                className="mx-auto mb-3 h-8 w-8 animate-spin text-primary"
                strokeWidth={1.5}
              />
            ) : (
              <FileUp
                className="mx-auto mb-3 h-8 w-8 text-primary"
                strokeWidth={1.5}
              />
            )}
            <p className="text-body-md font-semibold text-ink">
              {isUploading
                ? "正在解析简历..."
                : isDragActive
                ? "松开以上传简历"
                : "拖拽简历到此处，或点击选择文件"}
            </p>
            <p className="text-body-sm text-ink-muted mt-2">
              {isUploading
                ? "解析完成后将显示项目证据。"
                : "支持 PDF、Word、Markdown 格式，最大 10MB"}
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={"在此粘贴你的 Markdown 格式简历...\n\n例如：\n## 工作经历\n- **公司A** | 产品经理 | 2020-2023\n  - 负责XX产品从0到1\n\n## 项目经历\n- **项目B** | 核心成员\n  - 实现了XX功能"}
            rows={12}
            className="font-mono text-body-sm"
          />
          <Button
            fullWidth
            onClick={handleTextSubmit}
            disabled={isUploading || !pastedText.trim()}
            loading={isUploading}
          >
            {isUploading ? "正在解析简历..." : "提交简历文本"}
          </Button>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-center gap-2 text-body-sm text-danger">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
