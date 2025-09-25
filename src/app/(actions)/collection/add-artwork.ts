"use server";

import { parseAddArtworkForm } from "@/app/types/add-artwork";
import { supabaseAdmin } from "../../lib/supabase/server";
import { getUserIdFromCookies } from "@/app/utils/auth";
import sharp from "sharp"; // used to strip EXIF data

export async function addArtwork(formData: FormData) {
  let data;
  try {
    data = parseAddArtworkForm(formData); // validated + typed
  } catch (error) {
    return {
      success: false,
      error: "Invalid add artwork entries.",
      details: error,
    };
  }

  const userId = await getUserIdFromCookies(); // get user id

  if (!userId) {
    return { success: false, error: "Not authenticated." };
  }

  let imageUrl: string | null = null;

  if (data.imageFileMain) {
    try {
      imageUrl = await uploadImageAndGetUrl(data.imageFileMain);
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  const { error: insertError } = await supabaseAdmin.from("artwork").insert([
    {
      user_id: userId,
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
      image_url: imageUrl || "",
    },
  ]);

  if (insertError) {
    return { success: false, error: "Failed to store artwork." };
  }

  return { success: true };
}

// url generator

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImageAndGetUrl(file: File): Promise<string> {
  if (!file) {
    return "";
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "";
  }

  if (file.size > MAX_SIZE) {
    return "";
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const cleanBuffer = await sharp(buffer)
    .toFormat("jpeg", { quality: 90 })
    .toBuffer();

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("public-bucket")
    .upload(fileName, cleanBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return "";
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("public-bucket") // said public-image before
    .getPublicUrl(fileName);

  if (!publicUrlData?.publicUrl) {
    return "";
  }
  return publicUrlData.publicUrl;
}
