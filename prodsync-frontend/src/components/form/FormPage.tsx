import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface FormPageProps {
  title: string;
  subtitle?: string;
  /** A dónde vuelve el enlace "Volver". */
  backHref: string;
  /** Ancho máximo de la tarjeta: los formularios cortos no ocupan toda la pantalla. */
  width?: "md" | "lg";
  children: React.ReactNode;
}

/**
 * Página de alta o edición: título, enlace de vuelta y el formulario en una
 * tarjeta de cristal. `form-glass` da a todos los campos el mismo estilo.
 */
export default function FormPage({ title, subtitle, backHref, width = "md", children }: FormPageProps) {
  return (
    <div className={`mx-auto w-full ${width === "lg" ? "max-w-5xl" : "max-w-3xl"}`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <Link
          href={backHref}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm text-gray-300 bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] hover:text-white hover:bg-white/[0.08] press"
        >
          <ArrowLeft size={14} /> Volver
        </Link>
      </div>
      <div className="form-glass rounded-2xl glass p-6 sm:p-8 animate-enter">{children}</div>
    </div>
  );
}
