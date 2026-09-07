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

// El tamaño de cada hueco varía SOLO por el número de columnas que ocupa,
// nunca deformando la altura respecto a la proporción real de la foto:
// así "object-contain" nunca tiene que recortar nada, en ningún tamaño.
const SIZE_CONFIG: Record<SlotSize, { span: number }> = {
  LARGE: { span: 3 },
  MEDIUM: { span: 2 },
  SMALL: { span: 1 },
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
    const { span: configSpan } = SIZE_CONFIG[item.slotSize];
    const span = Math.min(configSpan, columns);
    const aspectRatio = item.width && item.height ? item.width / item.height : 1;
    const width = columnWidth * span + GAP * (span - 1);
    const height = width / aspectRatio;

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
  const [windowWidth, setWindowWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);

    setWindowWidth(window.innerWidth);
    function onResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // El NÚMERO de columnas se decide por el ancho de la ventana, no del
  // propio contenedor: en el editor de admin este componente vive junto
  // a un sidebar que le resta ancho (la galería pública no tiene ese
  // sidebar), así que decidir por el contenedor podía dar menos columnas
  // ahí que las que ve un visitante real a la misma anchura de ventana —
  // la "vista previa" no coincidía. El contenedor real sigue marcando el
  // ancho en píxeles de cada columna (packing de computeLayout), solo el
  // número de columnas se homogeneiza.
  const columns = windowWidth > 0 ? columnsForWidth(windowWidth) : 3;
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
              top: 0,
              left: 0,
              width: p.width,
              height: p.height,
              // translate en vez de left/top: el navegador puede mover el
              // recuadro solo con la GPU (composición), sin recalcular el
              // layout de sus vecinos en cada frame.
              transform: `translate(${p.x}px, ${p.y}px)`,
              transition:
                "transform 0.3s ease, width 0.3s ease, height 0.3s ease",
            }}
          >
            {renderItem(item)}
          </div>
        );
      })}
    </div>
  );
}
