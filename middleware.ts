import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET ||
  "local-billing-app-super-secure-multi-tenant-jwt-secret-key-2026-v1";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const token = req.cookies.get("billing_session")?.value;

  let isValid = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET_KEY);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  // If user is already authenticated and visits login/register, redirect to dashboard
  if (isAuthPage && isValid) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is not authenticated and visits protected page, redirect to login
  if (!isAuthPage && !isValid) {
    const loginUrl = new URL("/login", req.url);
    // Don't append redirect for root path
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - images and assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

