import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/db";

const ADMIN_COOKIE_NAME = "admin_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/galeria")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store, must-revalidate");
    return response;
  }

  // Sin contraseña de admin configurada todavía: la primera visita al
  // panel manda a elegirla en vez de al login normal.
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const adminConfigured = Boolean(settings?.adminPasswordHash);

  if (pathname === "/admin/setup") {
    if (adminConfigured) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (!adminConfigured) {
    return NextResponse.redirect(new URL("/admin/setup", request.url));
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
