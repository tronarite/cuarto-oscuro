import { GoogleGenAI } from "@google/genai";

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

// `image` es el buffer ya procesado (la miniatura, no el original): de
// sobra para que Gemini reconozca el contenido, y mucho más ligero de
// mandar que el original a resolución completa.
export async function detectPhotoCaption(image: Buffer): Promise<string | null> {
  const ai = getClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { inlineData: { mimeType: "image/webp", data: image.toString("base64") } },
        { text: PROMPT },
      ],
    });

    const text = response.text;
    return text ? cleanCaption(text) : null;
  } catch (err) {
    console.warn("[vision] no se pudo identificar la foto:", err);
    return null;
  }
}
