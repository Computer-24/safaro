// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow NextAuth API routes
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/vercel.svg") ||
    path.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Public routes
  const publicRoutes = ["/login"];
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  // Protected routes
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based protection
  const role = token.role as string;

  // ADMIN-only routes
  if (path.startsWith("/admin") || path.startsWith("/tickets/all")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // APPROVER-only routes
  if (path.startsWith("/tickets/assigned") || path.startsWith("/lessons")) {
    if (role !== "APPROVER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tickets/:path*",
    "/admin/:path*",
  ],
};
