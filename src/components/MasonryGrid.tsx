"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { SlotSize } from "@/lib/grid-templates";

export interface MasonryItem {
  id: string;
  width: number | null;
  height: number | null;
  slotSize: SlotSize;
}

const GAP = 12;

// Grande ocupa el doble de ancho; mediana es una columna pero más alta;
// pequeña es una columna y más compacta.
const SIZE_CONFIG: Record<SlotSize, { span: number; heightMultiplier: number }> = {
  LARGE: { span: 2, heightMultiplier: 1.15 },
  MEDIUM: { span: 1, heightMultiplier: 1.25 },
  SMALL: { span: 1, heightMultiplier: 0.85 },
};

function columnsForWidth(width: number): number {
  if (width < 640) return 2;
  if (width < 1024) return 3;
  return 4;
}

interface Placement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Empaquetado tipo "columna más corta" (Pinterest), calculado en JS y
// aplicado con posicionamiento absoluto: a diferencia de CSS grid con
// `dense`, procesa las fotos EN ORDEN y nunca las reordena para rellenar
// huecos, así el resultado es 100% predecible a partir del propio orden
// (mismo orden + mismo ancho de contenedor = mismo resultado siempre, en
// el admin y en la galería pública).
function computeLayout<T extends MasonryItem>(
  items: T[],
  columns: number,
  containerWidth: number,
): { placements: Placement[]; containerHeight: number } {
  const columnWidth = (containerWidth - (columns - 1) * GAP) / columns;
  const columnHeights = new Array(columns).fill(0);
  const placements: Placement[] = [];

  for (const item of items) {
    const { span: configSpan, heightMultiplier } = SIZE_CONFIG[item.slotSize];
    const span = Math.min(configSpan, columns);
    const aspectRatio = item.width && item.height ? item.width / item.height : 1;
    const width = columnWidth * span + GAP * (span - 1);
    const height = (width / aspectRatio) * heightMultiplier;

    let bestCol = 0;
    let bestY = Infinity;
    for (let c = 0; c <= columns - span; c++) {
      let y = 0;
      for (let k = c; k < c + span; k++) y = Math.max(y, columnHeights[k]);
      if (y < bestY) {
        bestY = y;
        bestCol = c;
      }
    }

    const x = bestCol * (columnWidth + GAP);
    placements.push({ id: item.id, x, y: bestY, width, height });

    const newHeight = bestY + height + GAP;
    for (let k = bestCol; k < bestCol + span; k++) columnHeights[k] = newHeight;
  }

  const containerHeight = Math.max(0, ...columnHeights) - GAP;
  return { placements, containerHeight };
}

export function MasonryGrid<T extends MasonryItem>({
  items,
  renderItem,
  className,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns = containerWidth > 0 ? columnsForWidth(containerWidth) : 3;
  const { placements, containerHeight } =
    containerWidth > 0
      ? computeLayout(items, columns, containerWidth)
      : { placements: [], containerHeight: 0 };

  const byId = new Map(items.map((item) => [item.id, item]));

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", height: containerHeight }}
    >
      {placements.map((p) => {
        const item = byId.get(p.id);
        if (!item) return null;
        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.width,
              height: p.height,
              transition:
                "left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease",
            }}
          >
            {renderItem(item)}
          </div>
        );
      })}
    </div>
  );
}
