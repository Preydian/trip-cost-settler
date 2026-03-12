"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateExpense, deleteExpense } from "@/actions/expenses";
import { formatCurrency } from "@/lib/settlement";
import { Pencil, Trash2, X, Check } from "lucide-react";
import type { ExpenseWithDetails, Participant } from "@/lib/types";

export function ExpenseCard({
  expense,
  participants,
  tripId,
  currency,
  readOnly = false,
}: {
  expense: ExpenseWithDetails;
  participants: Participant[];
  tripId: string;
  currency: string;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [paidById, setPaidById] = useState(expense.paid_by_id);
  const [splitAmongIds, setSplitAmongIds] = useState<string[]>(
    expense.splits.map((s) => s.participant_id)
  );
  const [isPending, startTransition] = useTransition();

  const isAllParticipants = expense.splits.length === participants.length;
  const splitLabel = isAllParticipants
    ? "All"
    : expense.splits.map((s) => s.participant.name).join(", ");

  const resetForm = () => {
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setPaidById(expense.paid_by_id);
    setSplitAmongIds(expense.splits.map((s) => s.participant_id));
    setEditing(false);
  };

  const toggleSplitParticipant = (id: string) => {
    setSplitAmongIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const allSelected = splitAmongIds.length === participants.length;
  const toggleAll = () => {
    setSplitAmongIds(allSelected ? [] : participants.map((p) => p.id));
  };

  const handleSave = () => {
    if (splitAmongIds.length === 0) return;
    startTransition(async () => {
      await updateExpense(expense.id, tripId, {
        description,
        amount: parseFloat(amount),
        paid_by_id: paidById,
        split_among_ids: splitAmongIds,
      });
      setEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(() => deleteExpense(expense.id, tripId));
  };

  if (editing && !readOnly) {
    return (
      <Card size="sm">
        <CardContent className="space-y-2">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-32"
            />
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Split among</span>
              <button
                type="button"
                className="cursor-pointer text-xs text-primary hover:underline"
                onClick={toggleAll}
              >
                {allSelected ? "Clear" : "All"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {participants.map((p) => {
                const selected = splitAmongIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleSplitParticipant(p.id)}
                    className={`cursor-pointer rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} disabled={isPending || splitAmongIds.length === 0}>
              <Check className="size-3.5" />
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetForm}
              disabled={isPending}
            >
              <X className="size-3.5" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{expense.description}</span>
              <span className="font-semibold text-primary">
                {formatCurrency(Number(expense.amount), currency)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Paid by{" "}
              <span className="font-medium">{expense.paid_by.name}</span>
              {splitLabel && <> &middot; Split: {splitLabel}</>}
            </div>
            {expense.source_text && (
              <p className="mt-0.5 text-xs italic text-muted-foreground/60">
                &ldquo;{expense.source_text}&rdquo;
              </p>
            )}
          </div>
          {!readOnly && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditing(true)}
                disabled={isPending}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
