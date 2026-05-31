## ADDED Requirements

### Requirement: AI generates daily interview questions
The system SHALL generate 5 interview questions per day for 3 consecutive days, with difficulty increasing each day and questions tailored to the user's resume and weakness prediction.

#### Scenario: Day 1 question generation
- **WHEN** user starts Day 1 of bootcamp
- **THEN** system generates 5 questions based on: resume projects, weakness prediction, basic difficulty level
- **AND** questions cover multiple dimensions (strategy, system design, data-driven, user insight, business thinking)
- **AND** system stores questions in bootcamp_interviews table with status "pending"

#### Scenario: Day N question generation (N > 1)
- **WHEN** user starts Day N of bootcamp
- **THEN** system generates 5 questions with increased difficulty compared to Day N-1
- **AND** system considers previous days' performance (low-scored dimensions get more focus)
- **AND** system includes case study questions on Day 2-3

### Requirement: User can answer interview questions
The system SHALL allow users to answer each interview question via text input and submit for AI evaluation.

#### Scenario: Successful answer submission
- **WHEN** user types answer in text area and clicks "提交回答"
- **THEN** system stores the answer in bootcamp_interviews table
- **AND** system sends answer to AI model for evaluation
- **AND** system displays loading state while AI evaluates

#### Scenario: Empty answer submission
- **WHEN** user clicks "提交回答" without typing anything
- **THEN** system displays error message "请输入你的回答"
- **AND** system does not submit empty answer

#### Scenario: Answer too short
- **WHEN** user submits answer with less than 20 characters
- **THEN** system displays warning "回答过于简短，建议详细阐述你的思路"
- **AND** system allows submission but may affect scoring

### Requirement: AI evaluates answer and provides score
The system SHALL evaluate each answer on a scale of 1-10 across four dimensions: structure, logic, professionalism, and innovation.

#### Scenario: Successful evaluation
- **WHEN** answer is submitted for evaluation
- **THEN** AI model returns: overall score (1-10), dimension scores (structure, logic, professionalism, innovation), detailed feedback text
- **AND** system stores evaluation result in bootcamp_interviews table
- **AND** system displays score breakdown and feedback to user

#### Scenario: Evaluation timeout
- **WHEN** AI evaluation takes longer than 30 seconds
- **THEN** system displays "评分正在计算中，请稍候..."
- **AND** system retries evaluation up to 3 times
- **AND** if all retries fail, system displays "评分服务暂时不可用，请稍后刷新页面查看"

### Requirement: Daily interview completion tracking
The system SHALL track which questions have been answered and completed each day.

#### Scenario: Question status tracking
- **WHEN** user views the interview page
- **THEN** system displays progress indicator (e.g., "第 3 / 5 题")
- **AND** system shows which questions are completed (answered + evaluated) vs pending
- **AND** user can navigate between questions using prev/next buttons

#### Scenario: Day completion
- **WHEN** user completes all 5 questions for the current day
- **THEN** system displays "今日特训完成" summary
- **AND** system shows overall day score and key takeaways
- **AND** system unlocks next day (or shows completion if Day 3)
