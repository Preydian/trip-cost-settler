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
import { Badge } from "@/components/ui/badge";
import { confirmPayment } from "@/actions/settlements";
import { formatCurrency } from "@/lib/settlement";
import { ShareSummary } from "@/components/share-summary";
import { ArrowRight, Check, Clock } from "lucide-react";
import type { PaymentWithNames } from "@/lib/types";

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
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active payments */}
      {activePayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activePayments.map((payment) => (
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
            {confirmedPayments.map((payment) => (
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
