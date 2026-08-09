import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { prisma } from "@/lib/db";
import { resolveServedFile } from "@/lib/storage";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hasGalleryUnlock } from "@/lib/gallery-access";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ variant: string; photoId: string }> },
) {
  const { variant, photoId } = await params;
  if (variant !== "display" && variant !== "thumb") {
    return NextResponse.json({ error: "Variante inválida" }, { status: 400 });
  }

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: {
      displayPath: true,
      thumbPath: true,
      gallery: { select: { id: true, privacy: true } },
    },
  });
  if (!photo) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const gallery = photo.gallery;
  const admin = await isAdminAuthed();

  if (!admin && gallery.privacy === "PASSWORD") {
    const unlocked = await hasGalleryUnlock(gallery.id);
    if (!unlocked) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const relPath = variant === "display" ? photo.displayPath : photo.thumbPath;
  if (!relPath) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  try {
    const absPath = resolveServedFile(relPath);
    const data = await fs.readFile(absPath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": admin
          ? "private, no-store"
          : "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }
}
