// Construye el marcado SVG de la marca de agua para los 3 estilos
// (TILED/FULL/CORNER). Sin dependencia de `sharp` a propósito: el mismo
// marcado sirve tanto para incrustar en los píxeles al procesar la foto
// (src/lib/watermark.ts, servidor) como para superponer como una capa en
// el navegador (src/components/WatermarkOverlay.tsx, cliente) — así, si
// se cambia de método, la marca se ve exactamente igual.
//
// El viewBox usa siempre las dimensiones reales de la foto (no un
// tamaño relativo 0-100): así el tamaño/densidad del texto coincide con
// cómo se vería incrustado, sea cual sea el tamaño real en pantalla.

export type WatermarkStyle = "TILED" | "FULL" | "CORNER";
export type WatermarkCorner =
  | "TOP_LEFT"
  | "TOP_RIGHT"
  | "BOTTOM_LEFT"
  | "BOTTOM_RIGHT";

export interface WatermarkMarkOptions {
  text: string;
  style: WatermarkStyle;
  corner: WatermarkCorner;
}

export type WatermarkMethod = "OVERLAY" | "EMBEDDED";

// Los ajustes de marca de agua que necesita cualquier sitio donde se
// muestre una foto públicamente (cuadrícula, visor, presentación,
// sugerencias, raíl destacado, preview del admin) para decidir si debe
// pintar la capa superpuesta encima del <img> — ver WatermarkOverlay.tsx.
// Se arma una vez por página a partir de Settings y se pasa hacia abajo.
export interface WatermarkDisplaySettings {
  enabled: boolean;
  method: WatermarkMethod;
  style: WatermarkStyle;
  corner: WatermarkCorner;
  text: string;
}

// Construye WatermarkDisplaySettings a partir de la fila de Settings
// (Prisma): se llama una vez por página y se reparte hacia abajo, en vez
// de repetir la misma selección de 5 campos en cada sitio.
export function toWatermarkDisplaySettings(settings: {
  watermarkEnabled: boolean;
  watermarkMethod: WatermarkMethod;
  watermarkStyle: WatermarkStyle;
  watermarkCorner: WatermarkCorner;
  watermarkText: string;
}): WatermarkDisplaySettings {
  return {
    enabled: settings.watermarkEnabled,
    method: settings.watermarkMethod,
    style: settings.watermarkStyle,
    corner: settings.watermarkCorner,
    text: settings.watermarkText,
  };
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tiledMarkup(width: number, height: number, text: string): string {
  return `
    <defs>
      <pattern id="wm" width="340" height="170" patternTransform="rotate(-30)" patternUnits="userSpaceOnUse">
        <text x="0" y="90" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#ffffff" fill-opacity="0.16">${text}</text>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#wm)" />
  `;
}

function fullMarkup(width: number, height: number, text: string): string {
  // Una sola marca, girada y centrada, con el tamaño de letra escalado a
  // la diagonal de la foto para que siempre cubra de esquina a esquina
  // sea cual sea su forma (apaisada, vertical, cuadrada...).
  const diagonal = Math.sqrt(width * width + height * height);
  const fontSize = Math.round(diagonal * 0.07);
  const cx = width / 2;
  const cy = height / 2;
  return `
    <text
      x="${cx}" y="${cy}"
      font-family="Helvetica, Arial, sans-serif"
      font-size="${fontSize}"
      fill="#ffffff"
      fill-opacity="0.18"
      text-anchor="middle"
      dominant-baseline="middle"
      transform="rotate(-30 ${cx} ${cy})"
    >${text}</text>
  `;
}

function cornerMarkup(
  width: number,
  height: number,
  text: string,
  corner: WatermarkCorner,
): string {
  const margin = Math.round(Math.min(width, height) * 0.04);
  const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.035));
  const padX = fontSize * 0.6;
  const padY = fontSize * 0.5;
  // Ancho aproximado del texto (no hay medida real disponible sin DOM):
  // de sobra para que el fondo semitransparente no se quede corto.
  const approxTextWidth = text.length * fontSize * 0.6;
  const boxWidth = approxTextWidth + padX * 2;
  const boxHeight = fontSize + padY * 2;

  const left = corner === "TOP_LEFT" || corner === "BOTTOM_LEFT";
  const top = corner === "TOP_LEFT" || corner === "TOP_RIGHT";
  const boxX = left ? margin : width - margin - boxWidth;
  const boxY = top ? margin : height - margin - boxHeight;

  return `
    <rect
      x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}"
      rx="${padY}" fill="#000000" fill-opacity="0.35"
    />
    <text
      x="${boxX + padX}" y="${boxY + boxHeight / 2}"
      font-family="Helvetica, Arial, sans-serif"
      font-size="${fontSize}"
      fill="#ffffff"
      fill-opacity="0.85"
      dominant-baseline="middle"
    >${text}</text>
  `;
}

export function buildWatermarkSvg(
  width: number,
  height: number,
  opts: WatermarkMarkOptions,
  // "raster" (por defecto): width/height literales en px — lo que
  // necesita sharp para componer sobre la foto ya redimensionada
  // (src/lib/watermark.ts). "responsive": width/height="100%" — lo que
  // necesita un <svg> insertado en el DOM para que escale al tamaño real
  // en pantalla de su contenedor en vez de desbordarlo a resolución
  // nativa (WatermarkOverlay.tsx). El viewBox (la parte que importa para
  // que el texto/patrón tenga el tamaño y posición correctos) es igual
  // en los dos casos.
  sizing: "raster" | "responsive" = "raster",
): string {
  const text = escapeXml(opts.text);
  const inner =
    opts.style === "TILED"
      ? tiledMarkup(width, height, text)
      : opts.style === "FULL"
        ? fullMarkup(width, height, text)
        : cornerMarkup(width, height, text, opts.corner);

  const svgWidth = sizing === "responsive" ? "100%" : width;
  const svgHeight = sizing === "responsive" ? "100%" : height;
  // preserveAspectRatio por defecto (xMidYMid meet, no "none"): a
  // propósito — las fotos se muestran con object-contain, así que dejar
  // que el SVG también "encaje centrado" en vez de estirarse hace que la
  // marca caiga justo sobre el área visible real de la foto (y no
  // deformada) incluso cuando el hueco del mosaico tiene otra proporción.
  return `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}
