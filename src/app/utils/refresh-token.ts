"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { supabaseAdmin } from "../lib/supabase/server";
import jwt from "jsonwebtoken";

const enc = new TextEncoder();
const JWT_SECRET = process.env.JWT_SECRET;

export async function refreshAccessToken(): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  const cookieStore = await cookies();
  const refreshTokens = cookieStore.get("refresh")?.value; // get cookies from header

  if (!refreshTokens) {
    return { success: false, error: "No refresh token" }; // if no refresh tokens then pass
  }

  try {
    const { payload } = await jwtVerify(refreshTokens, enc.encode(JWT_SECRET)); //  get payload from cookies

    const userId = payload.userId as string; // get user id from payload
    const jti = payload.jti as string;

    const { data: refreshTokenData } = await supabaseAdmin // get all past refresh tokens
      .from("refresh_tokens")
      .select("*")
      .eq("id", jti)
      .eq("user_id", userId)
      .single();

    if (!refreshTokenData)
      return { success: false, error: "Refresh token expired." }; // if its expired dont allow to refrehs

    if (refreshTokenData.revoked)
      return { success: false, error: "Refresh token revoked." }; // if its been revoked dont allow to refreh

    const jtiNew = crypto.randomUUID();

    const newAccessToken = jwt.sign(
      { userId: refreshTokenData.user_id },
      JWT_SECRET!,
      { expiresIn: "15s" }
    );

    const newRefreshToken = jwt.sign(
      // generate new refresh token
      { userId: refreshTokenData.user_id, jti: jtiNew }, // store jti
      JWT_SECRET!,
      { expiresIn: "10m" }
    );

    cookieStore.set("access", newAccessToken, {
      // store new cookies
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("refresh", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    await supabaseAdmin.from("refresh_tokens").insert([
      // update the refresh tokens by adding new row with new refresh token
      {
        user_id: userId,
        id: jtiNew,
      },
    ]);

    await supabaseAdmin // update refresh tokens to show that the old one has been used
      .from("refresh_tokens")
      .update({ revoked: true })
      .eq("id", jti);

    return { success: true, userId };
  } catch (error) {
    return { success: false, error: "Invalid refresh token." };
  }
}
