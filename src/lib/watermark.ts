import sharp from "sharp";
import {
  buildWatermarkSvg,
  type WatermarkCorner,
  type WatermarkStyle,
} from "@/lib/watermark-svg";

// Resoluciones generosas: estas imágenes ya no son "originales sin
// procesar" (nunca se sirve eso), pero deben verse nítidas incluso en
// huecos grandes del mosaico (hasta ~900px de ancho) y en pantallas de
// alta densidad, así que se prioriza la fidelidad sobre el peso.
const DISPLAY_MAX_EDGE = 3200;
// Bajado de 1800 a 1200: todas las fotos de una galería generaban su
// miniatura a 1800px sin importar el tamaño real de su hueco (la mayoría
// son SMALL/MEDIUM, no el hueco LARGE de ~900px al que estaba pensado
// esto), y sin srcset el navegador siempre descarga el archivo entero.
// Eso es lo que causaba el lag al bajar rápido por una galería mientras
// carga: varias imágenes de ~1800px decodificándose de golpe.
const THUMB_MAX_EDGE = 1200;

export interface WatermarkOptions {
  enabled: boolean;
  text: string;
  // Solo importan cuando enabled=true. Con default para las llamadas
  // existentes (tests, scripts) que aún no los pasen explícitamente.
  style?: WatermarkStyle;
  corner?: WatermarkCorner;
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

  const hasMark = watermark.enabled && Boolean(watermark.text);
  let pipeline = sharp(resizedBuffer);
  if (hasMark) {
    const svg = buildWatermarkSvg(w, h, {
      text: watermark.text,
      style: watermark.style ?? "TILED",
      corner: watermark.corner ?? "BOTTOM_RIGHT",
    });
    pipeline = pipeline.composite([{ input: Buffer.from(svg), blend: "over" }]);
  }

  // Con marca incrustada, se sube algo la calidad/esfuerzo de
  // codificación para compensar la pérdida extra que mete el propio
  // composite (mezclar los píxeles de la marca con la foto) — sin marca,
  // no hace falta tocar nada de lo que ya funcionaba bien.
  const buffer = await pipeline
    .webp(
      hasMark
        ? { quality: Math.min(100, quality + 5), effort: 6, smartSubsample: true }
        : { quality },
    )
    .toBuffer();

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
  return toWatermarkedWebp(input, THUMB_MAX_EDGE, 80, watermark);
}
