// Mismo dibujo que el favicon (src/app/icon.svg): la flor de 5 pétalos
// con centro dorado, para que esa marca no viva solo en la pestaña del
// navegador sino también en la propia web.
export function FlowerMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="23" cy="16" r="6.5" fill="#ec4899" />
      <circle cx="18.2" cy="22.7" r="6.5" fill="#ec4899" />
      <circle cx="10.3" cy="20.1" r="6.5" fill="#ec4899" />
      <circle cx="10.3" cy="11.9" r="6.5" fill="#ec4899" />
      <circle cx="18.2" cy="9.3" r="6.5" fill="#ec4899" />
      <circle cx="16" cy="16" r="4.5" fill="#fbbf24" />
    </svg>
  );
}
