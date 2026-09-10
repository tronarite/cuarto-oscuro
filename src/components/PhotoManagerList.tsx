"use client";

import { useEffect, useState } from "react";
import { MasonryGrid, type MasonryItem } from "@/components/MasonryGrid";
import { exifLine, type ExifSource } from "@/lib/exif-format";
import { slotSizeForIndex, SLOT_LABEL, type GalleryLayout } from "@/lib/grid-templates";
import { applyPinning } from "@/lib/photo-order";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import type { WatermarkDisplaySettings } from "@/lib/watermark-svg";

interface PhotoItem extends ExifSource {
  id: string;
  order: number;
  pinnedPosition: number | null;
  width: number | null;
  height: number | null;
  description: string | null;
  thumbPath: string | null;
  homeFeatured: boolean;
}

type LaidOutPhoto = PhotoItem & MasonryItem;

interface PhotoManagerListProps {
  photos: PhotoItem[];
  layout: GalleryLayout;
  watermark: WatermarkDisplaySettings;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onUpdateDescription: (photoId: string, description: string) => Promise<void>;
  onToggleHomeFeatured: (
    photoId: string,
    next: boolean,
  ) => Promise<{ error?: string }>;
  onTogglePinned: (photoId: string, next: boolean) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  onBulkDelete: (photoIds: string[]) => Promise<void>;
}

