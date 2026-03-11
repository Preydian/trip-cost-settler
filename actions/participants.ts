"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addParticipant(tripId: string, name: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("participants")
    .insert({ trip_id: tripId, name });

  if (error) {
    if (error.code === "23505") throw new Error("Participant already exists");
    throw new Error(error.message);
  }

  revalidatePath(`/trip/${tripId}`);
}

export async function renameParticipant(
  participantId: string,
  tripId: string,
  newName: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("participants")
    .update({ name: newName })
    .eq("id", participantId);

  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${tripId}`);
}

export async function removeParticipant(participantId: string, tripId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("id", participantId);

  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${tripId}`);
}
