"use server";

import { parseAddArtworkForm } from "@/app/types/add-artwork";
import { uploadImageAndGetUrl } from "./add-artwork";
import { supabaseAdmin } from "@/app/lib/supabase/server";

export async function updateArtwork(
  formData: FormData,
  selectedArtworkId?: string,
  imageChanged: boolean = false
) {
  if (!formData) return { success: false, error: "No data provided." };

  let data;

  try {
    data = parseAddArtworkForm(formData);
  } catch (err) {
    return {
      success: false,
      error: "Invalid add artwork entries.",
      details: err,
    };
  }

  if (!selectedArtworkId)
    // if no artwork return
    return {
      success: false,
      error: "No Artwork ID to update artwork.",
    };

  let imageUrl: string | undefined; // dont change if image wasnt changed
  if (imageChanged && data.imageFileMain) {
    try {
      imageUrl = await uploadImageAndGetUrl(data.imageFileMain);
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  const payload: Record<string, any> = {
    // get payload ready to update values
    title: data.title || "",
    artist_name: data.artistName || "",
    medium: data.medium || "",
    width_cm: data.widthCm || 0,
    height_cm: data.heightCm || 0,
    depth_cm: data.depthCm || 0,
    date_acquired: data.dateAcquired || "",
    location_acquired: data.locationAcquired || "",
    storage_location: data.storageLocation || "",
    storage_company: data.storageCompany || "",
    notes: data.notes || "",
  };

  if (typeof imageUrl === "string") {
    payload.image_url = imageUrl;
  }

  const { error: updateError } = await supabaseAdmin
    .from("artwork")
    .update(payload)
    .eq("artwork_id", selectedArtworkId);

  if (updateError) {
    return {
      success: false,
      error: "Failed to update artwork.",
      details: updateError.message,
    };
  }

  return { success: true };
}
