import { ImageAnnotatorClient } from "@google-cloud/vision";

// BETA: identificación automática de fotos vía Google Cloud Vision
// (Web Detection) — el mismo motor que usa images.google.com para
// "Buscar con esta imagen": compara contra su índice de imágenes de la
// web y, si encuentra coincidencias claras, da una "mejor suposición"
// de qué es (p. ej. "Edinburgh Castle"). No es la propia interfaz de
// Google Imágenes (no existe una API pública para eso), es la API de
// pago que hace el trabajo real detrás.
//
// Requiere GOOGLE_VISION_CREDENTIALS_JSON en el entorno: el JSON
// completo de una cuenta de servicio de Google Cloud (Consola → APIs y
// servicios → Credenciales → Crear credenciales → Cuenta de servicio →
// pestaña Claves → Crear clave → JSON), como una única línea. Sin esa
// variable, o si la llamada falla por cualquier motivo (cuota agotada,
// sin red, foto no identificable...), se devuelve null en silencio:
// nunca debe romper ni frenar la subida de una foto, el pie de foto
// automático es un añadido opcional, no algo de lo que dependa el flujo
// de subida.

// Por debajo de esto, Google no está seguro de verdad de lo que es (fotos
// genéricas del día a día suelen devolver labels con score bajo aunque
// "encuentre algo parecido") — mejor no poner un pie de foto erróneo que
// forzar uno dudoso.
const MIN_LABEL_SCORE = 0.6;

// El cliente se crea una sola vez y se reutiliza entre subidas (evita
// reconstruir la autenticación en cada foto); si las credenciales no
// son válidas o faltan, se queda en null y detectPhotoCaption no hace
// nada, sin lanzar.
let client: ImageAnnotatorClient | null | undefined;

function getClient(): ImageAnnotatorClient | null {
  if (client !== undefined) return client;

  const raw = process.env.GOOGLE_VISION_CREDENTIALS_JSON;
  if (!raw) {
    client = null;
    return client;
  }

  try {
    const credentials = JSON.parse(raw);
    client = new ImageAnnotatorClient({ credentials });
  } catch (err) {
    console.warn("[vision] GOOGLE_VISION_CREDENTIALS_JSON inválido:", err);
    client = null;
  }
  return client;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// `image` es el buffer ya procesado (la miniatura, no el original): de
// sobra para que Vision reconozca el contenido, y mucho más ligero de
// mandar que el original a resolución completa.
export async function detectPhotoCaption(image: Buffer): Promise<string | null> {
  const annotator = getClient();
  if (!annotator) return null;

  try {
    const [result] = await annotator.webDetection({ image: { content: image } });
    const detection = result.webDetection;

    // "Mejor suposición": lo más parecido a lo que da Google Imágenes
    // como título cuando la búsqueda por imagen tiene una respuesta
    // clara. Si no hay ninguna, se prueba con la entidad web mejor
    // puntuada por si supera el umbral de confianza.
    const bestGuess = detection?.bestGuessLabels?.[0]?.label;
    if (bestGuess) return capitalize(bestGuess);

    const topEntity = detection?.webEntities?.find(
      (e) => e.description && (e.score ?? 0) >= MIN_LABEL_SCORE,
    );
    return topEntity?.description ? capitalize(topEntity.description) : null;
  } catch (err) {
    console.warn("[vision] no se pudo identificar la foto:", err);
    return null;
  }
}
