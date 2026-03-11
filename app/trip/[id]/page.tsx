import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TripContent } from "@/components/trip-content";
import type {
  Trip,
  Participant,
  ExpenseWithDetails,
  PaymentWithNames,
  Settlement,
  RawInput,
} from "@/lib/types";

async function loadTripData(tripId: string) {
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (!trip) return null;

  const { data: participants } = await supabase
    .from("participants")
    .select("*")
    .eq("trip_id", tripId)
    .order("name");

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, paid_by:participants!paid_by_id(*), splits:expense_splits(*, participant:participants!participant_id(*))")
    .eq("trip_id", tripId)
    .order("created_at");

  const { data: settlements } = await supabase
    .from("settlements")
    .select("*")
    .eq("trip_id", tripId)
    .order("batch", { ascending: false })
    .limit(1);

  const { data: rawInputs } = await supabase
    .from("raw_inputs")
    .select("*")
    .eq("trip_id", tripId)
    .order("batch");

  let payments: PaymentWithNames[] = [];

  if (settlements && settlements.length > 0) {
    const { data: latestPayments } = await supabase
      .from("payments")
      .select("*, from:participants!from_id(*), to:participants!to_id(*)")
      .eq("settlement_id", settlements[0].id)
      .order("amount", { ascending: false });

    payments = (latestPayments ?? []) as PaymentWithNames[];
  }

  return {
    trip: trip as Trip,
    participants: (participants ?? []) as Participant[],
    expenses: (expenses ?? []) as ExpenseWithDetails[],
    rawInputs: (rawInputs ?? []) as RawInput[],
    latestSettlement: (settlements?.[0] ?? null) as Settlement | null,
    payments,
  };
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadTripData(id);

  if (!data) notFound();

  const { trip, participants, expenses, rawInputs, latestSettlement, payments } = data;
  const currentBatch = latestSettlement ? latestSettlement.batch + 1 : 1;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{trip.name}</h1>
      </div>

      <TripContent
        trip={trip}
        participants={participants}
        expenses={expenses}
        rawTexts={rawInputs.map((r) => r.raw_text)}
        payments={payments}
        currentBatch={currentBatch}
      />
    </div>
  );
}
