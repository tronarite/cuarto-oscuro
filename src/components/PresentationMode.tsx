"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { exifLine } from "@/lib/exif-format";
import type { GalleryPhoto } from "@/components/GalleryView";

const SLIDE_DURATION_MS = 6000;

export function PresentationMode({
  photos,
  startId,
  onClose,
}: {
  photos: GalleryPhoto[];
  startId?: string | null;
  onClose: () => void;
}) {
  const startIndex = Math.max(
    0,
    photos.findIndex((p) => p.id === startId),
  );
  const [index, setIndex] = useState(startIndex === -1 ? 0 : startIndex);
  const [playing, setPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    containerRef.current?.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) onClose();
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [onClose]);

  useEffect(() => {
    if (!playing || photos.length <= 1) return;
    const id = setInterval(next, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, [playing, next, photos.length]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, prev, onClose]);

  const photo = photos[index];
  if (!photo) return null;
  const specs = exifLine(photo);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="flex h-full w-full flex-col items-center justify-center gap-4 p-8"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/img/display/${photo.id}`}
            alt={photo.description ?? ""}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="max-h-[85vh] max-w-full select-none object-contain"
          />
          {(photo.description || specs.length > 0) && (
            <div className="text-center text-neutral-300">
              {photo.description && <p className="text-sm">{photo.description}</p>}
              {specs.length > 0 && (
                <p className="mt-1 text-xs text-neutral-500">{specs.join(" · ")}</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
        <span className="text-xs text-neutral-500">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-neutral-400 transition-all hover:text-neutral-100 active:scale-90"
        >
          salir ✕
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-6 p-6">
        <button
          type="button"
          onClick={prev}
          className="text-neutral-400 transition-all hover:text-neutral-100 active:scale-90"
          aria-label="Anterior"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="text-sm text-neutral-400 transition-all hover:text-neutral-100 active:scale-95"
        >
          {playing ? "pausa" : "reanudar"}
        </button>
        <button
          type="button"
          onClick={next}
          className="text-neutral-400 transition-all hover:text-neutral-100 active:scale-90"
          aria-label="Siguiente"
        >
          →
        </button>
      </div>
    </div>
  );
}
