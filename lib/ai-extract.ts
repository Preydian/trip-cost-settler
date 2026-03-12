import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { ExtractionResult } from "./types";

const extractionSchema = z.object({
  expenses: z.array(
    z.object({
      paid_by: z.string(),
      description: z.string(),
      amount: z.number().positive(),
      split_among: z.array(z.string()).nullable(),
      source_text: z.string().nullable(),
    })
  ),
  participants: z.array(z.string()),
  currency: z.string(),
  notes: z.string().nullable(),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash",
];

const buildPrompt = (messageText: string) =>
  `Extract expense information from the following group trip messages.
People are reporting what they paid during a trip. The text may be messy,
informal, use slang, abbreviations, or multiple languages.

Return a JSON object with these exact keys:
- expenses (array): each item has:
  - paid_by (string): the person who paid. Use their most common name form.
  - description (string): brief description of what was paid for
  - amount (number): the amount paid, as a positive number
  - split_among (string[] or null): if the message specifies who this expense
    is split among, list those names. If it's for everyone or not specified,
    use null.
  - source_text (string or null): the exact snippet from the original message
    that this expense was extracted from. Keep it short — just the relevant
    clause, e.g. "I booked the Airbnb for $640".
- participants (string[]): list of ALL unique people mentioned (payers and
  those in split_among). Normalize names: if "Dave" and "David" appear to be
  the same person, pick one form and use it consistently.
- currency (string): the primary currency detected (e.g. "USD", "EUR", "AUD").
  If mixed currencies appear, note this. Default to "USD" if unclear.
- notes (string or null): any observations about ambiguity, unclear amounts,
  or things the organiser should double-check.

Rules:
- If someone says "I paid $50 for dinner for me and Sarah", that's one expense
  of $50 paid by that person, split among that person and Sarah.
- If amounts include tax/tip already, treat them as-is.
- If someone lists multiple items, create separate expense entries.
- Ignore messages that don't contain expense information.
- If a message is ambiguous about the amount, include it with your best guess
  and mention the ambiguity in notes.

Messages:
${messageText}`;

export async function extractExpenses(
  messageText: string
): Promise<ExtractionResult> {
  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(buildPrompt(messageText));
      const text = result.response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI did not return valid JSON");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return extractionSchema.parse(parsed);
    } catch (error) {
      lastError = error as Error;
      const msg = lastError.message || "";
      if (
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("overloaded")
      ) {
        console.warn(
          `Model ${modelName} unavailable, trying next fallback...`
        );
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("All models failed");
}
