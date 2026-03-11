"use client";

import { useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { UsersIcon, ReceiptTextIcon, CircleDollarSignIcon, ClockIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteTrip } from "@/actions/trips";
import type { TripSummary } from "@/actions/trips";
import type { TripStatus } from "@/lib/types";

const STAGE_LABELS: Record<TripStatus, string> = {
  parsing: "Paste",
  reviewing: "Review",
  settled: "Settle",
  coordinating: "Track",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function StageDetail({ trip }: { trip: TripSummary }) {
  switch (trip.status) {
    case "parsing":
      return (
        <span className="text-xs text-muted-foreground">
          {trip.participant_count > 0
            ? `${trip.participant_count} people added`
            : "Waiting for expenses"}
        </span>
      );
    case "reviewing":
      return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ReceiptTextIcon className="size-3" />
            {trip.expense_count} expenses
          </span>
          <span className="flex items-center gap-1">
            <CircleDollarSignIcon className="size-3" />
            {formatCurrency(trip.total_amount, trip.currency)}
          </span>
        </div>
      );
    case "settled":
    case "coordinating":
      return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {trip.total_payments > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              {trip.total_payments - trip.pending_payments}/{trip.total_payments} paid
            </span>
          )}
          {trip.outstanding_amount > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <CircleDollarSignIcon className="size-3" />
              {formatCurrency(trip.outstanding_amount, trip.currency)} outstanding
            </span>
          )}
        </div>
      );
  }
}

function TripCard({ trip }: { trip: TripSummary }) {
  const [isPending, startTransition] = useTransition();
  const stageLabel = STAGE_LABELS[trip.status];

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;

    startTransition(() => deleteTrip(trip.id));
  };

  return (
    <Link
      href={`/trip/${trip.id}`}
      className="group flex flex-col justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate font-medium leading-6">{trip.name}</span>
        <Button
          variant="ghost"
          size="sm"
          className="-mr-1.5 -mt-1.5 size-7 shrink-0 p-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>

      <div className="mt-2">
        <Badge className="bg-foreground text-background">{stageLabel}</Badge>
      </div>

      <div className="mt-auto pt-3 flex items-center gap-3">
        {trip.participant_count > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <UsersIcon className="size-3" />
            {trip.participant_count}
          </span>
        )}
        <StageDetail trip={trip} />
      </div>

      <div className="mt-2 border-t pt-2">
        <span className="text-xs text-muted-foreground" suppressHydrationWarning>
          {formatDistanceToNow(new Date(trip.updated_at), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}

export function UserTrips({ trips }: { trips: TripSummary[] }) {
  if (trips.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No trips yet. Create one above to get started!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
