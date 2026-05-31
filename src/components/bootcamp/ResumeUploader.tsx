"use client";

import { useState, useCallback } from "react";

interface Props {
  onUpload: (file: File) => void;
  onTextSubmit?: (text: string) => void;
  isUploading: boolean;
}

export default function ResumeUploader({ onUpload, onTextSubmit, isUploading }: Props) {
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [error, setError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const validateAndUpload = useCallback(
    (file: File) => {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        setError("请上传 PDF 或 Word 格式的简历");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("文件大小不能超过 10MB");
        return;
      }

      onUpload(file);
    },
    [onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      setError("");

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      validateAndUpload(files[0]);
    },
    [validateAndUpload]
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
      {/* 模式切换 */}
      <div className="flex bg-surface-container rounded-lg p-1">
        <button
          onClick={() => { setMode("file"); setError(""); }}
          className={`flex-1 py-2 rounded-md text-body-sm font-label-bold transition-colors ${
            mode === "file"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          上传文件
        </button>
        <button
          onClick={() => { setMode("paste"); setError(""); }}
          className={`flex-1 py-2 rounded-md text-body-sm font-label-bold transition-colors ${
            mode === "paste"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          粘贴文本
        </button>
      </div>

      {mode === "file" ? (
        /* 文件上传模式 */
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary-container"
                : "border-outline-variant hover:border-primary"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload" className="cursor-pointer block">
              <span className="material-symbols-outlined text-5xl text-primary mb-4">
                upload_file
              </span>
              <p className="text-body-lg text-on-surface">
                {isDragActive
                  ? "松开以上传简历"
                  : "拖拽简历到此处，或点击选择文件"}
              </p>
              <p className="text-body-sm text-on-surface-variant mt-2">
                支持 PDF、Word 格式，最大 10MB
              </p>
            </label>
          </div>
        </>
      ) : (
        /* 粘贴文本模式 */
        <>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="在此粘贴你的 Markdown 格式简历...&#10;&#10;例如：&#10;## 工作经历&#10;- **公司A** | 产品经理 | 2020-2023&#10;  - 负责XX产品从0到1&#10;&#10;## 项目经历&#10;- **项目B** | 核心成员&#10;  - 实现了XX功能"
            className="w-full h-64 p-4 bg-surface-container rounded-xl border border-outline-variant text-on-surface placeholder-on-surface-variant resize-none focus:outline-none focus:border-primary font-mono text-body-sm"
          />
          <button
            onClick={handleTextSubmit}
            disabled={isUploading || !pastedText.trim()}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-bold disabled:opacity-50"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-on-primary border-t-transparent" />
                正在解析简历...
              </span>
            ) : (
              "提交简历文本"
            )}
          </button>
        </>
      )}

      {error && (
        <div className="flex items-center gap-2 text-error text-body-sm">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}
    </div>
  );
}
