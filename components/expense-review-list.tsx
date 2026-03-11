"use client";

import { useState, useTransition, useMemo } from "react";
import { LayoutListIcon, LayoutGridIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseCard } from "@/components/expense-card";
import { createSettlement } from "@/actions/settlements";
import { updateTripStatus } from "@/actions/trips";
import { formatCurrency } from "@/lib/settlement";
import type { ExpenseWithDetails, Participant } from "@/lib/types";

type Layout = "list" | "grid";

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
  const [layout, setLayout] = useState<Layout>("list");
  const [filterById, setFilterById] = useState<string | null>(null);

  const participantIds = useMemo(
    () => new Set(participants.map((p) => p.id)),
    [participants]
  );
  const activeFilter =
    filterById && participantIds.has(filterById) ? filterById : null;

  const filteredExpenses = activeFilter
    ? expenses.filter(
        (e) =>
          e.paid_by_id === activeFilter ||
          e.splits.some((s) => s.participant_id === activeFilter)
      )
    : expenses;

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const filterTotal = activeFilter
    ? filteredExpenses.reduce((sum, e) => {
        const split = e.splits.find((s) => s.participant_id === activeFilter);
        return sum + (split ? Number(split.amount) : 0);
      }, 0)
    : null;

  const filterName = activeFilter
    ? participants.find((p) => p.id === activeFilter)?.name
    : null;

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
            {activeFilter ? (
              <>
                {filteredExpenses.length} of {expenses.length} expenses
                {" \u00b7 "}
                <span className="font-medium text-foreground">{filterName}</span> owes{" "}
                {formatCurrency(filterTotal ?? 0, currency)}
              </>
            ) : (
              <>
                {expenses.length} expenses totalling{" "}
                {formatCurrency(total, currency)}.
                {!readOnly && " Edit or delete any that look wrong."}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant={layout === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setLayout("list")}
          >
            <LayoutListIcon className="size-4" />
          </Button>
          <Button
            variant={layout === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setLayout("grid")}
          >
            <LayoutGridIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilterById(null)}
          className={`cursor-pointer rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
            activeFilter === null
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-foreground/30"
          }`}
        >
          All
        </button>
        {participants.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setFilterById((prev) => (prev === p.id ? null : p.id))}
            className={`cursor-pointer rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
              activeFilter === p.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/30"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div
        className={`max-h-[32rem] overflow-y-auto p-[5px] ${
          layout === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"
        }`}
      >
        {filteredExpenses.map((expense) => (
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
