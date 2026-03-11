export type JobStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected";

export interface Job {
  id: string;
  user_id: string;
  source_url: string;
  job_role: string;
  company_name: string;
  experience_years: string | null;
  location: string | null;
  date_posted: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  description_summary: string | null;
  required_skills: string[] | null;
  status: JobStatus;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedJob {
  job_role: string;
  company_name: string;
  experience_years: string | null;
  location: string | null;
  date_posted: string | null;
  salary_min: number | null;
  salary_max: number | null;
  description_summary: string | null;
  required_skills: string[];
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}
