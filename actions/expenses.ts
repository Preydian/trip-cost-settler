"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ExtractedExpense } from "@/lib/types";

export async function saveExtractedExpenses(
  tripId: string,
  rawText: string,
  aiResult: unknown,
  expenses: ExtractedExpense[],
  participantNames: string[],
  currency: string,
  batch: number
) {
  const supabase = await createClient();

  // Save raw input for audit
  await supabase.from("raw_inputs").insert({
    trip_id: tripId,
    raw_text: rawText,
    ai_result: aiResult,
    batch,
  });

  // Update trip currency
  await supabase
    .from("trips")
    .update({ currency, updated_at: new Date().toISOString() })
    .eq("id", tripId);

  // Upsert participants (on conflict do nothing)
  const participantRows = participantNames.map((name) => ({
    trip_id: tripId,
    name,
  }));

  await supabase
    .from("participants")
    .upsert(participantRows, { onConflict: "trip_id,name" });

  // Fetch participant id map
  const { data: participants } = await supabase
    .from("participants")
    .select("id, name")
    .eq("trip_id", tripId);

  if (!participants) throw new Error("Failed to load participants");

  const nameToId = new Map(participants.map((p) => [p.name, p.id]));

  // Insert expenses and splits
  for (const exp of expenses) {
    const payerId = nameToId.get(exp.paid_by);
    if (!payerId) continue;

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        trip_id: tripId,
        paid_by_id: payerId,
        description: exp.description,
        amount: exp.amount,
        split_mode: exp.split_among ? "custom" : "equal",
        batch,
      })
      .select("id")
      .single();

    if (error || !expense) continue;

    // Determine who splits this expense
    const splitParticipantIds = exp.split_among
      ? exp.split_among.map((name) => nameToId.get(name)).filter(Boolean) as string[]
      : participants.map((p) => p.id);

    if (splitParticipantIds.length === 0) continue;

    const splitAmount =
      Math.round((exp.amount / splitParticipantIds.length) * 100) / 100;

    // Handle rounding remainder
    const totalSplit = splitAmount * splitParticipantIds.length;
    const remainder = Math.round((exp.amount - totalSplit) * 100) / 100;

    const splitRows = splitParticipantIds.map((pid, i) => ({
      expense_id: expense.id,
      participant_id: pid,
      amount: i === 0 ? splitAmount + remainder : splitAmount,
    }));

    await supabase.from("expense_splits").insert(splitRows);
  }

  // Update trip status
  await supabase
    .from("trips")
    .update({ status: "reviewing", updated_at: new Date().toISOString() })
    .eq("id", tripId);

  revalidatePath(`/trip/${tripId}`);
}

export async function updateExpense(
  expenseId: string,
  tripId: string,
  data: {
    description: string;
    amount: number;
    paid_by_id: string;
    split_among_ids: string[];
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("expenses")
    .update({
      description: data.description,
      amount: data.amount,
      paid_by_id: data.paid_by_id,
    })
    .eq("id", expenseId);

  if (error) throw new Error(error.message);

  // Delete existing splits and recreate with new participants
  await supabase
    .from("expense_splits")
    .delete()
    .eq("expense_id", expenseId);

  const splitParticipantIds = data.split_among_ids;
  if (splitParticipantIds.length > 0) {
    const splitAmount =
      Math.round((data.amount / splitParticipantIds.length) * 100) / 100;
    const totalSplit = splitAmount * splitParticipantIds.length;
    const remainder = Math.round((data.amount - totalSplit) * 100) / 100;

    const splitRows = splitParticipantIds.map((pid, i) => ({
      expense_id: expenseId,
      participant_id: pid,
      amount: i === 0 ? splitAmount + remainder : splitAmount,
    }));

    await supabase.from("expense_splits").insert(splitRows);
  }

  revalidatePath(`/trip/${tripId}`);
}

export async function deleteExpense(expenseId: string, tripId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${tripId}`);
}

export async function addManualExpense(
  tripId: string,
  paidById: string,
  description: string,
  amount: number,
  splitAmongIds: string[],
  batch: number
) {
  const supabase = await createClient();

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      trip_id: tripId,
      paid_by_id: paidById,
      description,
      amount,
      split_mode: "equal",
      batch,
    })
    .select("id")
    .single();

  if (error || !expense) throw new Error(error?.message ?? "Failed to create expense");

  const splitAmount =
    Math.round((amount / splitAmongIds.length) * 100) / 100;
  const totalSplit = splitAmount * splitAmongIds.length;
  const remainder = Math.round((amount - totalSplit) * 100) / 100;

  const splitRows = splitAmongIds.map((pid, i) => ({
    expense_id: expense.id,
    participant_id: pid,
    amount: i === 0 ? splitAmount + remainder : splitAmount,
  }));

  await supabase.from("expense_splits").insert(splitRows);

  revalidatePath(`/trip/${tripId}`);
}
