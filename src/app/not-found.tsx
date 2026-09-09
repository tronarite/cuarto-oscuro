import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { toWatermarkDisplaySettings } from "@/lib/watermark-svg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GallerySuggestions } from "@/components/GallerySuggestions";
import { BackHomeLink } from "@/components/BackHomeLink";
import { getGallerySuggestions } from "@/lib/gallery-suggestions";

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5"
    >
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

// Reemplaza la 404 en blanco por defecto de Next.js: se dispara con
// notFound() (galería inexistente, "Sobre mí" desactivada) o con
// cualquier URL que no coincida con ninguna ruta.
export default async function NotFound() {
  const [settings, suggestions] = await Promise.all([
    getSettings(),
    getGallerySuggestions(undefined, 2),
  ]);
  const watermark = toWatermarkDisplaySettings(settings);

  return (
    <main className="relative">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <BackHomeLink siteTitle={settings.siteTitle} />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center sm:pb-24">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          404
        </p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Esta página no existe
        </h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-muted-foreground">
          Puede que el enlace esté roto o que la galería ya no esté
          disponible.
        </p>
        <Link
          href="/"
          className="group mt-8 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm transition-all hover:border-accent hover:text-accent active:scale-95"
        >
          Volver al inicio
          <ArrowRightIcon />
        </Link>
      </div>

      <GallerySuggestions
        galleries={suggestions}
        watermark={watermark}
        heading="Mientras tanto, quizá te interese alguna de estas"
      />
    </main>
  );
}
