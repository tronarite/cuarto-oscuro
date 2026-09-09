// Límite razonable para title/description en metaetiquetas (og:description,
// twitter:description, <meta name="description">): la mayoría de
// plataformas cortan alrededor de 155-200 caracteres de todos modos: sin
// esto, una descripción de galería muy larga (el admin puede escribir lo
// que quiera, sin límite) se manda entera en el HTML y en algunos casos
// (WhatsApp, Slack) se ve cortada a medias de forma fea.
const META_DESCRIPTION_MAX = 200;

export function truncateForMeta(text: string, max = META_DESCRIPTION_MAX): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  // Corta por la última palabra completa antes del límite, para no
  // dejar una palabra partida a la mitad.
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}
