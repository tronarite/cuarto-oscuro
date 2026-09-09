import { buildWatermarkSvg, type WatermarkDisplaySettings } from "@/lib/watermark-svg";

// Capa "superpuesta" de la marca de agua (método OVERLAY, ver
// WatermarkSettingsForm): el archivo servido (thumb/display) queda
// limpio, y esto pinta la marca encima con el mismo marcado SVG que se
// usaría si estuviera incrustada (buildWatermarkSvg), para que se vea
// igual en los dos métodos.
//
// Se coloca como hermano del <img> dentro de un contenedor `relative` —
// no intenta encajar con precisión de píxel dentro del área real de la
// foto si esta queda con márgenes (object-contain sobre un hueco de otra
// proporción): cubre la caja del <img>, igual que ya hace la cortinilla
// de descripción de las miniaturas.
export function WatermarkOverlay({
  watermark,
  width,
  height,
  fit = "contain",
}: {
  watermark: WatermarkDisplaySettings;
  width: number | null | undefined;
  height: number | null | undefined;
  // "cover" cuando el <img> vecino usa object-cover (modo "ampliar
  // hasta llenar la pantalla" del visor/presentación) — ver fit en
  // buildWatermarkSvg.
  fit?: "contain" | "cover";
}) {
  if (!watermark.enabled || watermark.method !== "OVERLAY" || !watermark.text) {
    return null;
  }

  const svg = buildWatermarkSvg(
    width || 1600,
    height || 1200,
    { text: watermark.text, style: watermark.style, corner: watermark.corner },
    "responsive",
    fit,
  );

  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
