"use server";

import { supabaseAdmin } from "../../lib/supabase/server";

export async function generateOTP(email: string) {
  const { data: userDetails, error } = await supabaseAdmin // get user id from user table
    .from("users")
    .select("id")
    .eq("email", email)
    .single(); // get user details from email

  if (error || !userDetails) {
    // make sure get was successful
    return { success: false, error: "User not found" };
  }

  const randomEmailVerificationToken = Math.floor(
    100000 + Math.random() * 900000
  ); // generate random 6 digit number

  const { error: insertError } = await supabaseAdmin
    .from("email_verifications")
    .insert([
      // insert a row into the email verification table storing the token that will be used to verify
      {
        user_id: userDetails.id,
        token: randomEmailVerificationToken,
        used: false,
        expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    ]);

  if (insertError) {
    return { success: false, error: "Failed to generate OTP" }; // if error return error
  }

  return { success: true, OTP: randomEmailVerificationToken }; // return OTP
}
