// Combinaciones predominantes por sala: cada preset pondera blobs vs. luz de
// forma distinta para que cada sección de la galería tenga un "ambiente"
// distinto, tal como pide el spec (sala 1 con más peso de blobs, sala 2 con
// más peso de luz...). El grano es constante y no se pondera por sala.
const ROOM_PRESETS = [
  { blobA: 1.2, blobB: 0.85, light: 0.45 },
  { blobA: 0.55, blobB: 0.7, light: 1.35 },
  { blobA: 0.9, blobB: 1.15, light: 0.75 },
];

export function roomWeights(roomIndex: number) {
  return ROOM_PRESETS[roomIndex % ROOM_PRESETS.length];
}

export function roomCenters(roomCount: number): number[] {
  const n = Math.max(roomCount, 1);
  return Array.from({ length: n }, (_, i) => (i + 0.5) / n);
}
