import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

const ADMIN_COOKIE_NAME = "admin_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/galeria")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store, must-revalidate");
    return response;
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const session = await verifySession<{ role: string }>(
    request.cookies.get(ADMIN_COOKIE_NAME)?.value,
  );

  if (session?.role !== "admin") {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/galeria/:path*"],
};
