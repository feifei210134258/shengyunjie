# Proposal: 支持 .md 简历文件上传

## 动机

特训冲刺 Day 0 的简历解析已经支持粘贴 Markdown 文本，但文件上传控件仍只允许 PDF 和 Word。用户如果已有 `.md` 简历文件，需要先复制粘贴，体验不顺。

## 目标

- 允许用户在简历上传控件中直接选择或拖拽 `.md` / `.markdown` 文件。
- 后端校验对 Markdown 文件 MIME 和扩展名大小写更稳健。
- 保持现有 PDF、Word 和粘贴文本路径不变。

## 范围

- 修改 `ResumeUploader` 文件类型校验、错误文案、`accept` 属性和说明文案。
- 修改 `/api/bootcamp/resume` 的 Markdown 文件识别逻辑。
- 运行轻量验证并记录结果。
