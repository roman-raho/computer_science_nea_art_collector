"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/app/lib/supabase/server";
import { refreshAccessToken } from "@/app/utils/refresh-token";

const enc = new TextEncoder();

export async function checkSignedIn() {
  const cookieData = await cookies();

  const accessToken = cookieData.get("access")?.value;
  if (!accessToken) return null;

  try {
    const { payload } = await jwtVerify(
      // get userId from payload
      accessToken,
      enc.encode(process.env.JWT_SECRET!)
    );
    return { userId: payload.userId as string };
  } catch {
    return null; // expired/tampered/invalid
  }
}

export async function toggle2fa(twofaOn: boolean) {
  console.log("toggle2fa called with:", twofaOn);

  const cookieData = await cookies(); // get cookies
  console.log("cookieData:", cookieData);

  refreshAccessToken();
  const accessToken = cookieData.get("access")?.value; // get access cookie
  console.log("accessToken:", accessToken);

  if (!accessToken) {
    console.log("No access token found");
    return { success: false, error: "Not logged in" }; // if no access token return false
  }

  try {
    const { payload } = await jwtVerify(
      // get payload
      accessToken,
      enc.encode(process.env.JWT_SECRET!)
    );
    console.log("JWT payload:", payload);

    const userId = payload.userId as string; // get user id
    console.log("userId:", userId);

    if (twofaOn) {
      console.log("Enabling 2FA for user:", userId);
      await supabaseAdmin
        .from("users")
        .update({ twofa_enabled: true })
        .eq("id", userId);
    } else {
      console.log("Disabling 2FA for user:", userId);
      await supabaseAdmin
        .from("users")
        .update({ twofa_enabled: false })
        .eq("id", userId);
    }

    console.log("2FA update successful");
    return { success: true };
  } catch (err) {
    console.log("Error in toggle2fa:", err);
    return { success: false, error: "Error updating 2fa preferences." };
  }
}

export async function check2faStatus() {
  try {
    refreshAccessToken();
    const cookieData = await cookies(); // get curretn cookies
    const accessToken = cookieData.get("access")?.value; // get value

    if (!accessToken) {
      // if there is no access token then return false
      return { success: false, error: "Not logged in" };
    }

    const { payload } = await jwtVerify(
      // get the user id
      accessToken,
      enc.encode(process.env.JWT_SECRET!)
    );

    const userId = payload.userId as string | undefined; // destructure user id
    if (!userId) {
      return { success: false, error: "Invalid token" }; // if no user id return false
    }

    const { data: userData, error: userDataError } = await supabaseAdmin // get data to see if enabled from users
      .from("users")
      .select("twofa_enabled")
      .eq("id", userId)
      .single();

    if (userDataError || !userData) {
      // if no users return false
      return { success: false, error: "User not found" };
    }

    return { success: true }; // if true return true
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error checking 2FA status" }; // return error
  }
}
