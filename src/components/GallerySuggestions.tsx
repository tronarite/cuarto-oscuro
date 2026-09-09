import Link from "next/link";
import type { GallerySuggestion } from "@/lib/gallery-suggestions";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import type { WatermarkDisplaySettings } from "@/lib/watermark-svg";

export function GallerySuggestions({
  galleries,
  watermark,
  heading = "Puede que también te guste",
}: {
  galleries: GallerySuggestion[];
  watermark: WatermarkDisplaySettings;
  heading?: string;
}) {
  if (galleries.length === 0) return null;

  return (
    // Mismo ancho que la cuadrícula de fotos (GalleryView.tsx), no el más
    // estrecho de la cabecera/título: si no, los bordes de esta sección
    // quedan más adentro que los de la propia galería justo encima.
    <div className="mx-auto max-w-[1180px] px-6 pb-24">
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
              className="group block overflow-hidden rounded-[var(--photo-radius)] bg-surface"
            >
              <div
                className="relative w-full overflow-hidden"
                style={{
                  aspectRatio:
                    cover?.width && cover?.height
                      ? `${cover.width} / ${cover.height}`
                      : "16 / 9",
                }}
              >
                {cover ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/img/thumb/${cover.id}`}
                      alt=""
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full select-none object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                    <WatermarkOverlay
                      watermark={watermark}
                      width={cover.width}
                      height={cover.height}
                    />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Sin fotos
                  </div>
                )}
              </div>
              <p className="font-display px-4 py-3 text-lg font-medium tracking-tight transition-colors group-hover:text-accent">
                {suggested.title}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
