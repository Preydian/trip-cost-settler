"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addManualExpense } from "@/actions/expenses";
import { createSettlement } from "@/actions/settlements";
import { updateTripStatus } from "@/actions/trips";
import type { Participant, TripStatus } from "@/lib/types";

export function AddSingleExpense({
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
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(participants[0]?.id ?? "");
  const [splitAmongIds, setSplitAmongIds] = useState<string[]>(
    participants.map((p) => p.id)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const needsResettle =
    currentStatus === "settled" || currentStatus === "coordinating";

  const toggleSplitParticipant = (id: string) => {
    setSplitAmongIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!paidById) {
      setError("Select who paid.");
      return;
    }
    if (splitAmongIds.length === 0) {
      setError("Select at least one person to split with.");
      return;
    }

    setError(null);

    startTransition(async () => {
      await addManualExpense(
        tripId,
        paidById,
        description.trim(),
        parsedAmount,
        splitAmongIds,
        batch
      );

      if (needsResettle) {
        await createSettlement(tripId);
        await updateTripStatus(tripId, "coordinating");
      } else {
        await updateTripStatus(tripId, currentStatus);
      }

      onDone();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Single Expense</CardTitle>
        <p className="text-xs text-muted-foreground">
          Manually enter the expense details.
          {needsResettle
            ? " The settlement will be recalculated."
            : " The expense will be added to the review list."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Description</label>
          <Input
            placeholder="e.g. Dinner at restaurant"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Amount</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Paid by</label>
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaidById(p.id)}
                disabled={isPending}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  paidById === p.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Split among</label>
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleSplitParticipant(p.id)}
                disabled={isPending}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  splitAmongIds.includes(p.id)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full"
        >
          {isPending
            ? "Saving..."
            : needsResettle
              ? "Add & Recalculate Settlement"
              : "Add Expense"}
        </Button>
      </CardContent>
    </Card>
  );
}
