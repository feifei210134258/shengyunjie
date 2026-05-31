# Tasks: 特训冲刺模块

## 1. Database Schema

- [x] 1.1 Create `bootcamp_sessions` table (id, user_id, status, current_day, resume_text, parsed_profile, weakness_prediction, created_at, updated_at)
- [x] 1.2 Create `bootcamp_interviews` table (id, session_id, day_number, question_index, question_text, user_answer, ai_evaluation, scores, status, created_at)
- [x] 1.3 Create `bootcamp_reports` table (id, session_id, report_type, content, scores_snapshot, created_at)
- [x] 1.4 Add RLS policies for all three tables (authenticated users can only access their own data)
- [x] 1.5 Update `supabase/schema.sql` with new tables and policies

## 2. API Routes

- [ ] 2.1 Implement `POST /api/bootcamp/resume` — receive file upload, extract text, call AI parsing, store result
- [ ] 2.2 Implement `GET /api/bootcamp/resume` — retrieve parsed resume and weakness prediction
- [ ] 2.3 Implement `POST /api/bootcamp/interview` — generate daily questions (Day N logic with difficulty progression, N = 1-3)
- [ ] 2.4 Implement `GET /api/bootcamp/interview` — retrieve current day's questions and progress
- [ ] 2.5 Implement `POST /api/bootcamp/interview/answer` — submit answer, trigger AI evaluation
- [ ] 2.6 Implement `GET /api/bootcamp/report` — retrieve daily or comprehensive report
- [ ] 2.7 Implement `POST /api/bootcamp/report` — generate report after day completion

## 3. AI Prompts

- [ ] 3.1 Create resume parsing prompt (`src/prompts/bootcamp-resume-parse.md`)
- [ ] 3.2 Create weakness prediction prompt (`src/prompts/bootcamp-weakness-predict.md`)
- [ ] 3.3 Create interview question generation prompt (`src/prompts/bootcamp-question-gen.md`)
- [ ] 3.4 Create answer evaluation prompt (`src/prompts/bootcamp-answer-eval.md`)
- [ ] 3.5 Create daily report generation prompt (`src/prompts/bootcamp-daily-report.md`)
- [ ] 3.6 Create comprehensive report generation prompt (`src/prompts/bootcamp-comprehensive-report.md`)

## 4. Frontend Pages

- [ ] 4.1 Create `/bootcamp/resume` page — file upload UI, parse result display, weakness report, "开始特训" CTA
- [ ] 4.2 Create `/bootcamp/interview` page — question display, text input, submit button, progress indicator (第 X / 5 题, Day X / 3), prev/next navigation
- [ ] 4.3 Create `/bootcamp/report` page — daily report view, comprehensive report view, report history list

## 5. Components

- [ ] 5.1 Create `ResumeUploader` component — drag & drop file upload with validation
- [ ] 5.2 Create `ResumePreview` component — display parsed resume in structured format
- [ ] 5.3 Create `WeaknessReport` component — radar chart + weakness list + severity badges
- [ ] 5.4 Create `InterviewQuestion` component — question card with answer input
- [ ] 5.5 Create `AnswerEvaluation` component — score display + dimension breakdown + feedback text
- [ ] 5.6 Create `DailySummary` component — day completion celebration + key takeaways
- [ ] 5.7 Create `ReportCard` component — report display with charts and insights

## 6. Integration & Testing

- [ ] 6.1 Integrate resume upload → parse → weakness prediction flow end-to-end
- [ ] 6.2 Integrate daily question generation → answer → evaluation flow end-to-end
- [ ] 6.3 Integrate report generation after day completion
- [ ] 6.4 Test 3-day progression logic (Day 1 → Day 3)
- [ ] 6.5 Test session persistence (refresh, logout/login)
- [ ] 6.6 Test error handling (invalid file, parse failure, AI timeout)
- [x] 6.7 Run `npx tsc --noEmit` and fix all type errors
- [x] 6.8 Run `npx eslint src/ --max-warnings 0` and fix all lint errors
- [x] 6.9 Run `./init.sh` to verify full environment health
