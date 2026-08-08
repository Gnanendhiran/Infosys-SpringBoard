// Firebase types for the application

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: 'recruiter' | 'candidate';
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'analyzed';
  extracted_text?: string;
  file_url?: string;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  extracted_skills: string[];
  experience_years: number;
  education_level: string;
  job_titles: string[];
  match_score: number;
  skill_gaps: Array<{ skill: string; importance: string }>;
  learning_recommendations: Array<{ course: string; platform: string; url: string }>;
  project_suggestions: Array<{ title: string; description: string; skills: string[] }>;
  ats_score: number;
  ats_breakdown?: {
    skill_match_score: number;
    keyword_match_score: number;
    experience_match_score: number;
    education_match_score: number;
    formatting_score: number;
    final_ats_score: number;
  };
  predicted_roles: string[];
  analyzed_at: string;
}


