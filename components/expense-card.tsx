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
  const [isPending, startTransition] = useTransition();

  const splitNames = expense.splits.map((s) => s.participant.name).join(", ");

  const handleSave = () => {
    startTransition(async () => {
      await updateExpense(expense.id, tripId, {
        description,
        amount: parseFloat(amount),
        paid_by_id: paidById,
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
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              <Check className="size-3.5" />
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
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
              {splitNames && <> &middot; Split: {splitNames}</>}
            </div>
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
