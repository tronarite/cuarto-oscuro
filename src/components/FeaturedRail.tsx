import Link from "next/link";

export interface RailPhoto {
  id: string;
  gallerySlug: string;
  width: number | null;
  height: number | null;
}

export function FeaturedRail({
  photos,
  className = "",
}: {
  photos: RailPhoto[];
  className?: string;
}) {
  if (photos.length === 0) return null;

  return (
    <div className={`pointer-events-none overflow-hidden ${className}`}>
      <div className="animate-rail-up flex flex-col items-center gap-6">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex flex-col items-center gap-6"
            aria-hidden={copy === 1}
          >
            {photos.map((photo) => (
              <Link
                key={`${copy}-${photo.id}`}
                href={`/galeria/${photo.gallerySlug}`}
                style={{
                  aspectRatio:
                    photo.width && photo.height
                      ? `${photo.width} / ${photo.height}`
                      : "4 / 3",
                }}
                className="pointer-events-auto block w-full shrink-0 overflow-hidden rounded-2xl bg-surface shadow-sm"
                tabIndex={copy === 1 ? -1 : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/img/thumb/${photo.id}`}
                  alt=""
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                />
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
