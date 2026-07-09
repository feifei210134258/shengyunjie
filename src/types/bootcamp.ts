export interface ParsedProfile {
  work_experience: Array<{
    company: string;
    title: string;
    duration: string;
    highlights: string[];
  }>;
  projects: Array<{
    name: string;
    company?: string;
    description: string;
    role: string;
    outcomes: string[];
  }>;
  skills: string[];
  education: Array<{
    school: string;
    degree: string;
    major: string;
  }>;
}

export interface WeaknessPrediction {
  weak_dimensions: Array<{
    dimension: string;
    severity: "high" | "medium" | "low";
    gap_description: string;
  }>;
  recommended_focus: string[];
}

export interface AIEvaluation {
  overall_score: number;
  structure: number;
  logic: number;
  professionalism: number;
  innovation: number;
  feedback: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  thinking_framework?: string[];
  example_answer?: string;
  improved_answer?: string;
  next_practice?: string;
  target_evidence_validation?: {
    score: number;
    status: "defended" | "weak" | "unclear";
    verdict: string;
    evidence_matched: string[];
    unresolved_risks: string[];
    next_drill: string;
    project_name?: string;
    target_evidence?: string;
  };
}

export interface InterviewQuestion {
  id: string;
  session_id: string;
  day_number: number;
  question_index: number;
  question_text: string;
  question_type: string;
  difficulty: number;
  user_answer?: string;
  ai_evaluation?: AIEvaluation;
  status: "pending" | "answered" | "evaluated";
  created_at: string;
  updated_at: string;
}

export interface BootcampSession {
  id: string;
  user_id: string;
  status: "not_started" | "in_progress" | "completed";
  current_day: number;
  resume_text?: string;
  parsed_profile?: ParsedProfile;
  weakness_prediction?: WeaknessPrediction;
  created_at: string;
  updated_at: string;
}

export interface BootcampReport {
  id: string;
  session_id: string;
  report_type: "daily" | "comprehensive";
  day_number?: number;
  content: {
    summary: string;
    key_takeaways: string[];
    recommended_reading?: string[];
    grade?: string;
    comparison?: {
      day1_scores: Record<string, number>;
      day3_scores: Record<string, number>;
      growth: string;
    };
  };
  scores_snapshot?: Record<string, number>;
  created_at: string;
}
