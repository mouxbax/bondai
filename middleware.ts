import { NextResponse, type NextRequest } from "next/server";

/**
 * Inject `x-pathname` into request headers so server components / layouts
 * can read the current URL pathname (Next.js doesn't expose this by default).
 *
 * Used by the (app) layout to gate non-/subscribe and non-/account routes
 * behind an active subscription.
 */
export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Run on everything except next internals & static assets.
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox).*)",
  ],
};
