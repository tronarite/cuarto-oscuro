"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HIDE_AFTER_MS = 2500;

// Comportamiento tipo YouTube: los controles (botones, caption...) se
// ven al entrar y mientras se mueve el ratón, y se ocultan solos tras
// un momento sin actividad — usado en el visor de una foto y en el modo
// presentación (GalleryView.tsx, PresentationMode.tsx).
//
// `resetKey` reaparece los controles cuando cambia (p. ej. al pasar a la
// siguiente foto) y reinicia el cronómetro, sin que haga falta mover el
// ratón para volver a verlos.
export function useAutoHideControls(resetKey?: unknown) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Solo programa el ocultado (setVisible(false) se llama más tarde,
  // dentro del propio callback del timeout) — nunca cambia estado de
  // forma síncrona, así se puede llamar tanto desde un evento como
  // durante el render sin disparar el aviso de "setState en un efecto".
  const scheduleHide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), HIDE_AFTER_MS);
  }, []);

  const show = useCallback(() => {
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  // Reaparecen los controles al cambiar de foto, aunque ya estuvieran
  // ocultos por inactividad — comparado durante el render (mismo patrón
  // que zoomResetKey en GalleryView.tsx para resetear el zoom al cambiar
  // de foto), no en un efecto: solo cambia estado, no toca el ref del
  // temporizador (eso pasa aparte, en el efecto de abajo).
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (!visible) setVisible(true);
  }

  // Arranca el cronómetro al montar, y lo reinicia con uno nuevo cada
  // vez que cambia resetKey (nueva foto) — así la foto siguiente parte
  // siempre con el mismo margen de tiempo, no con lo que quedara de la
  // anterior.
  useEffect(() => {
    scheduleHide();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleHide, resetKey]);

  return { visible, onMouseMove: show };
}
