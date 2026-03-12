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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { confirmPayment } from "@/actions/settlements";
import { formatCurrency } from "@/lib/settlement";
import { ShareSummary } from "@/components/share-summary";
import { ArrowRight, Check, CheckCircle2, Clock } from "lucide-react";
import type { PaymentWithNames } from "@/lib/types";

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function groupByBatch(payments: PaymentWithNames[]): PaymentWithNames[][] {
  if (payments.length === 0) return [];

  // Sort by batch ascending so older batches come first
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

export function PaymentTracker({
  tripId,
  payments,
  currency,
  readOnly = false,
}: {
  tripId: string;
  payments: PaymentWithNames[];
  currency: string;
  readOnly?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const activePayments = payments.filter((p) => p.status === "pending");
  const confirmedPayments = payments.filter((p) => p.status === "confirmed");
  const totalPayments = activePayments.length + confirmedPayments.length;
  const progress =
    totalPayments > 0
      ? Math.round((confirmedPayments.length / totalPayments) * 100)
      : 100;

  const pendingGroups = useMemo(() => groupByBatch(activePayments), [activePayments]);
  const confirmedGroups = useMemo(() => groupByBatch(confirmedPayments), [confirmedPayments]);
  const hasMultiplePendingBatches = pendingGroups.length > 1;
  const hasMultipleConfirmedBatches = confirmedGroups.length > 1;

  const handleConfirm = (paymentId: string) => {
    startTransition(() => confirmPayment(paymentId, tripId));
  };

  const allDone = activePayments.length === 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Progress</CardTitle>
          <CardDescription>
            {allDone
              ? "All payments confirmed! Everyone is square."
              : `${confirmedPayments.length} of ${totalPayments} payments confirmed`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allDone ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="size-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-emerald-600">
                Trip complete
              </p>
            </div>
          ) : (
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active payments */}
      {activePayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingGroups.map((group, groupIdx) => (
              <div key={group[0].settlement_batch}>
                {groupIdx > 0 && hasMultiplePendingBatches && (
                  <div className="relative my-3">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[10px] text-muted-foreground">
                      Recalculated {formatShortDate(pendingGroups[groupIdx - 1][0].settlement_date)}
                    </span>
                  </div>
                )}
                {group.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm"
                  >
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="font-medium">{payment.from.name}</span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <span className="font-medium">{payment.to.name}</span>
                    <span className="ml-auto font-semibold">
                      {formatCurrency(Number(payment.amount), currency)}
                    </span>
                    {!readOnly && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(payment.id)}
                        disabled={isPending}
                      >
                        <Check className="size-3.5" />
                        Received
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Confirmed payments */}
      {confirmedPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirmed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {confirmedGroups.map((group, groupIdx) => (
              <div key={group[0].settlement_batch}>
                {groupIdx > 0 && hasMultipleConfirmedBatches && (
                  <div className="relative my-3">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-[10px] text-muted-foreground">
                      Expense added {formatShortDate(confirmedGroups[groupIdx - 1][0].settlement_date)}
                    </span>
                  </div>
                )}
                {group.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center gap-2 rounded-lg p-3 text-sm opacity-60"
                  >
                    <Check className="size-4 text-green-500" />
                    <span>{payment.from.name}</span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <span>{payment.to.name}</span>
                    <span className="ml-auto">
                      {formatCurrency(Number(payment.amount), currency)}
                    </span>
                    <Badge variant="secondary">Done</Badge>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!readOnly && (
        <ShareSummary
          payments={payments}
          currency={currency}
          allDone={allDone}
        />
      )}
    </div>
  );
}
