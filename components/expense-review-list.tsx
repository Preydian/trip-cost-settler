"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ExpenseCard } from "@/components/expense-card";
import { createSettlement } from "@/actions/settlements";
import { updateTripStatus } from "@/actions/trips";
import { formatCurrency } from "@/lib/settlement";
import type { ExpenseWithDetails, Participant } from "@/lib/types";

export function ExpenseReviewList({
  tripId,
  expenses,
  participants,
  currency,
  readOnly = false,
}: {
  tripId: string;
  expenses: ExpenseWithDetails[];
  participants: Participant[];
  currency: string;
  readOnly?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const handleCalculate = () => {
    startTransition(() => createSettlement(tripId));
  };

  const handleBack = () => {
    startTransition(() => updateTripStatus(tripId, "parsing"));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Review Expenses</h2>
          <p className="text-sm text-muted-foreground">
            {expenses.length} expenses totalling{" "}
            {formatCurrency(total, currency)}.
            {!readOnly && " Edit or delete any that look wrong."}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            participants={participants}
            tripId={tripId}
            currency={currency}
            readOnly={readOnly}
          />
        ))}
      </div>

      {expenses.length === 0 && (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No expenses yet. Go back to paste messages.
        </div>
      )}

      {!readOnly && (
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={handleBack} disabled={isPending}>
            Back
          </Button>
          <Button
            onClick={handleCalculate}
            disabled={expenses.length === 0 || isPending}
            className="flex-1"
          >
            {isPending ? "Calculating..." : "Calculate Settlement"}
          </Button>
        </div>
      )}
    </div>
  );
}
