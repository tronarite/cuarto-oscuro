// Limitador de intentos en memoria. La app corre como un único proceso
// (`next start` en un contenedor), así que un Map a nivel de módulo
// basta — no hace falta Redis ni una tabla. Se reinicia al reiniciar el
// contenedor, lo cual es aceptable: un atacante no puede provocar eso.

interface Attempt {
  count: number;
  windowStart: number;
  blockedUntil: number;
}

const attempts = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // los fallos cuentan dentro de 15 min
const BLOCK_MS = 15 * 60 * 1000; // y bloquean otros 15 min

export interface RateLimitState {
  blocked: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string): RateLimitState {
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && entry.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }
  return { blocked: false, retryAfterSeconds: 0 };
}

export function registerFailure(key: string): void {
  const now = Date.now();
  let entry = attempts.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { count: 0, windowStart: now, blockedUntil: 0 };
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
  }
  attempts.set(key, entry);
  prune(now);
}

export function registerSuccess(key: string): void {
  attempts.delete(key);
}

// Evita que el Map crezca sin límite: quita lo ya caducado (ni
// bloqueado ni dentro de la ventana de conteo).
function prune(now: number): void {
  for (const [k, v] of attempts) {
    if (v.blockedUntil < now && now - v.windowStart > WINDOW_MS) {
      attempts.delete(k);
    }
  }
}
