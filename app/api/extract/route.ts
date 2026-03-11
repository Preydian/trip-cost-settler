import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeJobPage, ScrapeError } from "@/lib/scraper";
import { extractJobInfo } from "@/lib/ai-extract";
import { z } from "zod";

const requestSchema = z.object({
  url: z.string(),
  text: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, text } = requestSchema.parse(body);

    let pageContent: string;

    if (text) {
      // Manual text input
      pageContent = text;
    } else {
      // Validate URL format for scraping
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: "Please enter a valid URL" },
          { status: 400 }
        );
      }
      pageContent = await scrapeJobPage(url);
    }

    if (pageContent.length < 50) {
      return NextResponse.json(
        { error: "Not enough content to extract job information. Try pasting the job description manually." },
        { status: 422 }
      );
    }

    const extracted = await extractJobInfo(pageContent);

    return NextResponse.json(extracted);
  } catch (error) {
    if (error instanceof ScrapeError) {
      return NextResponse.json(
        { error: error.message, scrapeBlocked: true },
        { status: 422 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract job information. Please try again." },
      { status: 500 }
    );
  }
}
