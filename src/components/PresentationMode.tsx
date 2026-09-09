"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { exifLine } from "@/lib/exif-format";
import { ChevronIcon, ExpandIcon } from "@/components/icons";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import type { WatermarkDisplaySettings } from "@/lib/watermark-svg";
import type { GalleryPhoto } from "@/components/GalleryView";
import { useAutoHideControls } from "@/lib/use-auto-hide-controls";

const SLIDE_DURATION_MS = 6000;

export function PresentationMode({
  photos,
  startId,
  watermark,
  fillMode,
  onToggleFillMode,
  onClose,
}: {
  photos: GalleryPhoto[];
  startId?: string | null;
  watermark: WatermarkDisplaySettings;
  // Ver fillMode en GalleryView.tsx: se controla desde ahí para que el
  // ajuste sea el mismo si se pasa del visor de una foto a presentación
  // (o al revés) y entre visitas.
  fillMode: boolean;
  onToggleFillMode: () => void;
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

  // Controles tipo YouTube: se ven al entrar/mover el ratón y se ocultan
  // solos tras un momento quieto — mismo hook que en GalleryView.tsx. El
  // pie de foto tiene su propio ciclo aparte: al pasar de foto (con las
  // flechas, el teclado o el avance automático, sin haber tocado el
  // ratón) solo debe "saltar" el pie de foto, no todos los botones — si
  // estos ya estaban ocultos por inactividad, se quedan así.
  const { visible: controlsVisible, onMouseMove: showControls } =
    useAutoHideControls();
  const controlsFade = `transition-opacity duration-300 ${
    controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
  }`;
  const { visible: captionVisible, onMouseMove: showCaption } =
    useAutoHideControls(photo?.id);
  const captionFade = `transition-opacity duration-300 ${
    captionVisible ? "opacity-100" : "pointer-events-none opacity-0"
  }`;

  function handlePointerActivity() {
    showControls();
    showCaption();
  }

  if (!photo) return null;
  const specs = exifLine(photo);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] overflow-hidden bg-black"
      onMouseMove={handlePointerActivity}
    >
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
            className={`h-full w-full select-none ${
              fillMode ? "object-cover" : "object-contain"
            }`}
          />
          <WatermarkOverlay
            watermark={watermark}
            width={photo.width}
            height={photo.height}
            fit={fillMode ? "cover" : "contain"}
          />
        </motion.div>
      </AnimatePresence>

      <div className={`absolute left-4 top-4 flex items-center gap-2 ${controlsFade}`}>
        <button
          type="button"
          onClick={onToggleFillMode}
          aria-label={
            fillMode ? "Ajustar la foto a la pantalla" : "Ampliar hasta llenar la pantalla"
          }
          title={fillMode ? "Ajustar la foto a la pantalla" : "Ampliar hasta llenar la pantalla"}
          className={`rounded-full p-2 backdrop-blur-sm transition-all active:scale-90 ${
            fillMode
              ? "bg-white text-black"
              : "bg-black/50 text-white/80 hover:bg-black/70 hover:text-accent"
          }`}
        >
          <ExpandIcon />
        </button>
        {photos.length > 1 && (
          <p className="rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm">
            {index + 1} / {photos.length}
          </p>
        )}
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-95"
        >
          {playing ? "pausa" : "reanudar"}
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={`absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90 ${controlsFade}`}
      >
        salir ✕
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className={`absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90 ${controlsFade}`}
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Siguiente"
            className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90 ${controlsFade}`}
          >
            <ChevronIcon direction="right" />
          </button>
        </>
      )}

      {(photo.description || specs.length > 0) && (
        <div
          className={`absolute bottom-4 left-4 max-w-xs select-text rounded-xl bg-black/40 px-3 py-1.5 text-left backdrop-blur-sm ${captionFade}`}
          // Mismo motivo que en GalleryView.tsx: sin esto, seleccionar el
          // texto compite con los atajos de teclado/clicks del visor.
          onClick={(e) => e.stopPropagation()}
        >
          {photo.description && <p className="text-sm text-white">{photo.description}</p>}
          {specs.length > 0 && (
            <p className="mt-0.5 text-xs text-white/70">{specs.join(" · ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
