export function UnderConstructionBanner() {
  return (
    <div
      role="status"
      className="border-b border-border bg-surface px-4 py-1.5 text-center text-xs text-muted-foreground"
    >
      Esta web todavía está en construcción: algunas cosas pueden cambiar o
      no funcionar del todo.
    </div>
  );
}
