"use client";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Mide el elemento activo de un grupo (nav, pestañas) para que un único
 * indicador se desplace entre ellos en lugar de aparecer/desaparecer.
 * El contenedor debe ser `relative`. `layoutKey` fuerza una nueva medición
 * cuando cambian los elementos visibles.
 */
export function useSlidingIndicator<C extends HTMLElement = HTMLElement>(
  activeKey: string | null,
  layoutKey = ""
) {
  const containerRef = useRef<C | null>(null);
  const items = useRef(new Map<string, HTMLElement>());
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  readyRef.current = ready;

  useLayoutEffect(() => {
    const el = activeKey ? items.current.get(activeKey) : undefined;
    const measure = () => {
      setRect(el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null);
    };
    measure();

    // Si el grupo desborda (nav en móvil), centra el elemento activo
    const c = containerRef.current;
    if (el && c && c.scrollWidth > c.clientWidth) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      c.scrollTo({
        left: el.offsetLeft - (c.clientWidth - el.offsetWidth) / 2,
        behavior: readyRef.current && !reduce ? "smooth" : "auto",
      });
    }

    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [activeKey, layoutKey]);

  // La primera posición se pinta sin transición; a partir de ahí se desliza
  useLayoutEffect(() => {
    if (!rect || ready) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [rect, ready]);

  const itemRef = useCallback(
    (key: string) => (node: HTMLElement | null) => {
      if (node) items.current.set(key, node);
      else items.current.delete(key);
    },
    []
  );

  return { containerRef, itemRef, rect, ready };
}
