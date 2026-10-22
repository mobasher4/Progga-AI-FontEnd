import { NextResponse, type NextRequest } from "next/server";

// Fast redirect for signed-out visitors. The API still verifies the token on
// every request; this only avoids flashing a protected page.
const PROTECTED = ["/home", "/tutor", "/lessons", "/arena", "/rewards", "/leaderboard", "/profile", "/guardian", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasToken = req.cookies.has("progga_token");

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if ((pathname === "/login" || pathname === "/signup") && hasToken) {
    return NextResponse.redirect(new URL("/home", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|brand|favicon|icon).*)"],
};
