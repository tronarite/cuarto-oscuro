"use client";

import { useState } from "react";
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
  _count: { photos: number };
  photos: { id: string }[];
}

interface GalleryGridProps {
  galleries: GalleryCardData[];
  onReorder: (orderedIds: string[]) => Promise<void>;
}

export function GalleryGrid({ galleries, onReorder }: GalleryGridProps) {
  const [order, setOrder] = useState(galleries.map((g) => g.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const byId = new Map(galleries.map((g) => [g.id, g]));
  const ordered = order.map((id) => byId.get(id)).filter((g) => g != null);

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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {ordered.map((gallery) => {
        const isDragging = draggingId === gallery.id;
        const isDropTarget =
          dragOverId === gallery.id && draggingId !== null && !isDragging;
        return (
          <div
            key={gallery.id}
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
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => {
              if (draggingId && draggingId !== gallery.id) {
                setDragOverId(gallery.id);
              }
            }}
            onDragLeave={() =>
              setDragOverId((cur) => (cur === gallery.id ? null : cur))
            }
            onDrop={(e) => handleDrop(e, gallery.id)}
            className={`cursor-grab overflow-hidden rounded-2xl border border-neutral-200 transition-[transform,opacity,box-shadow] duration-150 active:cursor-grabbing ${
              isDragging ? "scale-95 opacity-40" : ""
            } ${
              isDropTarget
                ? "scale-[0.98] ring-2 ring-foreground ring-offset-2 ring-offset-background"
                : ""
            }`}
          >
            <Link
              href={`/admin/galleries/${gallery.id}`}
              draggable={false}
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
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {PRIVACY_LABEL[gallery.privacy]} · {gallery._count.photos} fotos ·{" "}
                  {gallery.visitCount} visitas
                </p>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
