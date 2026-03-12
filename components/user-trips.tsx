"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { UsersIcon, ReceiptTextIcon, CircleDollarSignIcon, ClockIcon, Trash2Icon, LinkIcon, CheckIcon, CircleCheckIcon } from "lucide-react";
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
    case "coordinating": {
      const allDone =
        trip.status === "coordinating" &&
        trip.total_payments > 0 &&
        trip.pending_payments === 0;
      return (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {allDone ? (
            <span className="flex items-center gap-1 text-emerald-600">
              All settled
            </span>
          ) : (
            <>
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
            </>
          )}
        </div>
      );
    }
  }
}

function TripCard({ trip }: { trip: TripSummary }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const stageLabel = STAGE_LABELS[trip.status];
  const isCompleted =
    trip.status === "coordinating" &&
    trip.total_payments > 0 &&
    trip.pending_payments === 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;

    startTransition(() => deleteTrip(trip.id));
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/trip/${trip.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link
      href={`/trip/${trip.id}`}
      className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 shadow-card transition-all hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate font-medium leading-6">{trip.name}</span>
        <div className="-mr-1.5 -mt-1.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            className="size-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleShare}
          >
            {copied ? <CheckIcon className="size-3.5" /> : <LinkIcon className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="size-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-2">
        {isCompleted ? (
          <Badge className="bg-emerald-500/15 text-emerald-600">
            <CircleCheckIcon className="size-3" />
            Completed
          </Badge>
        ) : (
          <Badge className="bg-foreground/90 text-background">{stageLabel}</Badge>
        )}
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

      <div className="mt-3 border-t border-border/40 pt-2">
        <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
          Updated {formatDistanceToNow(new Date(trip.updated_at), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}

export function UserTrips({ trips }: { trips: TripSummary[] }) {
  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
        <p className="text-sm text-muted-foreground">
          No trips yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
