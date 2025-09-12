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
