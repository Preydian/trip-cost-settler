"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveExtractedExpenses } from "@/actions/expenses";
import { createSettlement } from "@/actions/settlements";
import { updateTripStatus } from "@/actions/trips";
import type { ExtractionResult, Participant, TripStatus } from "@/lib/types";

export function AddLateExpenses({
  tripId,
  participants,
  batch,
  currentStatus,
  onDone,
}: {
  tripId: string;
  participants: Participant[];
  batch: number;
  currentStatus: TripStatus;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const existingNames = participants.map((p) => p.name);
  const needsResettle =
    currentStatus === "settled" || currentStatus === "coordinating";

  const handleExtract = async () => {
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
        `Found ${result.expenses.length} new expense(s). Saving${needsResettle ? " and recalculating" : ""}...`
      );

      const allNames = [...new Set([...existingNames, ...result.participants])];

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

        if (needsResettle) {
          await createSettlement(tripId);
          await updateTripStatus(tripId, "coordinating");
        } else {
          // Stay on current step — saveExtractedExpenses sets status to "reviewing"
          // so we need to restore it if we were already reviewing
          await updateTripStatus(tripId, currentStatus);
        }

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
    <div className="space-y-3">
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
        onClick={handleExtract}
        disabled={!text.trim() || busy}
        className="w-full"
      >
        {busy
          ? "Processing..."
          : needsResettle
            ? "Add & Recalculate Settlement"
            : "Add Expenses"}
      </Button>
    </div>
  );
}
