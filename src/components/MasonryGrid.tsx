"use client";

import { useEffect, useRef, useState } from "react";

export type FeatureLevel = "NONE" | "SECONDARY" | "PRIMARY";

export interface MasonryItem {
  id: string;
  width: number | null;
  height: number | null;
  featureLevel: FeatureLevel;
}

const GAP = 12;
const ROW_UNIT = 8;

// Principal ocupa lo mismo de ancho que secundaria, pero se renderiza más
// alta (llama más la atención); sin etiqueta siempre va a una columna.
const SIZE_CONFIG: Record<FeatureLevel, { span: number; heightMultiplier: number }> = {
  PRIMARY: { span: 2, heightMultiplier: 1.25 },
  SECONDARY: { span: 2, heightMultiplier: 1 },
  NONE: { span: 1, heightMultiplier: 1 },
};

function columnsForWidth(width: number): number {
  if (width < 640) return 2;
  if (width < 1024) return 3;
  return 4;
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns = containerWidth > 0 ? columnsForWidth(containerWidth) : 3;
  const columnWidth =
    containerWidth > 0 ? (containerWidth - (columns - 1) * GAP) / columns : 0;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: "grid",
        gridAutoFlow: "dense",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: `${ROW_UNIT}px`,
        gap: GAP,
      }}
    >
      {items.map((item) => {
        const { span: configSpan, heightMultiplier } = SIZE_CONFIG[item.featureLevel];
        const span = columns > 1 ? Math.min(configSpan, columns) : 1;
        const aspectRatio =
          item.width && item.height ? item.width / item.height : 1;

        let rowSpan = 20;
        if (columnWidth > 0) {
          const renderedWidth = columnWidth * span + GAP * (span - 1);
          const renderedHeight = (renderedWidth / aspectRatio) * heightMultiplier;
          rowSpan = Math.max(
            1,
            Math.round((renderedHeight + GAP) / (ROW_UNIT + GAP)),
          );
        }

        return (
          <div
            key={item.id}
            style={{
              gridColumn: `span ${span}`,
              gridRow: `span ${rowSpan}`,
            }}
          >
            {renderItem(item)}
          </div>
        );
      })}
    </div>
  );
}
