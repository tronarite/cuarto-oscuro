"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MasonryGrid, type MasonryItem } from "@/components/MasonryGrid";
import { exifLine, type ExifSource } from "@/lib/exif-format";
import { seededRandom } from "@/lib/seeded-random";
import { slotSizeForIndex, type GalleryLayout } from "@/lib/grid-templates";
import { applyPinning } from "@/lib/photo-order";
import { PresentationMode } from "@/components/PresentationMode";
import { ChevronIcon, ExpandIcon } from "@/components/icons";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import type { WatermarkDisplaySettings } from "@/lib/watermark-svg";
import { useAutoHideControls } from "@/lib/use-auto-hide-controls";

// Preferencia de "ampliar hasta llenar la pantalla" (object-cover, sin
// franjas negras, recortando lo que sobre) — compartida a propósito
// entre el visor de una foto y el modo presentación (se pasa a
// PresentationMode como prop): alternar en uno se nota en el otro, y se
// recuerda entre visitas.
const FILL_MODE_KEY = "cuarto-oscuro:photo-fill-mode";

function readFillMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FILL_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export interface GalleryPhoto extends ExifSource {
  id: string;
  order: number;
  pinnedPosition: number | null;
  width: number | null;
  height: number | null;
  description: string | null;
}

type LaidOutPhoto = GalleryPhoto & MasonryItem;

