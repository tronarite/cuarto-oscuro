import Link from "next/link";
import type { GallerySuggestion } from "@/lib/gallery-suggestions";

export function GallerySuggestions({
  galleries,
  heading = "Puede que también te guste",
}: {
  galleries: GallerySuggestion[];
  heading?: string;
}) {
  if (galleries.length === 0) return null;

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <h2 className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
        {heading}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {galleries.map((suggested) => {
          const cover = suggested.photos[0];
          return (
            <Link
              key={suggested.id}
              href={`/galeria/${suggested.slug}`}
              className="group block overflow-hidden rounded-2xl bg-surface"
            >
              <div
                className="w-full overflow-hidden"
                style={{
                  aspectRatio:
                    cover?.width && cover?.height
                      ? `${cover.width} / ${cover.height}`
                      : "16 / 9",
                }}
              >
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/img/thumb/${cover.id}`}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full select-none object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Sin fotos
                  </div>
                )}
              </div>
              <p className="px-4 py-3 text-lg font-medium tracking-tight transition-colors group-hover:text-accent">
                {suggested.title}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
