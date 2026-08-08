import sharp from "sharp";

// Foto de "Sobre mí": sin marca de agua (no es contenido de galería a
// proteger) y sin recortar, como el resto de fotos del sitio.
const MAX_EDGE = 1600;

export interface ProcessedAboutPhoto {
  buffer: Buffer;
  width: number;
  height: number;
}

export async function generateAboutPhoto(
  input: Buffer,
): Promise<ProcessedAboutPhoto> {
  const buffer = await sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 90 })
    .toBuffer();

  const { width, height } = await sharp(buffer).metadata();
  return { buffer, width: width ?? MAX_EDGE, height: height ?? MAX_EDGE };
}
