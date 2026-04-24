// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow NextAuth API routes to pass through
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow static assets and _next
  if (path.startsWith("/_next") || path.startsWith("/favicon.ico") || path.startsWith("/vercel.svg")) {
    return NextResponse.next();
  }

  // Protect specific app routes
  const protectedRoutes = ["/dashboard", "/tickets", "/admin"];
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));

  if (isProtected) {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tickets/:path*", "/admin/:path*"],
};
