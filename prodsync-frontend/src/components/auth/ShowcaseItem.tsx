"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ShowcaseItemProps {
  index: number;
  title: string;
  text: string;
  src: string;
  /** Contenedor con scroll en el que vive el elemento (la columna izquierda). */
  rootRef: React.RefObject<HTMLElement | null>;
}

/** Una pantalla de la app en el recorrido del acceso: aparece al entrar en vista. */
export default function ShowcaseItem({ index, title, text, src, rootRef }: ShowcaseItemProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { root: rootRef.current, threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootRef]);

  return (
    <figure
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out-expo ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <figcaption className="mb-4 max-w-md">
        <span className="text-xs font-medium tabular-nums text-brand-300">{String(index).padStart(2, "0")}</span>
        <h3 className="mt-1 text-xl font-semibold text-white tracking-tight">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-400">{text}</p>
      </figcaption>
      <div className="rounded-2xl glass p-1.5 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9)]">
        <Image
          src={src}
          alt={`Captura: ${title}`}
          width={1440}
          height={900}
          sizes="(min-width: 1280px) 720px, 55vw"
          className="rounded-xl"
        />
      </div>
    </figure>
  );
}
