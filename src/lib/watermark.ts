import sharp from "sharp";

// Resoluciones generosas: estas imágenes ya no son "originales sin
// procesar" (nunca se sirve eso), pero deben verse nítidas incluso en
// huecos grandes del mosaico (hasta ~900px de ancho) y en pantallas de
// alta densidad, así que se prioriza la fidelidad sobre el peso.
const DISPLAY_MAX_EDGE = 3200;
const THUMB_MAX_EDGE = 1800;

export interface WatermarkOptions {
  enabled: boolean;
  text: string;
}

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

export interface WatermarkedImage {
  buffer: Buffer;
  width: number;
  height: number;
}

async function toWatermarkedWebp(
  input: Buffer,
  maxEdge: number,
  quality: number,
  watermark: WatermarkOptions,
): Promise<WatermarkedImage> {
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

  let pipeline = sharp(resizedBuffer);
  if (watermark.enabled && watermark.text) {
    pipeline = pipeline.composite([
      { input: watermarkSvg(w, h, watermark.text), blend: "over" },
    ]);
  }

  const buffer = await pipeline.webp({ quality }).toBuffer();

  return { buffer, width: w, height: h };
}

export async function generateDisplayImage(
  input: Buffer,
  watermark: WatermarkOptions,
): Promise<WatermarkedImage> {
  return toWatermarkedWebp(input, DISPLAY_MAX_EDGE, 90, watermark);
}

export async function generateThumbImage(
  input: Buffer,
  watermark: WatermarkOptions,
): Promise<WatermarkedImage> {
  return toWatermarkedWebp(input, THUMB_MAX_EDGE, 85, watermark);
}
