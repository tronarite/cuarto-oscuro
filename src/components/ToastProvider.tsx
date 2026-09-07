"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface Toast {
  id: number;
  message: string;
}

const ToastContext = createContext<((message: string) => void) | null>(null);

const TOAST_DURATION_MS = 2500;

// Feedback de guardado unificado: cualquier form de Ajustes/editor de
// galería llama a showToast("Guardado") tras un guardado con éxito, en
// vez de que cada uno invente su propio mensaje (o no dé ninguno).
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Fuera de un ToastProvider (no debería pasar, está montado en el
// layout raíz) se queda callado en vez de romper la página.
export function useToast() {
  const showToast = useContext(ToastContext);
  return showToast ?? (() => {});
}
