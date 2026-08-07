import { cookies } from "next/headers";
import { signSession, verifySession } from "@/lib/session";

const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export async function createAdminSession() {
  const token = await signSession({ role: "admin" }, SESSION_MAX_AGE);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  const session = await verifySession<{ role: string }>(
    store.get(COOKIE_NAME)?.value,
  );
  return session?.role === "admin";
}

export { COOKIE_NAME as ADMIN_COOKIE_NAME };
