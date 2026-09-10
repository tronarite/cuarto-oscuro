// srcset para las miniaturas: la ruta /api/img/thumb/:id acepta ?w= y
// redimensiona al vuelo (ver el route handler). El archivo base (~1200px)
// es la entrada mayor.
const THUMB_WIDTHS = [320, 480, 640, 960] as const;

export function thumbSrcSet(id: string): string {
  const base = `/api/img/thumb/${id}`;
  return [
    ...THUMB_WIDTHS.map((w) => `${base}?w=${w} ${w}w`),
    `${base} 1280w`,
  ].join(", ");
}
