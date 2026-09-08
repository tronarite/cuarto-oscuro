// BETA: identificación automática de fotos vía Google Cloud Vision
// (Web Detection) — el mismo motor que usa images.google.com para
// "Buscar con esta imagen": compara contra su índice de imágenes de la
// web y, si encuentra coincidencias claras, da una "mejor suposición"
// de qué es (p. ej. "Edinburgh Castle"). No es la propia interfaz de
// Google Imágenes (no existe una API pública para eso), es la API de
// pago que hace el trabajo real detrás.
//
// Requiere GOOGLE_VISION_API_KEY en el entorno. Sin esa variable, o si
// la petición falla por cualquier motivo (cuota agotada, sin red, foto
// no identificable...), se devuelve null en silencio: nunca debe romper
// ni frenar la subida de una foto, el pie de foto automático es un
// añadido opcional, no algo de lo que dependa el flujo de subida.

const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

// Por debajo de esto, Google no está seguro de verdad de lo que es (fotos
// genéricas del día a día suelen devolver labels con score bajo aunque
// "encuentre algo parecido") — mejor no poner un pie de foto erróneo que
// forzar uno dudoso.
const MIN_LABEL_SCORE = 0.6;

interface WebDetectionResponse {
  responses?: {
    webDetection?: {
      bestGuessLabels?: { label: string }[];
      webEntities?: { description?: string; score?: number }[];
    };
    error?: { message: string };
  }[];
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// `image` es el buffer ya procesado (la miniatura, no el original): de
// sobra para que Vision reconozca el contenido, y mucho más ligero de
// mandar que el original a resolución completa.
export async function detectPhotoCaption(image: Buffer): Promise<string | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${VISION_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: image.toString("base64") },
            features: [{ type: "WEB_DETECTION", maxResults: 5 }],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.warn("[vision] petición fallida:", res.status, await res.text());
      return null;
    }

    const data: WebDetectionResponse = await res.json();
    const detection = data.responses?.[0]?.webDetection;
    if (data.responses?.[0]?.error) {
      console.warn("[vision] error de la API:", data.responses[0].error.message);
      return null;
    }

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
