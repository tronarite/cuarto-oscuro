import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { resolveServedFile } from "@/lib/storage";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hasGalleryUnlock } from "@/lib/gallery-access";

// Anchos permitidos para el redimensionado al vuelo de las miniaturas
// (?w=). El archivo base se genera a ~1200px; en un móvil a 2 columnas
// eso son ~185px de hueco, ~6x más de lo que hace falta. Se sirve una
// versión más pequeña vía srcset y el navegador elige.
const ALLOWED_WIDTHS = new Set([320, 480, 640, 960, 1280]);

// Cache pequeña en memoria: la portada machaca las mismas pocas fotos
// destacadas entre visitantes, y así solo se redimensiona una vez.
// Acotada para no comerse la RAM con galerías grandes.
const MAX_CACHE_ENTRIES = 64;
const resizeCache = new Map<string, Buffer>();

async function resizedThumb(baseData: Buffer, width: number): Promise<Buffer> {
  return sharp(baseData)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 74, effort: 4 })
    .toBuffer();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ variant: string; photoId: string }> },
) {
  const { variant, photoId } = await params;
  if (variant !== "display" && variant !== "thumb") {
    return NextResponse.json({ error: "Variante inválida" }, { status: 400 });
  }

  const widthParam = Number(request.nextUrl.searchParams.get("w"));
  const width =
    variant === "thumb" && ALLOWED_WIDTHS.has(widthParam) ? widthParam : null;

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

  const cacheControl = admin ? "private, no-store" : "private, max-age=86400";

  try {
    const absPath = resolveServedFile(relPath);

    let data: Buffer;
    if (width) {
      const cacheKey = `${photoId}:${width}`;
      const cached = resizeCache.get(cacheKey);
      if (cached) {
        data = cached;
      } else {
        const base = await fs.readFile(absPath);
        data = await resizedThumb(base, width);
        if (resizeCache.size >= MAX_CACHE_ENTRIES) {
          resizeCache.delete(resizeCache.keys().next().value!);
        }
        resizeCache.set(cacheKey, data);
      }
    } else {
      data = await fs.readFile(absPath);
    }

    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": "image/webp", "Cache-Control": cacheControl },
    });
  } catch {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }
}
