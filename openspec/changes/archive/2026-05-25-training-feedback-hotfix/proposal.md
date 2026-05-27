# Proposal: 修复题目质量反馈按钮不可用

## 问题描述
训练答题页（`/training/session`）题目卡片下方的"题目质量"点赞/点踩按钮点击后无响应，用户无法对题目进行反馈。

## 根因分析
`src/app/api/training/feedback/route.ts` 中调用 `supabase.from("question_feedback").upsert(...)` 写入数据，但 `supabase/schema.sql` 中**根本没有创建 `question_feedback` 表**。API 请求会 500 错误，前端 `.catch(() => {})` 静默吞掉异常，导致按钮点击后没有任何反馈。

## 修复目标
1. 在 `supabase/schema.sql` 中补全 `question_feedback` 表定义
2. 在 Supabase 数据库中执行建表语句
3. 添加前端用户反馈提示（成功/失败 toast）
4. 验证修复后按钮可正常工作
