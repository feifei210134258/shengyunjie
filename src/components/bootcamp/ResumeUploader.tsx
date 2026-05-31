"use client";

import { useState, useCallback } from "react";

interface Props {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export default function ResumeUploader({ onUpload, isUploading }: Props) {
  const [error, setError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

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
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");
      const file = e.target.files?.[0];
      if (!file) return;

      validateAndUpload(file);
    },
    [onUpload]
  );

  const validateAndUpload = (file: File) => {
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
  };

  return (
    <div className="space-y-4">
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

      {error && (
        <div className="flex items-center gap-2 text-error text-body-sm">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          <span className="text-body-md text-on-surface-variant">正在解析简历...</span>
        </div>
      )}
    </div>
  );
}
