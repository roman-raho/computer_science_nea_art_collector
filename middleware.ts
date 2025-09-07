import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// list of protected routes
const PROTECTED = ["/3d-view", "/settings", "/collection"];
const enc = new TextEncoder();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl; // extract pathname from request url

  if (!PROTECTED.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const access = request.cookies.get("access")?.value;
  if (!access) {
    const url = request.nextUrl.clone(); // clone the request as it is read only object - must clone then modify
    url.pathname = "/";
    return NextResponse.redirect(url); // if they dont have access redirect them to the home page
  }

  try {
    await jwtVerify(access, enc.encode(process.env.JWT_SECRET)); // verifies the jwt against the secret in ENV to make sure its valid
    return NextResponse.next();
  } catch {
    const url = request.nextUrl.clone(); // if not valid redirect
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/:path*"],
};
