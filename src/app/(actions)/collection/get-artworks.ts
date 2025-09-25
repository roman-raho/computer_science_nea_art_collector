"use server";

import { supabaseAdmin } from "@/app/lib/supabase/server";
import { getUserIdFromCookies } from "@/app/utils/auth";

export async function getArtworks() {
  const userId = await getUserIdFromCookies();
  if (!userId) {
    return { success: false, error: "No user id.", artworks: [] };
  }

  const { data: artworkData, error } = await supabaseAdmin
    .from("artwork")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: "Error fetching artworks.", artworks: [] };
  }

  return { success: true, artworks: artworkData || [], error: null };
}
