"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const PRIVACY_LABEL: Record<string, string> = {
  PUBLIC: "Pública",
  UNLISTED: "Enlace no listado",
  PASSWORD: "Con contraseña",
};

export interface GalleryCardData {
  id: string;
  title: string;
  privacy: string;
  visitCount: number;
  createdAt: Date;
  _count: { photos: number };
  photos: { id: string }[];
}

type SortMode = "custom" | "recent" | "alpha" | "visits";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "custom", label: "Personalizado" },
  { value: "recent", label: "Más recientes" },
  { value: "alpha", label: "Alfabético" },
  { value: "visits", label: "Más visitadas" },
];

interface GalleryGridProps {
  galleries: GalleryCardData[];
  onReorder: (orderedIds: string[]) => Promise<void>;
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <circle cx="5" cy="3" r="1.3" />
      <circle cx="11" cy="3" r="1.3" />
      <circle cx="5" cy="8" r="1.3" />
      <circle cx="11" cy="8" r="1.3" />
      <circle cx="5" cy="13" r="1.3" />
      <circle cx="11" cy="13" r="1.3" />
    </svg>
  );
}

export function GalleryGrid({ galleries, onReorder }: GalleryGridProps) {
  const [order, setOrder] = useState(galleries.map((g) => g.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // "Personalizado" es el único que se guarda (es el orden real que ve
  // cualquier visitante en la portada, vía arrastrar). Los demás son
  // solo para encontrar una galería rápido en este panel — no tocan ese
  // orden, así que cambiar de vista y volver a "Personalizado" lo deja
  // exactamente como estaba.
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const isCustom = sortMode === "custom";

  // Auto-scroll de la ventana mientras se arrastra una galería cerca del
  // borde superior/inferior, igual que al reordenar fotos dentro de una
  // galería: permite llevar una tarjeta de arriba del todo hasta abajo
  // (o al revés) sin soltar.
  useEffect(() => {
    if (!draggingId) return;

    const EDGE = 120;
    const MAX_SPEED = 22;
    let pointerY = 0;
    let rafId: number;

    function onDragOver(e: DragEvent) {
      pointerY = e.clientY;
    }

    function tick() {
      const vh = window.innerHeight;
      if (pointerY > 0 && pointerY < EDGE) {
        window.scrollBy(0, -MAX_SPEED * ((EDGE - pointerY) / EDGE));
      } else if (pointerY > vh - EDGE) {
        window.scrollBy(0, MAX_SPEED * ((pointerY - (vh - EDGE)) / EDGE));
      }
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("dragover", onDragOver);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("dragover", onDragOver);
      cancelAnimationFrame(rafId);
    };
  }, [draggingId]);

  const byId = new Map(galleries.map((g) => [g.id, g]));
  const customOrdered = order.map((id) => byId.get(id)).filter((g) => g != null);

  const ordered = isCustom
    ? customOrdered
    : [...galleries].sort((a, b) => {
        switch (sortMode) {
          case "recent":
            return b.createdAt.getTime() - a.createdAt.getTime();
          case "visits":
            return b.visitCount - a.visitCount;
          case "alpha":
            return a.title.localeCompare(b.title, "es");
          default:
            return 0;
        }
      });

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    setDraggingId(null);

    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;

    const next = [...order];
    const fromIndex = next.indexOf(sourceId);
    if (fromIndex === -1) return;
    next.splice(fromIndex, 1);
    const insertAt = next.indexOf(targetId);
    next.splice(insertAt, 0, sourceId);

    setOrder(next);
    onReorder(next);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-muted-foreground">Ordenar:</span>
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSortMode(option.value)}
            className={`rounded-full border px-3 py-1 text-xs transition-all active:scale-95 ${
              sortMode === option.value
                ? "border-foreground bg-surface font-medium"
                : "border-border text-muted-foreground hover:border-muted-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        {isCustom
          ? "Arrastra el icono de la esquina de una galería para cambiar su orden en la portada."
          : "Vista solo para encontrar una galería rápido — no cambia el orden real de la portada (vuelve a \"Personalizado\" para verlo o tocarlo)."}
      </p>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {ordered.map((gallery) => {
          const isDragging = draggingId === gallery.id;
          const isDropTarget =
            isCustom &&
            dragOverId === gallery.id &&
            draggingId !== null &&
            !isDragging;
          return (
            <div
              key={gallery.id}
              onDragOver={(e) => isCustom && e.preventDefault()}
              onDragEnter={() => {
                if (isCustom && draggingId && draggingId !== gallery.id) {
                  setDragOverId(gallery.id);
                }
              }}
              onDragLeave={() =>
                setDragOverId((cur) => (cur === gallery.id ? null : cur))
              }
              onDrop={(e) => isCustom && handleDrop(e, gallery.id)}
              className={`relative overflow-hidden rounded-[var(--photo-radius)] border border-border transition-[transform,opacity,box-shadow] duration-150 ${
                isDragging ? "scale-95 opacity-40" : ""
              } ${
                isDropTarget
                  ? "scale-[0.98] ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : ""
              }`}
            >
              {/* Asa de arrastre separada del enlace: así un intento de
                  arrastrar nunca navega a la edición por error. Oculta en
                  las vistas ordenadas automáticamente: arrastrar ahí no
                  tendría ningún efecto visible hasta volver a
                  "Personalizado", así que solo confundiría. */}
              {isCustom && (
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", gallery.id);
                    setDraggingId(gallery.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  title="Arrastra para reordenar"
                  className="absolute left-2 top-2 z-10 flex cursor-grab items-center justify-center rounded-full bg-black/50 p-1.5 text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 active:cursor-grabbing"
                >
                  <GripIcon />
                </div>
              )}

              <Link
                href={`/admin/galleries/${gallery.id}`}
                className="group block transition-all active:scale-[0.98]"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-surface">
                  {gallery.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/img/thumb/${gallery.photos[0].id}`}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Sin fotos
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate font-medium">{gallery.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {PRIVACY_LABEL[gallery.privacy]} · {gallery._count.photos} fotos ·{" "}
                    {gallery.visitCount} visitas
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
