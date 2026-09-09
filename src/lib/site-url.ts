import { headers } from "next/headers";

// URL pública absoluta del sitio: hace falta para que las rutas
// relativas de imagen en openGraph.images (la foto destacada de una
// galería o de la portada) se resuelvan a absolutas — Next.js lo exige
// desde generateMetadata.
//
// SITE_URL (.env) es la forma correcta de fijarla en producción — debe
// apuntar siempre al dominio público real, con https://. Esto es solo
// una red de seguridad para cuando no está puesta (o para cualquier
// entorno donde no coincida con el dominio real por el que de verdad se
// está accediendo, como un túnel temporal para probar desde el móvil):
// en vez de asumir a ciegas localhost, se deduce del host real de la
// petición, para que la imagen del enlace enriquecido no salga rota.
export async function resolveSiteUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL;

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (!host) return "http://localhost:3000";

  const proto =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}
