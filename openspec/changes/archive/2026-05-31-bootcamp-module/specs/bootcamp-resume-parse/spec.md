## ADDED Requirements

### Requirement: User can upload resume file
The system SHALL allow authenticated users to upload a resume file (PDF or DOCX format, max 10MB).

#### Scenario: Successful upload
- **WHEN** user selects a valid PDF or DOCX file and clicks "上传简历"
- **THEN** system validates file type and size
- **AND** system extracts text content from the file
- **AND** system stores the extracted text for AI parsing

#### Scenario: Invalid file type
- **WHEN** user selects a file that is not PDF or DOCX
- **THEN** system displays error message "请上传 PDF 或 Word 格式的简历"
- **AND** system does not process the file

#### Scenario: File too large
- **WHEN** user selects a file larger than 10MB
- **THEN** system displays error message "文件大小不能超过 10MB"
- **AND** system does not process the file

### Requirement: AI parses resume into structured profile
The system SHALL parse the uploaded resume text into a structured profile including: work experience, project highlights, skill stack, and education background.

#### Scenario: Successful parsing
- **WHEN** resume text is successfully extracted
- **THEN** system sends text to AI model with structured parsing prompt
- **AND** system returns JSON with fields: work_experience[], projects[], skills[], education[]
- **AND** system stores parsed profile in bootcamp_sessions table

#### Scenario: Parsing failure
- **WHEN** resume text extraction fails (e.g., scanned PDF without OCR)
- **THEN** system displays error message "无法解析该简历，请尝试上传文字版 PDF 或手动输入关键信息"
- **AND** system provides manual input form as fallback

### Requirement: AI generates weakness prediction
The system SHALL analyze the parsed resume and generate an interview weakness prediction report.

#### Scenario: Weakness prediction generated
- **WHEN** resume parsing is complete
- **THEN** system sends parsed profile to AI model for weakness analysis
- **AND** system returns weakness report with: predicted weak dimensions, specific gap areas, recommended focus topics
- **AND** system displays weakness report to user
- **AND** system stores weakness prediction in bootcamp_sessions table

#### Scenario: Weakness prediction display
- **WHEN** user views the resume parse result page
- **THEN** system displays: capability radar chart, weakness list with severity (high/medium/low), recommended training focus
- **AND** system shows "开始特训" button to proceed to Day 1 interview
