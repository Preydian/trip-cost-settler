"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TripStatus } from "@/lib/types";

export async function createTrip(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("trips")
    .insert({ name, user_id: user?.id ?? null })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  redirect(`/trip/${data.id}`);
}

export async function deleteTrip(tripId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
}

export async function updateTripCurrencies(
  tripId: string,
  expenseCurrency: string,
  settlementCurrency: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("trips")
    .update({
      currency: expenseCurrency,
      settlement_currency: settlementCurrency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tripId);

  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${tripId}`);
}

export async function updateTripStatus(tripId: string, status: TripStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("trips")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", tripId);

  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${tripId}`);
}

export async function getUserTrips() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data;
}

export interface TripSummary {
  id: string;
  name: string;
  currency: string;
  status: TripStatus;
  created_at: string;
  updated_at: string;
  participant_count: number;
  expense_count: number;
  total_amount: number;
  pending_payments: number;
  total_payments: number;
  outstanding_amount: number;
}

export async function getUserTripsWithSummary(): Promise<TripSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!trips || trips.length === 0) return [];

  const tripIds = trips.map((t) => t.id);

  const [participants, expenses, payments] = await Promise.all([
    supabase
      .from("participants")
      .select("trip_id")
      .in("trip_id", tripIds),
    supabase
      .from("expenses")
      .select("trip_id, amount")
      .in("trip_id", tripIds),
    supabase
      .from("payments")
      .select("settlement_id, status, amount, settlements!inner(trip_id)")
      .in("settlements.trip_id", tripIds),
  ]);

  const participantCounts = new Map<string, number>();
  for (const p of participants.data ?? []) {
    participantCounts.set(p.trip_id, (participantCounts.get(p.trip_id) ?? 0) + 1);
  }

  const expenseStats = new Map<string, { count: number; total: number }>();
  for (const e of expenses.data ?? []) {
    const prev = expenseStats.get(e.trip_id) ?? { count: 0, total: 0 };
    expenseStats.set(e.trip_id, { count: prev.count + 1, total: prev.total + e.amount });
  }

  const paymentStats = new Map<string, { pending: number; total: number; outstanding: number }>();
  for (const p of payments.data ?? []) {
    const tripId = (p.settlements as unknown as { trip_id: string }).trip_id;
    const prev = paymentStats.get(tripId) ?? { pending: 0, total: 0, outstanding: 0 };
    const isPending = p.status === "pending";
    paymentStats.set(tripId, {
      pending: prev.pending + (isPending ? 1 : 0),
      total: prev.total + 1,
      outstanding: prev.outstanding + (isPending ? Number(p.amount) : 0),
    });
  }

  return trips.map((trip) => ({
    id: trip.id,
    name: trip.name,
    currency: trip.currency,
    status: trip.status as TripStatus,
    created_at: trip.created_at,
    updated_at: trip.updated_at,
    participant_count: participantCounts.get(trip.id) ?? 0,
    expense_count: expenseStats.get(trip.id)?.count ?? 0,
    total_amount: expenseStats.get(trip.id)?.total ?? 0,
    pending_payments: paymentStats.get(trip.id)?.pending ?? 0,
    total_payments: paymentStats.get(trip.id)?.total ?? 0,
    outstanding_amount: paymentStats.get(trip.id)?.outstanding ?? 0,
  }));
}
