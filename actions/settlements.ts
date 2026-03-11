"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeBalances, computeSettlement } from "@/lib/settlement";

export async function createSettlement(tripId: string) {
  const supabase = await createClient();

  // Get the latest settlement batch number
  const { data: existingSettlements } = await supabase
    .from("settlements")
    .select("batch")
    .eq("trip_id", tripId)
    .order("batch", { ascending: false })
    .limit(1);

  const lastBatch = existingSettlements?.[0]?.batch ?? 0;
  const newBatch = lastBatch + 1;

  // Get all confirmed payments from previous settlements
  const confirmedPayments: { from_id: string; to_id: string; amount: number }[] = [];

  if (lastBatch > 0) {
    // Cancel all pending payments from previous settlement
    const { data: prevSettlements } = await supabase
      .from("settlements")
      .select("id")
      .eq("trip_id", tripId);

    if (prevSettlements) {
      for (const s of prevSettlements) {
        await supabase
          .from("payments")
          .update({ status: "cancelled" })
          .eq("settlement_id", s.id)
          .eq("status", "pending");
      }
    }

    // Gather confirmed payments
    const { data: allPayments } = await supabase
      .from("payments")
      .select("from_id, to_id, amount, status, settlements!inner(trip_id)")
      .eq("settlements.trip_id", tripId)
      .eq("status", "confirmed");

    if (allPayments) {
      for (const p of allPayments) {
        confirmedPayments.push({
          from_id: p.from_id,
          to_id: p.to_id,
          amount: p.amount,
        });
      }
    }
  }

  // Get all expenses and splits
  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, paid_by_id, amount")
    .eq("trip_id", tripId);

  const { data: splits } = await supabase
    .from("expense_splits")
    .select("id, expense_id, participant_id, amount, expenses!inner(trip_id)")
    .eq("expenses.trip_id", tripId);

  if (!expenses || !splits) throw new Error("Failed to load expense data");

  const balances = computeBalances(
    expenses,
    splits.map((s) => ({
      id: s.id,
      expense_id: s.expense_id,
      participant_id: s.participant_id,
      amount: s.amount,
    }))
  );

  const paymentPlan = computeSettlement(balances, confirmedPayments);

  // Create settlement record
  const { data: settlement, error: settlementError } = await supabase
    .from("settlements")
    .insert({ trip_id: tripId, batch: newBatch })
    .select("id")
    .single();

  if (settlementError || !settlement)
    throw new Error(settlementError?.message ?? "Failed to create settlement");

  // Insert payment instructions
  if (paymentPlan.length > 0) {
    const paymentRows = paymentPlan.map((p) => ({
      settlement_id: settlement.id,
      from_id: p.fromId,
      to_id: p.toId,
      amount: p.amount,
    }));

    await supabase.from("payments").insert(paymentRows);
  }

  // Update trip status
  await supabase
    .from("trips")
    .update({ status: "settled", updated_at: new Date().toISOString() })
    .eq("id", tripId);

  revalidatePath(`/trip/${tripId}`);
}

export async function confirmPayment(paymentId: string, tripId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("payments")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${tripId}`);
}

export async function moveToCoordinating(tripId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("trips")
    .update({ status: "coordinating", updated_at: new Date().toISOString() })
    .eq("id", tripId);

  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${tripId}`);
}
