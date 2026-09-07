"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MasonryGrid, type MasonryItem } from "@/components/MasonryGrid";
import { exifLine, type ExifSource } from "@/lib/exif-format";
import { seededRandom } from "@/lib/seeded-random";
import { slotSizeForIndex, type GalleryLayout } from "@/lib/grid-templates";
import { applyPinning } from "@/lib/photo-order";
import { PresentationMode } from "@/components/PresentationMode";

export interface GalleryPhoto extends ExifSource {
  id: string;
  order: number;
  pinnedPosition: number | null;
  width: number | null;
  height: number | null;
  description: string | null;
}

type LaidOutPhoto = GalleryPhoto & MasonryItem;

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

function Tile({
  photo,
  onOpen,
}: {
  photo: LaidOutPhoto;
  onOpen: (id: string) => void;
}) {
  const specs = exifLine(photo);
  const hasCaption = Boolean(photo.description) || specs.length > 0;

  // Variación "aleatoria" pero estable por foto (misma semilla = mismo
  // valor siempre) para que cada foto entre a su aire, no todas en fila
  // ni con el mismo ritmo: además del delay, la propia duración varía un
  // poco por foto, como si cada una "llegara" a su paso.
  const rSpin = seededRandom(`${photo.id}-r`);
  const rDrift = seededRandom(`${photo.id}-x`);
  const rDelay = seededRandom(`${photo.id}-d`);
  const rDuration = seededRandom(`${photo.id}-t`);
  const rotate = (rSpin - 0.5) * 5; // -2.5° a 2.5°
  const x = (rDrift - 0.5) * 20; // -10px a 10px
  const y = 22 + rDrift * 18; // 22-40px

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(photo.id)}
      initial={{ opacity: 0, y, x, rotate, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
      whileTap={{ scale: 0.96 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        // Desaceleración tipo "ease-out" suave en vez de un muelle con
        // rebote: se siente como algo que se posa, no como algo que
        // salta y oscila igual en cada foto.
        ease: [0.16, 1, 0.3, 1],
        duration: 0.55 + rDuration * 0.35,
        delay: rDelay * 0.25,
      }}
      className="group relative block h-full w-full overflow-hidden rounded-[var(--photo-radius)] bg-surface"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/img/thumb/${photo.id}`}
        alt={photo.description ?? ""}
        draggable={false}
        loading="lazy"
        decoding="async"
        onContextMenu={(e) => e.preventDefault()}
        className="h-full w-full select-none object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      {hasCaption && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 pt-10 text-left">
          {photo.description && (
            <p className="truncate text-sm font-medium text-white">
              {photo.description}
            </p>
          )}
          {specs.length > 0 && (
            <p className="mt-0.5 text-[11px] text-white/70">{specs.join(" · ")}</p>
          )}
        </div>
      )}
    </motion.button>
  );
}

export function GalleryView({
  photos,
  layout,
}: {
  photos: GalleryPhoto[];
  layout: GalleryLayout;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const openPhoto = photos.find((p) => p.id === openId) ?? null;
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const ordered: LaidOutPhoto[] = applyPinning(photos).map((photo, i) => ({
    ...photo,
    slotSize: slotSizeForIndex(layout, i),
  }));
  const currentIndex = openId ? ordered.findIndex((p) => p.id === openId) : -1;

  function closeLightbox() {
    setOpenId(null);
  }

  // Ir a la foto siguiente/anterior dentro del mismo orden del mosaico,
  // dando la vuelta al llegar a un extremo.
  function goToOffset(offset: number) {
    if (ordered.length === 0) return;
    const currentIndex = ordered.findIndex((p) => p.id === openId);
    if (currentIndex === -1) return;
    const nextIndex =
      (currentIndex + offset + ordered.length) % ordered.length;
    setOpenId(ordered[nextIndex].id);
  }

  const goNext = () => goToOffset(1);
  const goPrev = () => goToOffset(-1);

  useEffect(() => {
    if (!openPhoto) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPhoto, openId]);

  const SWIPE_THRESHOLD = 50;

  function handleSwipeStart(e: React.PointerEvent) {
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  }

  function handleSwipeEnd(e: React.PointerEvent) {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goPrev();
      else goNext();
    }
  }

  return (
    <>
      {photos.length > 0 && (
        <div className="mx-auto mb-6 hidden max-w-[1180px] justify-end sm:flex">
          <button
            type="button"
            onClick={() => setPresenting(true)}
            className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground transition-all hover:border-accent hover:text-accent active:scale-95"
          >
            Modo presentación
          </button>
        </div>
      )}

      <div className="mx-auto max-w-[1180px]">
        <MasonryGrid
          items={ordered}
          renderItem={(photo) => <Tile photo={photo} onOpen={setOpenId} />}
        />
      </div>

      {presenting && (
        <PresentationMode photos={ordered} onClose={() => setPresenting(false)} />
      )}

      {openPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={closeLightbox}
        >
          <div
            className="relative h-full w-full"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handleSwipeStart}
            onPointerUp={handleSwipeEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/img/display/${openPhoto.id}`}
              alt={openPhoto.description ?? ""}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="h-full w-full select-none object-contain"
            />
            {ordered.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Foto anterior"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90"
                >
                  <ChevronIcon direction="left" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Foto siguiente"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90"
                >
                  <ChevronIcon direction="right" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90"
            >
              cerrar ✕
            </button>
            {ordered.length > 1 && currentIndex !== -1 && (
              <p className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm">
                {currentIndex + 1} / {ordered.length}
              </p>
            )}
            {(openPhoto.description || exifLine(openPhoto).length > 0) && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-16 sm:p-6 sm:pt-24">
                {openPhoto.description && (
                  <p className="text-base text-white">{openPhoto.description}</p>
                )}
                {exifLine(openPhoto).length > 0 && (
                  <p className="mt-1 text-sm text-white/70">
                    {exifLine(openPhoto).join(" · ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
