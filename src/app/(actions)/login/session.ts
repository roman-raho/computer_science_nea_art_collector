"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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
