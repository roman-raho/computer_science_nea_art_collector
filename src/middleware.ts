import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

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

  const access = request.cookies.get("access")?.value;
  const redirectToHome = () => {
    const url = request.nextUrl.clone();
    url.pathname = "";
    return NextResponse.redirect(url);
  };

  if (!access) return redirectToHome();

  if (!JWT_SECRET) return redirectToHome();

  try {
    await jwtVerify(access, enc.encode(JWT_SECRET));
    return NextResponse.next();
  } catch {
    redirectToHome();
  }
}

export const config = {
  matcher: ["/:path*"],
};
