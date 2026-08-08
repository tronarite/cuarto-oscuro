import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { prisma } from "@/lib/db";
import { resolveServedFile } from "@/lib/storage";

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings?.aboutPhotoPath) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  try {
    const absPath = resolveServedFile(settings.aboutPhotoPath);
    const data = await fs.readFile(absPath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }
}
