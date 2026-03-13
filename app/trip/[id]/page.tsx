import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TripContent } from "@/components/trip-content";
import { ShareTripButton } from "@/components/share-trip-button";
import type {
  Trip,
  Participant,
  ExpenseWithDetails,
  PaymentWithNames,
  Settlement,
  RawInput,
  CurrencyConversionData,
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
    // Get all settlement IDs for this trip
    const { data: allSettlements } = await supabase
      .from("settlements")
      .select("id")
      .eq("trip_id", tripId);

    const allSettlementIds = (allSettlements ?? []).map((s) => s.id);

    if (allSettlementIds.length > 0) {
      // Fetch current batch payments (pending + confirmed) and confirmed from older batches
      const { data: allPayments } = await supabase
        .from("payments")
        .select("*, from:participants!from_id(*), to:participants!to_id(*), settlement:settlements!settlement_id(batch, created_at)")
        .in("settlement_id", allSettlementIds)
        .in("status", ["pending", "confirmed"])
        .order("amount", { ascending: false });

      payments = (allPayments ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        settlement_batch: (p.settlement as { batch: number; created_at: string }).batch,
        settlement_date: (p.settlement as { batch: number; created_at: string }).created_at,
      })) as PaymentWithNames[];
    }
  }

  const latestSettlement = (settlements?.[0] ?? null) as Settlement | null;

  return {
    trip: trip as Trip,
    participants: (participants ?? []) as Participant[],
    expenses: (expenses ?? []) as ExpenseWithDetails[],
    rawInputs: (rawInputs ?? []) as RawInput[],
    latestSettlement,
    currencyConversion: (latestSettlement?.currency_conversion ?? null) as CurrencyConversionData | null,
    payments,
  };
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const data = await loadTripData(id);

  if (!data) notFound();

  const { trip, participants, expenses, rawInputs, latestSettlement, currencyConversion, payments } = data;
  const currentBatch = latestSettlement ? latestSettlement.batch + 1 : 1;
  const isOwner = !!user && trip.user_id === user.id;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Dashboard
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{trip.name}</h1>
          {isOwner && <ShareTripButton tripId={trip.id} />}
        </div>
      </div>

      <TripContent
        trip={trip}
        participants={participants}
        expenses={expenses}
        rawTexts={rawInputs.map((r) => r.raw_text)}
        payments={payments}
        currentBatch={currentBatch}
        isOwner={isOwner}
        currencyConversion={currencyConversion}
      />
    </div>
  );
}
