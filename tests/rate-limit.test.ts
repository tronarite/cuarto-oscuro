import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  registerFailure,
  registerSuccess,
} from "@/lib/rate-limit";

// El módulo guarda el estado en un Map a nivel de módulo. Cada test usa
// una clave distinta para no pisarse con los demás.
let n = 0;
const freshKey = () => `test-key-${n++}`;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rate limit de login", () => {
  it("no bloquea antes de agotar los intentos", () => {
    const key = freshKey();
    for (let i = 0; i < 4; i++) registerFailure(key);
    expect(checkRateLimit(key).blocked).toBe(false);
  });

  it("bloquea al quinto fallo y devuelve un retryAfter positivo", () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) registerFailure(key);
    const state = checkRateLimit(key);
    expect(state.blocked).toBe(true);
    expect(state.retryAfterSeconds).toBeGreaterThan(0);
    expect(state.retryAfterSeconds).toBeLessThanOrEqual(15 * 60);
  });

  it("deja de bloquear una vez pasada la ventana de 15 min", () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) registerFailure(key);
    expect(checkRateLimit(key).blocked).toBe(true);
    vi.advanceTimersByTime(15 * 60 * 1000 + 1000);
    expect(checkRateLimit(key).blocked).toBe(false);
  });

  it("un acierto limpia los fallos acumulados", () => {
    const key = freshKey();
    for (let i = 0; i < 4; i++) registerFailure(key);
    registerSuccess(key);
    registerFailure(key);
    expect(checkRateLimit(key).blocked).toBe(false);
  });

  it("los fallos viejos no cuentan para el bloqueo", () => {
    const key = freshKey();
    for (let i = 0; i < 3; i++) registerFailure(key);
    vi.advanceTimersByTime(16 * 60 * 1000);
    for (let i = 0; i < 4; i++) registerFailure(key);
    expect(checkRateLimit(key).blocked).toBe(false);
  });
});
