// Hash determinista de una cadena a un número en [0, 1). Con la misma
// semilla (ej. el id de una foto) siempre da el mismo valor, para que
// variaciones "aleatorias" por elemento no cambien entre renders.
export function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 10000) / 10000;
}