export function PhotoManagerList({
  photos,
  layout,
  watermark,
  onReorder,
  onUpdateDescription,
  onToggleHomeFeatured,
  onTogglePinned,
  onDelete,
  onBulkDelete,
}: PhotoManagerListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [homeFeaturedError, setHomeFeaturedError] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  function toggleSelected(photoId: string) {
    setSelectedIds((cur) => {
      const next = new Set(cur);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!confirm(`¿Eliminar ${ids.length} foto${ids.length === 1 ? "" : "s"}?`)) {
      return;
    }
    setBulkBusy(true);
    try {
      await onBulkDelete(ids);
      exitSelectMode();
    } finally {
      setBulkBusy(false);
    }
  }

  // Auto-scroll de la ventana mientras se arrastra una foto cerca del
  // borde superior/inferior, para poder llevar una foto de abajo del
  // todo hasta arriba sin soltar y desplazar a mano.
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

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay fotos.</p>;
  }

  const ordered: LaidOutPhoto[] = applyPinning(photos).map((photo, i) => ({
    ...photo,
    slotSize: slotSizeForIndex(layout, i),
  }));

  // Arrastrar inserta la foto en el hueco soltado (como una lista normal),
  // en vez de solo intercambiar el sitio con la de destino. Las fotos
  // ancladas no participan: ni se pueden arrastrar ni recibir una.
  function handleDrop(e: React.DragEvent, targetPhoto: LaidOutPhoto) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    setDraggingId(null);
    if (targetPhoto.pinnedPosition != null) return;

    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetPhoto.id) return;

    const unpinnedIds = ordered
      .filter((p) => p.pinnedPosition == null)
      .map((p) => p.id);
    const fromIndex = unpinnedIds.indexOf(sourceId);
    if (fromIndex === -1) return;

    const next = [...unpinnedIds];
    next.splice(fromIndex, 1);
    const insertAt = next.indexOf(targetPhoto.id);
    next.splice(insertAt, 0, sourceId);

    onReorder(next);
  }

  async function handleTogglePinned(photoId: string, next: boolean) {
    await onTogglePinned(photoId, next);
  }

  async function handleToggleHomeFeatured(photoId: string, next: boolean) {
    setHomeFeaturedError(null);
    const result = await onToggleHomeFeatured(photoId, next);
    if (result.error) setHomeFeaturedError(result.error);
  }

  const allIds = ordered.map((p) => p.id);
  const allSelected = selectedIds.size === allIds.length && allIds.length > 0;

  return (
    <div>
      {homeFeaturedError && (
        <p className="mb-3 text-sm text-red-600">{homeFeaturedError}</p>
      )}

      <div className="mb-3 flex items-center gap-2 text-xs">
        {selectMode ? (
          <>
            <button
              type="button"
              onClick={() =>
                setSelectedIds(allSelected ? new Set() : new Set(allIds))
              }
              className="rounded-full border border-border px-3 py-1 transition-colors hover:bg-surface"
            >
              {allSelected ? "Quitar selección" : "Seleccionar todo"}
            </button>
            <span className="text-muted-foreground">
              {selectedIds.size} seleccionada{selectedIds.size === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={exitSelectMode}
              className="ml-auto rounded-full border border-border px-3 py-1 transition-colors hover:bg-surface"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setSelectMode(true)}
            className="rounded-full border border-border px-3 py-1 transition-colors hover:bg-surface"
          >
            Seleccionar varias
          </button>
        )}
      </div>

      <MasonryGrid
        items={ordered}
        renderItem={(photo) => {
          const specs = exifLine(photo);
          const pinned = photo.pinnedPosition != null;
          const isDragging = draggingId === photo.id;
          const isDropTarget =
            !pinned && dragOverId === photo.id && draggingId !== null && !isDragging;
          const isSelected = selectedIds.has(photo.id);
          return (
            <div
              draggable={!pinned && !selectMode}
              onDragStart={(e) => {
                if (selectMode) return;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", photo.id);
                setDraggingId(photo.id);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => {
                if (!selectMode && !pinned && draggingId && draggingId !== photo.id) {
                  setDragOverId(photo.id);
                }
              }}
              onDragLeave={() =>
                setDragOverId((cur) => (cur === photo.id ? null : cur))
              }
              onDrop={(e) => handleDrop(e, photo)}
              onClick={selectMode ? () => toggleSelected(photo.id) : undefined}
              className={`group relative block h-full w-full overflow-hidden rounded-[var(--photo-radius)] bg-surface transition-[transform,opacity,box-shadow] duration-150 ${
                selectMode
                  ? "cursor-pointer"
                  : pinned
                    ? "cursor-default ring-2 ring-amber-400"
                    : "cursor-grab active:cursor-grabbing"
              } ${isDragging ? "scale-95 opacity-40" : ""} ${
                isDropTarget
                  ? "scale-[0.98] ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : ""
              } ${
                selectMode && isSelected
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : ""
              } ${selectMode && !isSelected ? "opacity-70" : ""}`}
            >
              {photo.thumbPath && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/img/thumb/${photo.id}`}
                    alt=""
                    draggable={false}
                    className="h-full w-full select-none object-contain"
                  />
                  <WatermarkOverlay
                    watermark={watermark}
                    width={photo.width}
                    height={photo.height}
                  />
                </>
              )}

              {selectMode && (
                <div
                  className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border text-[13px] font-bold backdrop-blur-sm ${
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-white/70 bg-black/40 text-transparent"
                  }`}
                >
                  ✓
                </div>
              )}

              <div
                className={`absolute inset-x-2 top-2 flex items-center justify-between ${
                  selectMode ? "hidden" : ""
                }`}
              >
                <span className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur-sm">
                  {SLOT_LABEL[photo.slotSize]}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePinned(photo.id, !pinned)}
                    title="Anclar en esta posición: no se mueve al borrar u ordenar otras"
                    className={`rounded-full px-2 py-0.5 text-[11px] backdrop-blur-sm transition-all active:scale-90 ${
                      pinned
                        ? "bg-amber-400 text-black"
                        : "bg-black/50 text-white/80 hover:bg-black/70"
                    }`}
                  >
                    {pinned ? "Anclada" : "Anclar"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleHomeFeatured(photo.id, !photo.homeFeatured)
                    }
                    title="Destacar en portada (máx. 3 por galería)"
                    className={`rounded-full px-2 py-0.5 text-[11px] backdrop-blur-sm transition-all active:scale-90 ${
                      photo.homeFeatured
                        ? "bg-white text-black"
                        : "bg-black/50 text-white/80 hover:bg-black/70"
                    }`}
                  >
                    {photo.homeFeatured ? "★ Portada" : "☆ Portada"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("¿Eliminar esta foto?")) onDelete(photo.id);
                    }}
                    className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur-sm transition-all hover:bg-black/70 active:scale-90"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3 pt-12">
                <input
                  type="text"
                  defaultValue={photo.description ?? ""}
                  placeholder="Añadir pie de foto…"
                  disabled={selectMode}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => onUpdateDescription(photo.id, e.target.value)}
                  className={`w-full bg-transparent text-sm font-medium text-white placeholder:text-white/50 outline-none ${
                    selectMode ? "pointer-events-none" : "pointer-events-auto"
                  }`}
                />
                {specs.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-white/70">
                    {specs.join(" · ")}
                  </p>
                )}
              </div>
            </div>
          );
        }}
      />

      {selectMode && selectedIds.size > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-background/95 px-4 py-2 text-sm shadow-lg backdrop-blur-sm">
            <span className="font-medium">
              {selectedIds.size} seleccionada{selectedIds.size === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkBusy}
              className="rounded-full bg-red-600 px-3 py-1 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {bulkBusy ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
