import path from "node:path";
import fs from "node:fs/promises";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

export interface PhotoPaths {
  originalAbs: string;
  displayAbs: string;
  thumbAbs: string;
  originalRel: string;
  displayRel: string;
  thumbRel: string;
}

export function photoPaths(
  galleryId: string,
  photoId: string,
  originalExt: string,
): PhotoPaths {
  const originalRel = path.join(
    "originals",
    galleryId,
    `${photoId}${originalExt}`,
  );
  const displayRel = path.join("display", galleryId, `${photoId}.webp`);
  const thumbRel = path.join("thumb", galleryId, `${photoId}.webp`);

  return {
    originalRel,
    displayRel,
    thumbRel,
    originalAbs: path.join(UPLOADS_ROOT, originalRel),
    displayAbs: path.join(UPLOADS_ROOT, displayRel),
    thumbAbs: path.join(UPLOADS_ROOT, thumbRel),
  };
}

export async function writeUploadFile(absPath: string, data: Buffer) {
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, data);
}

export function resolveServedFile(relPath: string): string {
  const resolved = path.normalize(path.join(UPLOADS_ROOT, relPath));
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep)) {
    throw new Error("Ruta fuera de uploads/");
  }
  return resolved;
}

export async function deleteFileIfExists(absPath: string) {
  await fs.rm(absPath, { force: true });
}

export async function deleteGalleryUploads(galleryId: string) {
  await fs.rm(path.join(UPLOADS_ROOT, "originals", galleryId), {
    recursive: true,
    force: true,
  });
  await fs.rm(path.join(UPLOADS_ROOT, "display", galleryId), {
    recursive: true,
    force: true,
  });
  await fs.rm(path.join(UPLOADS_ROOT, "thumb", galleryId), {
    recursive: true,
    force: true,
  });
}
