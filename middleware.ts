import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// list of protected routes
const PROTECTED = ["/3d-view", "/settings", "/collections"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl; // extract pathname from request url

  if (!PROTECTED.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const hasAccess = request.cookies.get("access");
  if (!hasAccess) {
    const url = request.nextUrl.clone(); // clone the request as it is read only object - must clone then modify
    url.pathname = "/";
    return NextResponse.redirect(url); // if they dont have access redirect them to the home page
  }

  return NextResponse.next(); // if hasAccess but for some reason not trying to access protected route allow to continue
}

export const config = {
  matcher: ["/:path*"],
};
