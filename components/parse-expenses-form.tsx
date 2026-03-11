"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveExtractedExpenses } from "@/actions/expenses";
import type { ExtractionResult } from "@/lib/types";

export function ParseExpensesForm({
  tripId,
  batch,
}: {
  tripId: string;
  batch: number;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleExtract = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setStatus("Extracting expenses with AI...");

    try {
      const response = await fetch("/api/extract-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Extraction failed");
        setStatus(null);
        setLoading(false);
        return;
      }

      const result = data as ExtractionResult;

      if (result.expenses.length === 0) {
        setError(
          "No expenses found in the text. Make sure the messages include amounts and who paid."
        );
        setStatus(null);
        setLoading(false);
        return;
      }

      setStatus(`Found ${result.expenses.length} expenses. Saving...`);

      startTransition(async () => {
        await saveExtractedExpenses(
          tripId,
          text,
          result,
          result.expenses,
          result.participants,
          result.currency,
          batch
        );
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus(null);
      setLoading(false);
    }
  };

  const busy = loading || isPending;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="expense-text" className="text-sm font-medium">
          Paste expense messages
        </label>
        <p className="mb-2 text-xs text-muted-foreground">
          Paste the messages from your group exactly as you received them. The AI
          will figure out who paid what.
        </p>
        <Textarea
          id="expense-text"
          placeholder={`e.g.\nDave: I paid $120 for the rental car\nSarah: dinner last night was on me - $85\nMike: got the groceries, came to $47.50`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          disabled={busy}
          className="min-h-[200px]"
        />
      </div>

      {status && (
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {status}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        onClick={handleExtract}
        disabled={!text.trim() || busy}
        className="w-full"
        size="lg"
      >
        {busy ? "Extracting..." : "Extract Expenses"}
      </Button>
    </div>
  );
}
