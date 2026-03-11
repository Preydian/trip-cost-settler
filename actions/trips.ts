"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TripStatus } from "@/lib/types";

export async function createTrip(name: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trips")
    .insert({ name })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  redirect(`/trip/${data.id}`);
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
