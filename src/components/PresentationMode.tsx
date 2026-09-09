"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { exifLine } from "@/lib/exif-format";
import { ChevronIcon } from "@/components/icons";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import type { WatermarkDisplaySettings } from "@/lib/watermark-svg";
import type { GalleryPhoto } from "@/components/GalleryView";

const SLIDE_DURATION_MS = 6000;

export function PresentationMode({
  photos,
  startId,
  watermark,
  onClose,
}: {
  photos: GalleryPhoto[];
  startId?: string | null;
  watermark: WatermarkDisplaySettings;
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
    <div ref={containerRef} className="fixed inset-0 z-[60] overflow-hidden bg-black">
      {/* Mismo estilo "ventana completa" que el visor normal
          (GalleryView.tsx): la foto llena toda la pantalla y los
          controles flotan encima como píldoras traslúcidas, en vez de
          barras fijas de cabecera/pie que le restan alto a la imagen. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/img/display/${photo.id}`}
            alt={photo.description ?? ""}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="h-full w-full select-none object-contain"
          />
          <WatermarkOverlay watermark={watermark} width={photo.width} height={photo.height} />
        </motion.div>
      </AnimatePresence>

      <p className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm">
        {index + 1} / {photos.length}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90"
      >
        salir ✕
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90"
          >
            <ChevronIcon direction="right" />
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-95"
      >
        {playing ? "pausa" : "reanudar"}
      </button>

      {(photo.description || specs.length > 0) && (
        <div
          className="absolute inset-x-4 bottom-16 flex justify-center sm:bottom-20"
          // Mismo motivo que en GalleryView.tsx: sin esto, seleccionar el
          // texto compite con los atajos de teclado/clicks del visor.
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-xs select-text rounded-xl bg-black/40 px-3 py-1.5 text-center backdrop-blur-sm">
            {photo.description && <p className="text-sm text-white">{photo.description}</p>}
            {specs.length > 0 && (
              <p className="mt-0.5 text-xs text-white/70">{specs.join(" · ")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
