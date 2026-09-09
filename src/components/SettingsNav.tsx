"use client";

// Enlaces de ancla a los grupos de Ajustes. Un <Link href="#id"> normal
// cambia la URL pero, al ser una navegación dentro de la misma ruta (sin
// recarga), el navegador no hace scroll solo hasta el elemento — hace
// falta pedirlo a mano.
export function SettingsNav({
  groups,
}: {
  groups: { id: string; label: string }[];
}) {
  return (
    <nav className="mt-4 flex flex-wrap gap-2">
      {groups.map((group) => (
        <button
          key={group.id}
          type="button"
          onClick={() => {
            document
              .getElementById(group.id)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
            history.replaceState(null, "", `#${group.id}`);
          }}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        >
          {group.label}
        </button>
      ))}
    </nav>
  );
}
