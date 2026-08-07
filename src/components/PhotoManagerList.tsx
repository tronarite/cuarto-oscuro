"use client";

import { useEffect, useState, useTransition } from "react";

interface PhotoItem {
  id: string;
  order: number;
  description: string | null;
  thumbPath: string | null;
}

interface PhotoManagerListProps {
  photos: PhotoItem[];
  onReorder: (photoIds: string[]) => Promise<void>;
  onUpdateDescription: (photoId: string, description: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
}

export function PhotoManagerList({
  photos,
  onReorder,
  onUpdateDescription,
  onDelete,
}: PhotoManagerListProps) {
  const [order, setOrder] = useState(photos.map((p) => p.id));
  const [, startTransition] = useTransition();

  useEffect(() => {
    setOrder(photos.map((p) => p.id));
  }, [photos]);

  const byId = new Map(photos.map((p) => [p.id, p]));

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    startTransition(() => {
      onReorder(next);
    });
  }

  if (photos.length === 0) {
    return <p className="text-sm text-neutral-500">Todavía no hay fotos.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {order.map((id, index) => {
        const photo = byId.get(id);
        if (!photo) return null;
        return (
          <li
            key={photo.id}
            className="flex gap-4 rounded-md border border-neutral-200 p-3"
          >
            {photo.thumbPath && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/img/thumb/${photo.id}`}
                alt=""
                className="h-24 w-24 rounded object-cover"
              />
            )}
            <div className="flex flex-1 flex-col gap-2">
              <textarea
                defaultValue={photo.description ?? ""}
                placeholder="Descripción de la foto"
                rows={2}
                onBlur={(e) => onUpdateDescription(photo.id, e.target.value)}
                className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm outline-none focus:border-neutral-500"
              />
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
                >
                  ↑ subir
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  className="text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
                >
                  ↓ bajar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("¿Eliminar esta foto?")) onDelete(photo.id);
                  }}
                  className="text-red-700 hover:text-red-900"
                >
                  eliminar
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
