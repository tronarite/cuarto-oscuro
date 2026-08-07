function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const base64 = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET no está definida");
  return secret;
}

export async function signSession(
  payload: Record<string, unknown>,
  maxAgeSeconds: number,
): Promise<string> {
  const body = { ...payload, exp: Date.now() + maxAgeSeconds * 1000 };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(body)));
  const key = await hmacKey(getSecret());
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64),
  );
  const sigB64 = toBase64Url(new Uint8Array(signature));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySession<T = Record<string, unknown>>(
  token: string | undefined,
): Promise<T | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  const key = await hmacKey(getSecret());
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(sigB64) as BufferSource,
    new TextEncoder().encode(payloadB64),
  );
  if (!valid) return null;

  const body = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
  if (typeof body.exp !== "number" || body.exp < Date.now()) return null;
  return body as T;
}
