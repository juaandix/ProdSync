"use client";
import React, { useEffect, useRef, useState } from "react";

const DURATION = 700;

/**
 * Cuenta hasta el valor cuando llegan (o cambian) los datos.
 * Acepta números o cadenas con sufijo ("7593.5h"); lo que no empiece
 * por un número se muestra tal cual. Con datos ya en caché no anima.
 */
export default function AnimatedNumber({ value }: { value: number | string }) {
  const match = String(value).match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : "";
  const decimals = match ? (match[1].split(".")[1] ?? "").length : 0;

  const [current, setCurrent] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    from.current = target;
    if (start === target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(target);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setCurrent(start + (target - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  if (!match) return <>{value}</>;

  return (
    <span className="tabular-nums">
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}
