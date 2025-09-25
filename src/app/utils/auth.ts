import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { refreshAccessToken } from "@/app/utils/refresh-token";

export async function getUserIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access")?.value;

  if (accessToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET); // get secret
      const { payload } = await jwtVerify(accessToken, secret); // get payload from access token
      return payload.userId as string; // return user id
    } catch {
      const refreshResult = await refreshAccessToken(); // if access token invalid try to refresh
      if (refreshResult.success) {
        // if refresh worked return user id
        return refreshResult.userId!;
      }
      return null;
    }
  }

  const refreshResult = await refreshAccessToken(); // if no access token try to refresh
  if (refreshResult.success) {
    return refreshResult.userId!; // if refresh worked return user id
  }

  return null;
}
