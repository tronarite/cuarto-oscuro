import { ApiError, GoogleGenAI } from "@google/genai";

// BETA: identificación automática de fotos vía Gemini (Google AI). Se
// probó primero con Google Cloud Vision (Web Detection), pero esa API
// solo da etiquetas sueltas ("Carving", "Crowd") — vale para saber QUÉ
// es, no para describir la foto. Gemini, al ser un modelo multimodal,
// sí redacta una frase corta y natural, como un pie de foto de verdad.
//
// Requiere GEMINI_API_KEY en el entorno: una clave simple (no cuenta de
// servicio) sacada de https://aistudio.google.com/apikey — gratis, sin
// tarjeta, con un límite diario generoso en los modelos Flash/Flash-Lite.
// Sin esa variable, o si la llamada falla por cualquier motivo (cuota
// agotada, sin red, respuesta rara...), se devuelve null en silencio:
// nunca debe romper ni frenar la subida de una foto, el pie de foto
// automático es un añadido opcional, no algo de lo que dependa el flujo
// de subida.

const MODEL = "gemini-3.5-flash-lite";

const PROMPT = `Describe esta foto en una frase corta y natural en español, como pie de foto de una galería personal (máximo 12 palabras, sin punto final, sin comillas, sin empezar con "Una foto de" ni similar).
Si la foto es demasiado genérica, abstracta o no hay nada identificable que describir, responde ÚNICAMENTE con la palabra: NADA`;

const EMPTY_MARKER = /^nada\.?$/i;

let client: GoogleGenAI | null | undefined;

function getClient(): GoogleGenAI | null {
  if (client !== undefined) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    client = null;
    return client;
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}

function cleanCaption(text: string): string | null {
  const trimmed = text.trim().replace(/^["'“”]|["'“”]$/g, "");
  if (!trimmed || EMPTY_MARKER.test(trimmed)) return null;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// El plan gratis de Gemini Flash-Lite admite solo 15 peticiones por
// minuto: al identificar muchas fotos seguidas (ver
// identifyExistingPhotos en photo-maintenance-actions.ts) es fácil
// superarlo. Ante un 429 (cuota agotada) o 503 (sobrecarga temporal) se
// reintenta con espera creciente antes de rendirse.
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 3000; // 3s, 6s, 12s

function isRetryableStatus(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 429 || err.status === 503);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Resultado completo: distingue un fallo real de la llamada (cuota, red,
// respuesta inesperada) de un "NADA" legítimo (Gemini sí ha mirado la
// foto y no ha encontrado nada claro que describir). Sin esta distinción,
// identifyExistingPhotos no podría avisar de que algo falló de verdad —
// las fotos afectadas se quedarían calladamente con su pie de foto
// anterior, como si Gemini las hubiera revisado y no hubiera decidido
// nada.
async function callGemini(image: Buffer): Promise<{ caption: string | null; error: boolean }> {
  const ai = getClient();
  if (!ai) return { caption: null, error: false };

  for (let attempt = 0; ; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
          { inlineData: { mimeType: "image/webp", data: image.toString("base64") } },
          { text: PROMPT },
        ],
      });

      const text = response.text;
      return { caption: text ? cleanCaption(text) : null, error: false };
    } catch (err) {
      if (attempt < MAX_RETRIES && isRetryableStatus(err)) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
      console.warn("[vision] no se pudo identificar la foto:", err);
      return { caption: null, error: true };
    }
  }
}

// `image` es el buffer ya procesado (la miniatura, no el original): de
// sobra para que Gemini reconozca el contenido, y mucho más ligero de
// mandar que el original a resolución completa. Nunca lanza: si la API
// no está configurada o falla (incluso tras reintentar), devuelve null en
// silencio — el pie de foto automático es un añadido opcional, nunca algo
// de lo que dependa el flujo de subida.
export async function detectPhotoCaption(image: Buffer): Promise<string | null> {
  const { caption } = await callGemini(image);
  return caption;
}

// Variante para procesos en lote (ver identifyExistingPhotos): igual que
// detectPhotoCaption, pero además dice si el resultado vacío fue un
// fallo real de la API, para poder contarlo aparte de un "NADA" legítimo.
export async function detectPhotoCaptionDetailed(
  image: Buffer,
): Promise<{ caption: string | null; error: boolean }> {
  return callGemini(image);
}
