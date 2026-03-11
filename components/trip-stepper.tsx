"use client";

import { cn } from "@/lib/utils";
import type { TripStatus } from "@/lib/types";

const STEPS: { status: TripStatus; label: string }[] = [
  { status: "parsing", label: "Paste" },
  { status: "reviewing", label: "Review" },
  { status: "settled", label: "Settle" },
  { status: "coordinating", label: "Track" },
];

const ORDER: Record<TripStatus, number> = {
  parsing: 0,
  reviewing: 1,
  settled: 2,
  coordinating: 3,
};

export function TripStepper({
  currentStatus,
  viewingStatus,
  onStepClick,
}: {
  currentStatus: TripStatus;
  viewingStatus: TripStatus;
  onStepClick: (status: TripStatus) => void;
}) {
  const currentIdx = ORDER[currentStatus];
  const viewingIdx = ORDER[viewingStatus];

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const isViewing = i === viewingIdx;
        const isDone = i < currentIdx;
        const isReachable = i <= currentIdx;

        return (
          <button
            key={step.status}
            type="button"
            disabled={!isReachable}
            onClick={() => onStepClick(step.status)}
            className={cn(
              "flex h-8 w-full flex-1 items-center justify-center rounded-md text-xs font-medium transition-colors",
              isViewing && "bg-primary text-primary-foreground",
              !isViewing && isDone && "bg-primary/20 text-primary hover:bg-primary/30",
              !isViewing && !isDone && i === currentIdx && "bg-muted text-foreground hover:bg-muted/80",
              !isReachable && "bg-muted text-muted-foreground opacity-50",
              isReachable && !isViewing && "cursor-pointer"
            )}
          >
            <span className="mr-1.5 text-[10px]">{i + 1}.</span>
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
