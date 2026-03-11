"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveExtractedExpenses } from "@/actions/expenses";
import { createSettlement } from "@/actions/settlements";
import { updateTripStatus } from "@/actions/trips";
import type { ExtractionResult, Participant } from "@/lib/types";

export function AddLateExpenses({
  tripId,
  participants,
  batch,
  onDone,
}: {
  tripId: string;
  participants: Participant[];
  batch: number;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Existing participant names for context
  const existingNames = participants.map((p) => p.name);

  const handleExtractAndResettle = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setStatus("Extracting new expenses...");

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
        setError("No expenses found in the text.");
        setStatus(null);
        setLoading(false);
        return;
      }

      setStatus(
        `Found ${result.expenses.length} new expense(s). Saving and recalculating...`
      );

      // Merge participant names
      const allNames = [
        ...new Set([...existingNames, ...result.participants]),
      ];

      startTransition(async () => {
        await saveExtractedExpenses(
          tripId,
          text,
          result,
          result.expenses,
          allNames,
          result.currency,
          batch
        );
        // Recalculate settlement with new expenses
        await createSettlement(tripId);
        // Go back to coordinating
        await updateTripStatus(tripId, "coordinating");
        onDone();
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus(null);
      setLoading(false);
    }
  };

  const busy = loading || isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Late Expense</CardTitle>
        <p className="text-xs text-muted-foreground">
          Paste the new expense message. Already-confirmed payments will be
          preserved and the settlement will be recalculated.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder={`e.g. "Hey, I forgot - I also paid $120 for the rental car on day two"`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          disabled={busy}
        />

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
          onClick={handleExtractAndResettle}
          disabled={!text.trim() || busy}
          className="w-full"
        >
          {busy ? "Processing..." : "Add & Recalculate Settlement"}
        </Button>
      </CardContent>
    </Card>
  );
}
