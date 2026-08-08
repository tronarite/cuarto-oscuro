import Link from "next/link";

export interface RailPhoto {
  id: string;
  gallerySlug: string;
  width: number | null;
  height: number | null;
}

export function FeaturedRail({
  photos,
  direction,
  className = "",
}: {
  photos: RailPhoto[];
  direction: "up" | "down";
  className?: string;
}) {
  if (photos.length === 0) return null;

  const animationClass = direction === "up" ? "animate-rail-up" : "animate-rail-down";

  return (
    <div className={`pointer-events-none overflow-hidden ${className}`}>
      <div className={`flex flex-col gap-4 ${animationClass}`}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex flex-col gap-4" aria-hidden={copy === 1}>
            {photos.map((photo) => (
              <Link
                key={`${copy}-${photo.id}`}
                href={`/galeria/${photo.gallerySlug}`}
                style={{
                  aspectRatio:
                    photo.width && photo.height
                      ? `${photo.width} / ${photo.height}`
                      : "3 / 4",
                }}
                className="pointer-events-auto block w-full overflow-hidden rounded-xl bg-surface"
                tabIndex={copy === 1 ? -1 : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/img/thumb/${photo.id}`}
                  alt=""
                  draggable={false}
                  className="h-full w-full select-none object-cover"
                />
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
