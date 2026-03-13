"use client";

import { useTransition } from "react";
import { ArrowRightIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTripCurrencies } from "@/actions/trips";
import { CURRENCIES } from "@/lib/currencies";

export function CurrencySettings({
  tripId,
  expenseCurrency,
  settlementCurrency,
  readOnly = false,
}: {
  tripId: string;
  expenseCurrency: string;
  settlementCurrency: string;
  readOnly?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleExpenseCurrencyChange = (value: string | null) => {
    if (!value) return;
    startTransition(() =>
      updateTripCurrencies(tripId, value, settlementCurrency)
    );
  };

  const handleSettlementCurrencyChange = (value: string | null) => {
    if (!value) return;
    startTransition(() =>
      updateTripCurrencies(tripId, expenseCurrency, value)
    );
  };

  const needsConversion = expenseCurrency !== settlementCurrency;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Expenses in
          </span>
          {readOnly ? (
            <span className="text-sm font-medium">{expenseCurrency}</span>
          ) : (
            <Select
              defaultValue={expenseCurrency}
              onValueChange={handleExpenseCurrencyChange}
              disabled={isPending}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} – {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <ArrowRightIcon className="size-3.5 text-muted-foreground" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Settle in
          </span>
          {readOnly ? (
            <span className="text-sm font-medium">{settlementCurrency}</span>
          ) : (
            <Select
              defaultValue={settlementCurrency}
              onValueChange={handleSettlementCurrencyChange}
              disabled={isPending}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} – {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {needsConversion && (
          <span className="text-xs text-muted-foreground">
            Rates applied at settlement
          </span>
        )}
      </div>
    </div>
  );
}
