import { cookies } from "next/headers";
import { signSession, verifySession } from "@/lib/session";

const UNLOCK_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function cookieName(galleryId: string) {
  return `gallery_unlock_${galleryId}`;
}

export async function createGalleryUnlockSession(galleryId: string) {
  const token = await signSession({ galleryId }, UNLOCK_MAX_AGE);
  const store = await cookies();
  store.set(cookieName(galleryId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_MAX_AGE,
  });
}

export async function hasGalleryUnlock(galleryId: string): Promise<boolean> {
  const store = await cookies();
  const session = await verifySession<{ galleryId: string }>(
    store.get(cookieName(galleryId))?.value,
  );
  return session?.galleryId === galleryId;
}
