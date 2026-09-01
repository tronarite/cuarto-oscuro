import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { isAdminAuthed } from "@/lib/admin-auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackToTopButton } from "@/components/BackToTopButton";

export default async function AboutPage() {
  const [settings, admin] = await Promise.all([getSettings(), isAdminAuthed()]);

  // Desactivada: nadie salvo el admin (que puede querer verla antes de
  // reactivarla) puede entrar, ni siquiera con el enlace directo.
  if (!settings.aboutEnabled && !admin) notFound();

  return (
    <main className="relative">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight transition-colors hover:text-muted-foreground"
          >
            ← {settings.siteTitle}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-16">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Sobre mí
        </h1>

        <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-start">
          <div className="md:flex-1">
            {settings.aboutText ? (
              <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                {settings.aboutText}
              </p>
            ) : (
              <p className="text-muted-foreground">Todavía no hay descripción.</p>
            )}
          </div>

          {settings.aboutPhotoPath && (
            <div
              className="mx-auto w-full max-w-md shrink-0 overflow-hidden rounded-2xl bg-surface md:mx-0 md:w-80"
              style={
                settings.aboutPhotoWidth && settings.aboutPhotoHeight
                  ? {
                      aspectRatio: `${settings.aboutPhotoWidth} / ${settings.aboutPhotoHeight}`,
                    }
                  : undefined
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/api/img/about"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>
      </div>

      <BackToTopButton />
    </main>
  );
}
