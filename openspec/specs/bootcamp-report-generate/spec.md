## ADDED Requirements

### Requirement: AI generates per-interview diagnostic report
The system SHALL generate a detailed diagnostic report after each interview answer is evaluated.

#### Scenario: Single answer report
- **WHEN** answer evaluation is complete
- **THEN** system generates report containing: score breakdown radar chart, key strengths (what was good), specific gaps (what was missing), actionable improvement suggestions, comparison to benchmark (average score for this question type)
- **AND** system displays report inline below the answer
- **AND** user can toggle "查看详细分析" to expand full report

#### Scenario: Daily summary report
- **WHEN** user completes all 5 questions for a day
- **THEN** system generates daily summary report containing: overall day score, dimension trend (compared to previous day), weakest question with detailed feedback, strongest question with best practices, recommended reading/resources for weak areas
- **AND** system stores daily report in bootcamp_reports table with type "daily"

### Requirement: AI generates 3-day comprehensive report
The system SHALL generate a comprehensive growth report after Day 3 is completed.

#### Scenario: Comprehensive report generation
- **WHEN** user completes Day 3 (all 3 days finished)
- **THEN** system generates comprehensive report containing: Day 1 vs Day 3 score comparison (overall + per dimension), growth trajectory chart, persistent weak areas that need long-term focus, strongest improvements, personalized study plan for post-bootcamp training, overall bootcamp grade (A/B/C/D)
- **AND** system stores comprehensive report in bootcamp_reports table with type "comprehensive"
- **AND** system displays completion celebration UI with report download option

#### Scenario: Report sharing
- **WHEN** user views the comprehensive report
- **THEN** system provides "分享报告" button
- **AND** system generates shareable link or image snapshot of report
- **AND** shared view is read-only and does not expose other user data

### Requirement: Report history and retrieval
The system SHALL allow users to view past reports from completed bootcamp sessions.

#### Scenario: View historical reports
- **WHEN** user navigates to "特训报告" page
- **THEN** system displays list of all completed bootcamp sessions with dates and final grades
- **AND** user can click any session to view its daily reports and comprehensive report
- **AND** system displays "尚未完成特训" message if user has no completed sessions

#### Scenario: Report persistence
- **WHEN** a bootcamp session is completed
- **THEN** system retains all daily reports and comprehensive report indefinitely
- **AND** reports are associated with user_id for privacy
