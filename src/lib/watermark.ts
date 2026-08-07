import sharp from "sharp";

const DISPLAY_MAX_EDGE = 2000;
const THUMB_MAX_EDGE = 640;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function watermarkSvg(width: number, height: number, text: string): Buffer {
  const safeText = escapeXml(text);
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wm" width="340" height="170" patternTransform="rotate(-30)" patternUnits="userSpaceOnUse">
          <text x="0" y="90" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#ffffff" fill-opacity="0.16">${safeText}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)" />
    </svg>
  `);
}

async function toWatermarkedWebp(
  input: Buffer,
  maxEdge: number,
  quality: number,
): Promise<Buffer> {
  // Redimensiona primero y vuelve a leer los metadatos del resultado: la
  // orientación EXIF puede intercambiar ancho/alto, así que no se pueden
  // calcular las dimensiones finales de antemano a partir del original.
  const resizedBuffer = await sharp(input)
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer();

  const { width, height } = await sharp(resizedBuffer).metadata();
  const w = width ?? maxEdge;
  const h = height ?? maxEdge;

  const watermarkText = process.env.WATERMARK_TEXT || "© Galería fotográfica";

  return sharp(resizedBuffer)
    .composite([{ input: watermarkSvg(w, h, watermarkText), blend: "over" }])
    .webp({ quality })
    .toBuffer();
}

export async function generateDisplayImage(input: Buffer): Promise<Buffer> {
  return toWatermarkedWebp(input, DISPLAY_MAX_EDGE, 82);
}

export async function generateThumbImage(input: Buffer): Promise<Buffer> {
  return toWatermarkedWebp(input, THUMB_MAX_EDGE, 72);
}
