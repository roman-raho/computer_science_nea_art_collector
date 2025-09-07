"use server";

import { supabaseAdmin } from "../../lib/supabase/server";

export async function validateEmail(token: string) {
  const {
    data: emailVerificationData,
    error: emailVerificationDataError,
  } = // get the data from the email_verification table to perform checks on
    await supabaseAdmin
      .from("email_verifications")
      .select("expires_at, used")
      .eq("token", token)
      .single();

  if (!emailVerificationData) {
    return { ok: false, reason: "No associated token." };
  }

  if (emailVerificationDataError) {
    return { ok: false, reason: "Failed to fetch tokens from database." };
  }

  if (emailVerificationData.used) {
    return { ok: false, reason: "Token has been used already." };
  }

  if (new Date(emailVerificationData.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "Token has expired" };
  }

  const { data } = await supabaseAdmin // update token to show that it has been used so it cannot be reused
    .from("email_verifications")
    .update({ used: true })
    .eq("token", token)
    .select("user_id")
    .single();

  if (!data) {
    return { ok: false, reason: "Failed to update token" };
  }

  await supabaseAdmin // set email verified to true for the user
    .from("users")
    .update({ email_verified: true })
    .eq("id", data.user_id);

  return { ok: true };
}