// Cuántas fotos se montan de entrada y cuántas se añaden cada vez que
// se llega cerca del final: bajar rápido por una galería con decenas de
// fotos ya no dispara la descarga+decodificación de todas a la vez,
// solo de las que realmente hace falta ver.
const INITIAL_VISIBLE = 24;
const LOAD_MORE_BATCH = 18;

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DOUBLE_CLICK_ZOOM = 2.5;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function Tile({
  photo,
  watermark,
  onOpen,
}: {
  photo: LaidOutPhoto;
  watermark: WatermarkDisplaySettings;
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
      <WatermarkOverlay watermark={watermark} width={photo.width} height={photo.height} />
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
  watermark,
}: {
  photos: GalleryPhoto[];
  layout: GalleryLayout;
  watermark: WatermarkDisplaySettings;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const openPhoto = photos.find((p) => p.id === openId) ?? null;
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const [fillMode, setFillMode] = useState(readFillMode);
  function toggleFillMode() {
    setFillMode((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(FILL_MODE_KEY, next ? "1" : "0");
      } catch {
        // Sin localStorage (privado, cuota...) el ajuste simplemente no
        // sobrevive a esta sesión — no es motivo para romper el toggle.
      }
      return next;
    });
  }

  // Controles del visor (flechas, cerrar, caption...) tipo YouTube: se
  // ven al abrir/mover el ratón y se ocultan solos tras un momento quieto.
  const { visible: controlsVisible, onMouseMove: showControls } =
    useAutoHideControls(openId);
  const controlsFade = `transition-opacity duration-300 ${
    controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
  }`;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const ordered: LaidOutPhoto[] = applyPinning(photos).map((photo, i) => ({
    ...photo,
    slotSize: slotSizeForIndex(layout, i),
  }));
  const currentIndex = openId ? ordered.findIndex((p) => p.id === openId) : -1;

  // Carga incremental: solo se monta un lote de fotos al principio, y se
  // amplía al acercarse al final del mosaico ya renderizado. No afecta
  // al visor: la navegación siguiente/anterior sigue recorriendo
  // `ordered` completo, tenga o no ya su <img> montada en la cuadrícula.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((count) =>
            Math.min(count + LOAD_MORE_BATCH, ordered.length),
          );
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ordered.length]);

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

  // El zoom/paneo es por foto: cambiar de foto (o cerrar) siempre arranca
  // en 1x centrado. Se ajusta durante el render (no en un efecto aparte)
  // siguiendo el patrón de React para "resetear estado cuando cambia
  // otro valor": https://react.dev/learn/you-might-not-need-an-effect
  const [zoomResetKey, setZoomResetKey] = useState(openId);
  if (openId !== zoomResetKey) {
    setZoomResetKey(openId);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

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

  function toggleZoom() {
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(DOUBLE_CLICK_ZOOM);
    }
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const next = clamp(zoom - e.deltaY * 0.0015, MIN_ZOOM, MAX_ZOOM);
    setZoom(next);
    if (next === 1) setPan({ x: 0, y: 0 });
  }

  function handlePointerDown(e: React.PointerEvent) {
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
    if (zoom > 1) {
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const start = panStartRef.current;
    if (!start || zoom <= 1) return;
    // Se divide por zoom: el translate se aplica en el espacio SIN
    // escalar (scale() envuelve a translate() en la misma transform),
    // así que hay que compensar para que el arrastre siga al puntero 1:1.
    const dx = (e.clientX - start.x) / zoom;
    const dy = (e.clientY - start.y) / zoom;
    setPan({ x: start.panX + dx, y: start.panY + dy });
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (zoom > 1) {
      // Con zoom activo, arrastrar solo hace paneo — no cambia de foto.
      panStartRef.current = null;
      return;
    }
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
          items={ordered.slice(0, visibleCount)}
          renderItem={(photo) => (
            <Tile photo={photo} watermark={watermark} onOpen={setOpenId} />
          )}
        />
        <div ref={sentinelRef} aria-hidden className="h-1" />
      </div>

      {presenting && (
        <PresentationMode
          photos={ordered}
          watermark={watermark}
          fillMode={fillMode}
          onToggleFillMode={toggleFillMode}
          onClose={() => setPresenting(false)}
        />
      )}

      {openPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={closeLightbox}
          onMouseMove={showControls}
        >
          <div
            className="relative h-full w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={toggleZoom}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* La marca superpuesta va en el mismo div transformado que la
                foto (no como hermana suelta): así se mueve/escala pegada
                a la imagen durante el zoom/pan, en vez de quedarse fija
                mientras la foto se desplaza debajo. */}
            <div
              style={{
                transform:
                  zoom > 1 ? `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` : undefined,
              }}
              className={`relative h-full w-full transition-transform duration-200 ease-out ${
                zoom > 1 ? "cursor-grab" : "cursor-zoom-in"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/img/display/${openPhoto.id}`}
                alt={openPhoto.description ?? ""}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className={`h-full w-full select-none ${
                  fillMode ? "object-cover" : "object-contain"
                }`}
              />
              <WatermarkOverlay
                watermark={watermark}
                width={openPhoto.width}
                height={openPhoto.height}
                fit={fillMode ? "cover" : "contain"}
              />
            </div>
            {ordered.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Foto anterior"
                  className={`absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90 ${controlsFade}`}
                >
                  <ChevronIcon direction="left" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Foto siguiente"
                  className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90 ${controlsFade}`}
                >
                  <ChevronIcon direction="right" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={toggleFillMode}
              aria-label={
                fillMode ? "Ajustar la foto a la pantalla" : "Ampliar hasta llenar la pantalla"
              }
              title={fillMode ? "Ajustar la foto a la pantalla" : "Ampliar hasta llenar la pantalla"}
              className={`absolute left-4 top-4 rounded-full p-2 backdrop-blur-sm transition-all active:scale-90 ${controlsFade} ${
                fillMode
                  ? "bg-white text-black"
                  : "bg-black/50 text-white/80 hover:bg-black/70 hover:text-accent"
              }`}
            >
              <ExpandIcon />
            </button>
            <button
              type="button"
              onClick={closeLightbox}
              className={`absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-accent active:scale-90 ${controlsFade}`}
            >
              cerrar ✕
            </button>
            {ordered.length > 1 && currentIndex !== -1 && (
              <p
                className={`absolute left-16 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm ${controlsFade}`}
              >
                {currentIndex + 1} / {ordered.length}
              </p>
            )}
            {(openPhoto.description || exifLine(openPhoto).length > 0) && (
              <div
                className={`absolute inset-x-4 bottom-3 flex justify-center sm:bottom-4 ${controlsFade}`}
                // El resto del visor tiene gestos de zoom/pan colgados de
                // este mismo contenedor (onDoubleClick, onWheel,
                // onPointerDown): sin frenarlos aquí, cualquier intento de
                // seleccionar el texto (doble click para elegir palabra,
                // rueda al hacer scroll para leer) dispara el zoom en vez
                // de dejar seleccionar/copiar el texto.
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {/* Difuminado solo detrás de este cuadro (backdrop-blur,
                    no una copia de la foto) para que el texto siga
                    legible aunque la zona de la foto donde cae sea
                    clara o muy detallada — mismo backdrop-blur-sm ya
                    usado en los botones de cerrar/anterior/siguiente,
                    barato porque solo cubre esta caja pequeña. */}
                <div className="max-w-xs select-text rounded-xl bg-black/40 px-3 py-1.5 text-center backdrop-blur-sm">
                  {openPhoto.description && (
                    <p className="text-sm text-white">{openPhoto.description}</p>
                  )}
                  {exifLine(openPhoto).length > 0 && (
                    <p className="mt-0.5 text-xs text-white/70">
                      {exifLine(openPhoto).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
