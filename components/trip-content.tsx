"use client";

import { useState } from "react";
import { TripStepper } from "@/components/trip-stepper";
import { ParseExpensesForm } from "@/components/parse-expenses-form";
import { ParseSummary } from "@/components/parse-summary";
import { ExpenseReviewList } from "@/components/expense-review-list";
import { SettlementSummary } from "@/components/settlement-summary";
import { PaymentTracker } from "@/components/payment-tracker";
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
  payments,
  currentBatch,
}: {
  trip: Trip;
  participants: Participant[];
  expenses: ExpenseWithDetails[];
  payments: PaymentWithNames[];
  currentBatch: number;
}) {
  const [viewingStatus, setViewingStatus] = useState(trip.status);

  const readOnly = ORDER[viewingStatus] < ORDER[trip.status];

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
            participants={participants}
            payments={payments}
            currency={trip.currency}
            currentBatch={currentBatch}
            readOnly={readOnly}
          />
        )}
      </div>
    </>
  );
}
