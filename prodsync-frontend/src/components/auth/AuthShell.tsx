"use client";
import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ShowcaseItem from "./ShowcaseItem";

// Recorrido por la app con capturas reales (public/images/showcase)
const TOUR = [
  { src: "dashboard", title: "Tu día de un vistazo", text: "Anillos de horas, la cifra que importa destacada y el avance real de cada proyecto." },
  { src: "projects", title: "Proyectos con datos reales", text: "Plazo restante, tareas cerradas, horas imputadas y quién ha trabajado en cada uno." },
  { src: "clients", title: "Clientes con su logo", text: "Cada empresa con su contacto, sus proyectos y las horas dedicadas este mes." },
  { src: "client-detail", title: "Quién trabaja para cada cliente", text: "La ficha resume horas, avance y el peso de cada persona del equipo." },
  { src: "time-entries", title: "Un diario de horas", text: "Las imputaciones agrupadas por días, con el tipo de trabajo y el proyecto de cada una." },
  { src: "budgets", title: "Presupuestos y rentabilidad", text: "Estado, validez e importe de cada oferta, comparados con las horas reales." },
  { src: "users", title: "El equipo, con su avatar", text: "Rol, horas del mes y proyectos de cada persona, con avatares generados." },
];

/**
 * Marco de las pantallas de acceso. En pantallas anchas, la columna izquierda
 * es un recorrido por la app con su propio scroll y el formulario queda fijo a
 * la derecha. En móvil solo se muestra el formulario.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const tourRef = useRef<HTMLElement>(null);

  return (
    <div className="ambient min-h-screen lg:h-screen lg:overflow-hidden lg:grid lg:grid-cols-[1.15fr_1fr]">
      {/* Recorrido por la app */}
      <aside
        ref={tourRef}
        aria-label="Recorrido por ProdSync"
        className="hidden lg:block h-screen overflow-y-auto overscroll-contain px-12 xl:px-16 no-scrollbar"
      >
        {/* Portada compacta: el recorrido empieza a verse desde la carga */}
        <section className="pt-12 pb-14">
          <Link href="/" className="inline-flex items-center gap-3 animate-enter">
            <Image src="/images/prodsync-sidebar-logo.png" alt="" width={40} height={40} className="h-10 w-10" priority />
            <span className="text-lg font-semibold text-white tracking-tight">ProdSync</span>
          </Link>
          <h2 className="mt-12 max-w-lg text-4xl xl:text-[2.75rem] font-semibold text-white leading-[1.1] tracking-tight animate-rise [animation-delay:80ms]">
            Clientes, proyectos, horas y presupuestos en un solo sitio.
          </h2>
        </section>

        <div className="space-y-24 pb-24">
          {TOUR.map((item, i) => (
            <ShowcaseItem
              key={item.src}
              index={i + 1}
              title={item.title}
              text={item.text}
              src={`/images/showcase/${item.src}.png`}
              rootRef={tourRef}
            />
          ))}
          <p className="text-sm text-gray-500">
            Spring Boot · Next.js · PostgreSQL — Trabajo de Fin de Grado, CESUR 2025-2026.
          </p>
        </div>
      </aside>

      {/* Formulario: fijo mientras se recorre la app */}
      <main className="min-h-screen lg:h-screen lg:overflow-y-auto flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
          <Image src="/images/prodsync-sidebar-logo.png" alt="" width={36} height={36} className="h-9 w-9" priority />
          <span className="text-base font-semibold text-white tracking-tight">ProdSync</span>
        </Link>

        <div className="w-full max-w-[400px] form-glass rounded-3xl glass p-7 sm:p-9 animate-rise [animation-delay:60ms]">
          <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
          <p className="mt-1 mb-7 text-sm text-gray-400">{subtitle}</p>
          {children}
        </div>

        <div className="mt-6 text-sm text-gray-400 animate-fade [animation-delay:240ms]">{footer}</div>
      </main>
    </div>
  );
}
