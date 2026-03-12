"use client";

import { CheckCircle2 } from "lucide-react";
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
  isCompleted = false,
}: {
  currentStatus: TripStatus;
  viewingStatus: TripStatus;
  onStepClick: (status: TripStatus) => void;
  isCompleted?: boolean;
}) {
  const currentIdx = ORDER[currentStatus];
  const viewingIdx = ORDER[viewingStatus];

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 p-1">
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
              "flex h-8 w-full flex-1 items-center justify-center rounded-md text-xs font-medium transition-all",
              isViewing && "bg-card text-foreground shadow-sm",
              !isViewing && isDone && "text-foreground/70 hover:text-foreground hover:bg-card/50",
              !isViewing && !isDone && i === currentIdx && "text-foreground/70 hover:text-foreground hover:bg-card/50",
              !isReachable && "text-muted-foreground/40 cursor-default",
              isReachable && "cursor-pointer"
            )}
          >
            {isCompleted && step.status === "coordinating" ? (
              <CheckCircle2 className="mr-1 size-3.5 text-emerald-600" />
            ) : (
              <span className="mr-1.5 text-[10px] opacity-50">{i + 1}.</span>
            )}
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
