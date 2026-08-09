"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";

export interface RailPhoto {
  id: string;
  gallerySlug: string;
  width: number | null;
  height: number | null;
}

export type RailOrientation = "vertical" | "horizontal";

// Píxeles por segundo: fija la velocidad de desplazamiento en vez de una
// duración fija, para que no varíe según cuántas fotos destacadas haya
// (ni según la orientación).
const SPEED_PX_PER_SECOND = 45;

function RailPhotoCard({
  photo,
  orientation,
  hidden,
}: {
  photo: RailPhoto;
  orientation: RailOrientation;
  hidden?: boolean;
}) {
  return (
    <Link
      href={`/galeria/${photo.gallerySlug}`}
      style={{
        aspectRatio:
          photo.width && photo.height
            ? `${photo.width} / ${photo.height}`
            : "4 / 3",
      }}
      className={`pointer-events-auto block shrink-0 overflow-hidden rounded-2xl bg-surface shadow-sm ${
        orientation === "vertical" ? "w-full" : "h-full"
      }`}
      tabIndex={hidden ? -1 : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/img/thumb/${photo.id}`}
        alt=""
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
    </Link>
  );
}

export function FeaturedRail({
  photos,
  className = "",
  orientation = "vertical",
}: {
  photos: RailPhoto[];
  className?: string;
  orientation?: RailOrientation;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [repeat, setRepeat] = useState(1);
  const [duration, setDuration] = useState(42);

  const vertical = orientation === "vertical";

  // El bucle sin costuras necesita que una sola "copia" del contenido
  // sea al menos tan larga (alta o ancha, según la orientación) como el
  // hueco visible; si hay pocas fotos destacadas, se repiten las
  // necesarias para que nunca quede una franja vacía a los lados.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const set = setRef.current;
    if (!container || !set || photos.length === 0) return;

    function measure() {
      const containerSize = vertical
        ? container!.clientHeight
        : container!.clientWidth;
      const setSize = vertical ? set!.scrollHeight : set!.scrollWidth;
      if (setSize === 0 || containerSize === 0) return;
      const needed = Math.max(1, Math.ceil(containerSize / setSize) + 1);
      setRepeat(needed);
      setDuration((needed * setSize) / SPEED_PX_PER_SECOND);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [photos, vertical]);

  if (photos.length === 0) return null;

  const flexDir = vertical ? "flex-col" : "flex-row";
  const animationName = vertical ? "rail-up" : "rail-left";

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none overflow-hidden ${className}`}
    >
      <div
        className={`flex ${flexDir} items-center gap-6`}
        style={{
          animation: `${animationName} ${duration}s linear infinite`,
        }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className={`flex ${flexDir} items-center gap-6`}>
            {Array.from({ length: repeat }).map((_, rep) => (
              <div
                key={rep}
                ref={copy === 0 && rep === 0 ? setRef : undefined}
                className={`flex ${flexDir} items-center gap-6`}
              >
                {photos.map((photo) => (
                  <RailPhotoCard
                    key={`${copy}-${rep}-${photo.id}`}
                    photo={photo}
                    orientation={orientation}
                    hidden={copy === 1}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
