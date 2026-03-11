"use client";

import { useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { moveToCoordinating } from "@/actions/settlements";
import { updateTripStatus } from "@/actions/trips";
import { formatCurrency } from "@/lib/settlement";
import { ArrowRight } from "lucide-react";
import type {
  ExpenseWithDetails,
  Participant,
  PaymentWithNames,
} from "@/lib/types";

export function SettlementSummary({
  tripId,
  expenses,
  participants,
  payments,
  currency,
  readOnly = false,
}: {
  tripId: string;
  expenses: ExpenseWithDetails[];
  participants: Participant[];
  payments: PaymentWithNames[];
  currency: string;
  readOnly?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  // Compute per-person summary
  const summary = participants.map((p) => {
    const paid = expenses
      .filter((e) => e.paid_by_id === p.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const owes = expenses.reduce((sum, e) => {
      const split = e.splits.find((s) => s.participant_id === p.id);
      return sum + (split ? Number(split.amount) : 0);
    }, 0);
    return { participant: p, paid, owes, net: paid - owes };
  });

  const handleConfirm = () => {
    startTransition(() => moveToCoordinating(tripId));
  };

  const handleBack = () => {
    startTransition(() => updateTripStatus(tripId, "reviewing"));
  };

  const activePayments = payments.filter((p) => p.status !== "cancelled");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Balance Summary</CardTitle>
          <CardDescription>
            How much each person paid vs. what they owe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summary.map(({ participant, paid, owes, net }) => (
              <div
                key={participant.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{participant.name}</span>
                <div className="flex gap-4 text-xs">
                  <span className="text-muted-foreground">
                    Paid {formatCurrency(paid, currency)}
                  </span>
                  <span className="text-muted-foreground">
                    Owes {formatCurrency(owes, currency)}
                  </span>
                  <span
                    className={
                      net > 0
                        ? "font-medium text-green-500"
                        : net < 0
                          ? "font-medium text-red-400"
                          : "text-muted-foreground"
                    }
                  >
                    {net > 0 ? "+" : ""}
                    {formatCurrency(net, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Settlement Plan</CardTitle>
          <CardDescription>
            {activePayments.length === 0
              ? "Everyone is already square!"
              : `${activePayments.length} payment${activePayments.length === 1 ? "" : "s"} to settle up`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments needed.
            </p>
          ) : (
            <div className="space-y-3">
              {activePayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm"
                >
                  <span className="font-medium">{payment.from.name}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="font-medium">{payment.to.name}</span>
                  <span className="ml-auto font-semibold text-primary">
                    {formatCurrency(Number(payment.amount), currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={handleBack} disabled={isPending}>
            Back to Review
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? "..." : "Confirm & Start Tracking"}
          </Button>
        </div>
      )}
    </div>
  );
}
