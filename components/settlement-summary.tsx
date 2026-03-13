"use client";

import { useMemo, useTransition } from "react";
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

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function groupByBatch(payments: PaymentWithNames[]): PaymentWithNames[][] {
  if (payments.length === 0) return [];

  const sorted = [...payments].sort(
    (a, b) => b.settlement_batch - a.settlement_batch
  );

  const groups: PaymentWithNames[][] = [];
  let currentBatch = sorted[0].settlement_batch;
  let currentGroup: PaymentWithNames[] = [];

  for (const payment of sorted) {
    if (payment.settlement_batch !== currentBatch) {
      groups.push(currentGroup);
      currentGroup = [];
      currentBatch = payment.settlement_batch;
    }
    currentGroup.push(payment);
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

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
  const paymentGroups = useMemo(() => groupByBatch(activePayments), [activePayments]);
  const hasMultipleBatches = paymentGroups.length > 1;
  const hasConfirmedPayments = activePayments.some((p) => p.status === "confirmed");
  const wasRecalculated = hasMultipleBatches && hasConfirmedPayments;

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

          {wasRecalculated && (
            <p className="mt-3 text-xs text-muted-foreground">
              Net balances reflect the true amount each person owes or is owed. The settlement plan below accounts for payments already completed and shows only the remaining steps needed to square up, so individual payment amounts may differ.
            </p>
          )}
        </CardContent>
      </Card>

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
            <div className="space-y-2">
              {paymentGroups.map((group, groupIdx) => (
                <div key={group[0].settlement_batch}>
                  {groupIdx > 0 && hasMultipleBatches && (
                    <div className="relative my-3">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[10px] text-muted-foreground">
                        Recalculated {formatShortDate(paymentGroups[groupIdx - 1][0].settlement_date)}
                      </span>
                    </div>
                  )}
                  {group.map((payment) => (
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
