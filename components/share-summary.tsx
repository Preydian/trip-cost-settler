"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/settlement";
import { Copy, Check } from "lucide-react";
import type { PaymentWithNames } from "@/lib/types";

export function ShareSummary({
  payments,
  currency,
  allDone,
}: {
  payments: PaymentWithNames[];
  currency: string;
  allDone: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const activePayments = payments.filter(
    (p) => p.status === "pending" || p.status === "confirmed"
  );

  const lines = activePayments.map((p) => {
    const status = p.status === "confirmed" ? " [DONE]" : "";
    return `${p.from.name} -> ${p.to.name}: ${formatCurrency(Number(p.amount), currency)}${status}`;
  });

  const text = allDone
    ? "All settled! Everyone is square."
    : `Settlement plan:\n${lines.join("\n")}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" onClick={handleCopy} className="flex-1">
      {copied ? (
        <>
          <Check className="size-3.5" /> Copied!
        </>
      ) : (
        <>
          <Copy className="size-3.5" /> Copy Summary
        </>
      )}
    </Button>
  );
}
