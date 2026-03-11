import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { ExtractedJob } from "./types";

const extractionSchema = z.object({
  job_role: z.string(),
  company_name: z.string(),
  experience_years: z.string().nullable(),
  location: z.string().nullable(),
  date_posted: z.string().nullable(),
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
  description_summary: z.string().nullable(),
  required_skills: z.array(z.string()),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Models to try in order of preference (based on available free-tier quota)
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash",
];

const prompt = (pageContent: string, today: string) => `Extract job posting information from the following webpage content.
Today's date is ${today}.

Return a JSON object with these exact keys:
- job_role (string): the job title
- company_name (string): the hiring company
- experience_years (string or null): e.g. "3-5", "5+", "Entry level"
- location (string or null): city/state/country or "Remote"
- date_posted (string or null): ISO date YYYY-MM-DD. If the page says something like "Posted 5d ago" or "Posted 2 weeks ago", calculate the actual date using today's date.
- salary_min (number or null): annual salary lower bound in USD (whole dollars)
- salary_max (number or null): annual salary upper bound in USD (whole dollars)
- description_summary (string): 2-3 sentence summary of the role
- required_skills (string[]): list of key technical skills/requirements

If a field cannot be determined from the content, use null.

Webpage content:
${pageContent}`;

export async function extractJobInfo(pageContent: string): Promise<ExtractedJob> {
  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const today = new Date().toISOString().split("T")[0];
      const result = await model.generateContent(prompt(pageContent, today));
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI did not return valid JSON");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = extractionSchema.parse(parsed);

      return validated;
    } catch (error) {
      lastError = error as Error;
      const msg = lastError.message || "";
      // Retry with next model on rate limit, overload, or unavailable
      if (msg.includes("429") || msg.includes("503") || msg.includes("overloaded")) {
        console.warn(`Model ${modelName} unavailable, trying next fallback...`);
        continue;
      }
      // For other errors (bad JSON, validation, auth), don't retry
      throw error;
    }
  }

  throw lastError || new Error("All models failed");
}
