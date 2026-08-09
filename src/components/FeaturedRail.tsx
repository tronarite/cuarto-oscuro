"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";

export interface RailPhoto {
  id: string;
  gallerySlug: string;
  width: number | null;
  height: number | null;
}

export type RailOrientation = "vertical" | "horizontal";

// Píxeles por segundo del avance automático (cuando no se está arrastrando).
const SPEED_PX_PER_SECOND = 45;
// Movimiento mínimo para considerar que fue un arrastre y no un toque:
// por debajo de esto, al soltar se deja pasar como clic normal.
const CLICK_MOVE_THRESHOLD = 6;

function RailPhotoCard({
  photo,
  orientation,
  hidden,
}: {
  photo: RailPhoto;
  orientation: RailOrientation;
  hidden?: boolean;
}) {
  return (
    <Link
      href={`/galeria/${photo.gallerySlug}`}
      draggable={false}
      style={{
        aspectRatio:
          photo.width && photo.height
            ? `${photo.width} / ${photo.height}`
            : "4 / 3",
      }}
      className={`block shrink-0 select-none overflow-hidden rounded-2xl bg-surface shadow-sm ${
        orientation === "vertical" ? "w-full" : "h-full"
      }`}
      tabIndex={hidden ? -1 : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/img/thumb/${photo.id}`}
        alt=""
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
    </Link>
  );
}

export function FeaturedRail({
  photos,
  className = "",
  orientation = "vertical",
}: {
  photos: RailPhoto[];
  className?: string;
  orientation?: RailOrientation;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [repeat, setRepeat] = useState(1);

  const vertical = orientation === "vertical";

  // Posición y arrastre en refs (no en estado): se aplican directamente
  // al transform del track en cada frame, sin volver a renderizar.
  const positionRef = useRef(0);
  const copySizeRef = useRef(1);
  const draggingRef = useRef(false);
  const dragStartClientRef = useRef(0);
  const dragStartPositionRef = useRef(0);
  const movedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const wheelResumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // El bucle sin costuras necesita que una sola "copia" del contenido
  // sea al menos tan larga (alta o ancha, según la orientación) como el
  // hueco visible; si hay pocas fotos destacadas, se repiten las
  // necesarias para que nunca quede una franja vacía a los lados.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const set = setRef.current;
    if (!container || !set || photos.length === 0) return;

    function measure() {
      const containerSize = vertical
        ? container!.clientHeight
        : container!.clientWidth;
      const setSize = vertical ? set!.scrollHeight : set!.scrollWidth;
      if (setSize === 0 || containerSize === 0) return;
      const needed = Math.max(1, Math.ceil(containerSize / setSize) + 1);
      setRepeat(needed);
      copySizeRef.current = needed * setSize;
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [photos, vertical]);

  // Avance automático a velocidad constante; se pausa mientras se
  // arrastra y retoma solo desde donde se soltó.
  useEffect(() => {
    if (photos.length === 0) return;
    let rafId: number;

    function wrap(value: number) {
      const size = copySizeRef.current || 1;
      return ((value % size) + size) % size;
    }

    function tick(time: number) {
      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (!draggingRef.current) {
        positionRef.current = wrap(
          positionRef.current + SPEED_PX_PER_SECOND * dt,
        );
      }

      if (trackRef.current) {
        const axis = vertical ? "Y" : "X";
        trackRef.current.style.transform = `translate${axis}(${-positionRef.current}px)`;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [photos, vertical]);

  // Scroll con la rueda en PC: mueve el raíl como si fuera el propio
  // scroll (sin barra, porque el contenedor sigue siendo overflow-hidden
  // y el desplazamiento lo aplicamos nosotros), y retoma el avance
  // automático solo un momento después de dejar de tocar la rueda.
  //
  // Se engancha a mano con addEventListener (no con la prop onWheel) y
  // { passive: false }: React registra los listeners de wheel/touch como
  // pasivos por defecto, y ahí preventDefault() no hace nada — el
  // navegador seguía intentando el scroll/rebote nativo por debajo,
  // y eso es lo que se veía como que "temblaba" el bloque de al lado.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = vertical
        ? e.deltaY
        : e.deltaX !== 0
          ? e.deltaX
          : e.deltaY;
      const size = copySizeRef.current || 1;
      positionRef.current =
        ((positionRef.current + delta) % size + size) % size;

      draggingRef.current = true;
      if (wheelResumeTimeoutRef.current) {
        clearTimeout(wheelResumeTimeoutRef.current);
      }
      wheelResumeTimeoutRef.current = setTimeout(() => {
        draggingRef.current = false;
      }, 500);
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [vertical]);

  useEffect(() => {
    return () => {
      if (wheelResumeTimeoutRef.current) {
        clearTimeout(wheelResumeTimeoutRef.current);
      }
    };
  }, []);

  // En táctil se arrastra a mano; en PC se usa la rueda (ver
  // handleWheel), no clicar y arrastrar, para no interferir con el
  // clic normal de abrir una foto.
  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;
    draggingRef.current = true;
    movedRef.current = 0;
    dragStartClientRef.current = vertical ? e.clientY : e.clientX;
    dragStartPositionRef.current = positionRef.current;
    containerRef.current?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (e.pointerType === "mouse" || !draggingRef.current) return;
    const client = vertical ? e.clientY : e.clientX;
    const delta = client - dragStartClientRef.current;
    movedRef.current = Math.max(movedRef.current, Math.abs(delta));
    const size = copySizeRef.current || 1;
    positionRef.current =
      ((dragStartPositionRef.current - delta) % size + size) % size;
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (e.pointerType === "mouse" || !draggingRef.current) return;
    draggingRef.current = false;
    if (containerRef.current?.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  }

  function handleClickCapture(e: React.MouseEvent) {
    if (movedRef.current > CLICK_MOVE_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  if (photos.length === 0) return null;

  const flexDir = vertical ? "flex-col" : "flex-row";
  // El eje transversal necesita una medida explícita en toda la cadena
  // de contenedores: en vertical es el ancho (w-full ya se resuelve
  // solo contra el bloque padre), pero en horizontal es el alto, y un
  // `h-full` contra un contenedor con alto "auto" no vale nada.
  const crossAxisClass = vertical ? "w-full" : "h-full";

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={handleClickCapture}
      className={`overflow-hidden ${className}`}
      style={{ touchAction: vertical ? "pan-x" : "pan-y" }}
    >
      <div
        ref={trackRef}
        className={`flex ${flexDir} ${crossAxisClass} items-center gap-6`}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className={`flex ${flexDir} ${crossAxisClass} items-center gap-6`}
          >
            {Array.from({ length: repeat }).map((_, rep) => (
              <div
                key={rep}
                ref={copy === 0 && rep === 0 ? setRef : undefined}
                className={`flex ${flexDir} ${crossAxisClass} items-center gap-6`}
              >
                {photos.map((photo) => (
                  <RailPhotoCard
                    key={`${copy}-${rep}-${photo.id}`}
                    photo={photo}
                    orientation={orientation}
                    hidden={copy === 1}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
