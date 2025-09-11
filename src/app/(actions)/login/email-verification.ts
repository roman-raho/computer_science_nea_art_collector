"use server";

import { supabaseAdmin } from "../../lib/supabase/server";

export async function validateOTP(OTP: number, email: string) {
  const {
    data: emailVerificationData,
    error: emailVerificationDataError,
  } = // get the token data from the database
    await supabaseAdmin
      .from("email_verifications")
      .select("expires_at, used, user_id")
      .eq("token", OTP)
      .single();

  const { data: userData, error: userDataError } = await supabaseAdmin // get the user id
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (emailVerificationDataError || userDataError)
    // if no user data return error
    return { success: false, error: "Error fetching codes." };

  if (!emailVerificationData)
    // if no token return incorrect code
    return { success: false, error: "Code is incorrect." };

  if (!userData) return { success: false, error: "Error creating user." }; // if no user data user wasnt created

  if (emailVerificationData.user_id !== userData.id)
    return { success: false, error: "Code incorrect." };

  if (
    emailVerificationData.used ||
    new Date(emailVerificationData.expires_at).getTime() < Date.now()
  )
    return { success: false, error: "Code has expired." };

  await supabaseAdmin
    .from("email_verifications")
    .update({ used: true })
    .eq("token", OTP);

  await supabaseAdmin
    .from("users")
    .update({ email_verified: true, twofa_enabled: true })
    .eq("id", userData.id);

  return { success: true };
}

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
