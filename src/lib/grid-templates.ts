export type SlotSize = "SMALL" | "MEDIUM" | "LARGE";
export type GalleryLayout = "MIXED" | "LARGE" | "COMPACT" | "BALANCED";

export const SLOT_LABEL: Record<SlotSize, string> = {
  SMALL: "Pequeña",
  MEDIUM: "Mediana",
  LARGE: "Grande",
};

export const LAYOUT_LABEL: Record<GalleryLayout, string> = {
  MIXED: "Mixta",
  LARGE: "Grandes",
  COMPACT: "Compacta",
  BALANCED: "Equilibrada",
};

export const LAYOUT_DESCRIPTION: Record<GalleryLayout, string> = {
  MIXED: "Grandes, medianas y pequeñas mezcladas",
  LARGE: "Casi todo en grande, para pocas fotos con fuerza",
  COMPACT: "Mayoría pequeñas, con algún acento mediano",
  BALANCED: "Ritmo regular entre medianas y grandes",
};

// Cada plantilla es un patrón cíclico de tamaños de hueco. La posición
// de una foto en la galería (su `order`) decide qué hueco ocupa —
// arrastrar una foto a otra posición la intercambia de hueco.
const PATTERNS: Record<GalleryLayout, SlotSize[]> = {
  MIXED: [
    "LARGE", "SMALL", "SMALL", "MEDIUM",
    "SMALL", "SMALL", "LARGE", "MEDIUM",
    "SMALL", "MEDIUM", "SMALL", "SMALL",
  ],
  LARGE: ["LARGE", "MEDIUM", "LARGE", "LARGE", "MEDIUM", "LARGE", "MEDIUM"],
  COMPACT: [
    "SMALL", "SMALL", "SMALL", "MEDIUM",
    "SMALL", "SMALL", "SMALL", "SMALL",
    "MEDIUM", "SMALL", "SMALL", "SMALL",
  ],
  BALANCED: [
    "MEDIUM", "MEDIUM", "SMALL", "LARGE",
    "MEDIUM", "SMALL", "MEDIUM", "LARGE",
    "SMALL", "MEDIUM", "MEDIUM", "SMALL",
  ],
};

export function slotSizeForIndex(layout: GalleryLayout, index: number): SlotSize {
  const pattern = PATTERNS[layout];
  return pattern[index % pattern.length];
}

// Primeros huecos de cada patrón, para dibujar una miniatura visual del
// diseño (ej. en el selector de plantilla del admin).
export function previewPattern(layout: GalleryLayout, count = 6): SlotSize[] {
  return PATTERNS[layout].slice(0, count);
}
