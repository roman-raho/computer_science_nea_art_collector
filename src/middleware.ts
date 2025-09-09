import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { supabaseAdmin } from "./app/lib/supabase/server";
import jwt from "jsonwebtoken";

// list of protected routes
const PROTECTED = ["/3d-view", "/settings", "/collection"];
const enc = new TextEncoder();
const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl; // extract pathname from request url

  const isProtected = PROTECTED.some((route) => pathname.startsWith(route));
  if (!isProtected) {
    return NextResponse.next();
  }

  const access = request.cookies.get("access")?.value; // get the current cookies
  const refresh = request.cookies.get("refresh")?.value;

  const redirectToHome = () => {
    // creatte a reusable function to increase code modularity
    const url = request.nextUrl.clone();
    url.pathname = "";
    return NextResponse.redirect(url);
  };

  // check if there are no refresh tokens - if none just redirect
  if (!refresh) {
    return redirectToHome();
  }

  if (access) {
    // if the access token is valid then allow them to pass to the site they are trying to access
    try {
      const passed = await jwtVerify(access, enc.encode(JWT_SECRET));
      if (passed) return NextResponse.next();
    } catch {
      console.log("invalid access trying to refresh");
    }
  }

  try {
    const { payload } = await jwtVerify(refresh, enc.encode(JWT_SECRET)); // get the payload from the jwt

    const userId = payload.userId as string;
    const jti = payload.jti as string; // destructure the information

    const { data: refreshTokenData } = await supabaseAdmin // get the refresh token from the db to check expiration
      .from("refresh_tokens")
      .select("*")
      .eq("id", jti)
      .eq("user_id", userId)
      .single();

    if (!refreshTokenData) return redirectToHome(); // if there is no refresh data then bail out

    if (new Date(refreshTokenData.expires_at).getTime() <= Date.now()) {
      // if the refresh token has expired then redirect to home
      return redirectToHome();
    }

    const jtiNew = crypto.randomUUID(); // generate a new jti for new cookies

    if (new Date(refreshTokenData.expires_at).getTime() > Date.now()) {
      // check that refresh token is still valid
      // create new access token
      const accessToken = jwt.sign(
        // generate new cookeis for refresh
        { userId: refreshTokenData.user_id, jti: jtiNew },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" }
      );

      // create new refresh token
      const refreshToken = jwt.sign(
        // generate new cookeis for refresh
        { userId: refreshTokenData.user_id, jti: jtiNew },
        process.env.JWT_SECRET!,
        { expiresIn: "14d" }
      );

      const response = NextResponse.next();
      console.log("new cookies set");
      response.cookies.set("access", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
      response.cookies.set("refresh", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      }); // set the new cookies

      await supabaseAdmin // create  a new row insert for the new refresh token
        .from("refresh_tokens")
        .insert([{ user_id: userId, id: jtiNew }]);

      // update the database to show that the refresh token has been used
      await supabaseAdmin // set that the refresh token has been used in the database
        .from("refresh_tokens")
        .update({ revoked: true })
        .eq("id", jti);

      return response; // return the response to the client
    }
  } catch {
    console.log("redirect");
    return redirectToHome();
  }
}

export const config = {
  matcher: ["/:path*"],
};
