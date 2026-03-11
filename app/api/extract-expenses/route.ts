import { NextResponse } from "next/server";
import { extractExpenses } from "@/lib/ai-extract";
import { z } from "zod";

const requestSchema = z.object({
  text: z.string().min(10, "Please provide more text to extract expenses from"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = requestSchema.parse(body);

    const extracted = await extractExpenses(text);

    return NextResponse.json(extracted);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract expenses. Please try again." },
      { status: 500 }
    );
  }
}
