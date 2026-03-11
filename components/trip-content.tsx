"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TripStepper } from "@/components/trip-stepper";
import { ParseExpensesForm } from "@/components/parse-expenses-form";
import { ParseSummary } from "@/components/parse-summary";
import { ExpenseReviewList } from "@/components/expense-review-list";
import { SettlementSummary } from "@/components/settlement-summary";
import { PaymentTracker } from "@/components/payment-tracker";
import { AddLateExpenses } from "@/components/add-late-expenses";
import type {
  Trip,
  Participant,
  ExpenseWithDetails,
  PaymentWithNames,
} from "@/lib/types";

const ORDER: Record<string, number> = {
  parsing: 0,
  reviewing: 1,
  settled: 2,
  coordinating: 3,
};

export function TripContent({
  trip,
  participants,
  expenses,
  rawTexts,
  payments,
  currentBatch,
  isOwner = false,
}: {
  trip: Trip;
  participants: Participant[];
  expenses: ExpenseWithDetails[];
  rawTexts: string[];
  payments: PaymentWithNames[];
  currentBatch: number;
  isOwner?: boolean;
}) {
  const [viewingStatus, setViewingStatus] = useState(trip.status);
  const [showLateExpenses, setShowLateExpenses] = useState(false);

  const readOnly = !isOwner || ORDER[viewingStatus] < ORDER[trip.status];
  const pastParsing = ORDER[trip.status] > 0;

  return (
    <>
      <TripStepper
        currentStatus={trip.status}
        viewingStatus={viewingStatus}
        onStepClick={setViewingStatus}
      />

      <div className="mt-6">
        {viewingStatus === "parsing" && (
          readOnly ? (
            <ParseSummary
              expenses={expenses}
              participants={participants}
              currency={trip.currency}
              rawTexts={rawTexts}
            />
          ) : (
            <ParseExpensesForm tripId={trip.id} batch={currentBatch} />
          )
        )}

        {viewingStatus === "reviewing" && (
          <ExpenseReviewList
            tripId={trip.id}
            expenses={expenses}
            participants={participants}
            currency={trip.currency}
            readOnly={readOnly}
          />
        )}

        {viewingStatus === "settled" && (
          <SettlementSummary
            tripId={trip.id}
            expenses={expenses}
            participants={participants}
            payments={payments}
            currency={trip.currency}
            readOnly={readOnly}
          />
        )}

        {viewingStatus === "coordinating" && (
          <PaymentTracker
            tripId={trip.id}
            payments={payments}
            currency={trip.currency}
            readOnly={readOnly}
          />
        )}

        {pastParsing && isOwner && (
          <>
            <Separator className="my-6" />

            {showLateExpenses ? (
              <div className="space-y-3">
                <AddLateExpenses
                  tripId={trip.id}
                  participants={participants}
                  batch={currentBatch}
                  currentStatus={trip.status}
                  onDone={() => setShowLateExpenses(false)}
                />
                <Button
                  variant="ghost"
                  onClick={() => setShowLateExpenses(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowLateExpenses(true)}
                className="w-full"
              >
                <PlusIcon className="size-4" />
                Add Late Expense
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
}
