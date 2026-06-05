import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada — ProdSync",
  description: "La página que buscas no existe.",
};

export default function Error404() {
  return (
    <div className="min-h-screen bg-[#1E1E26] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Número grande */}
        <div className="relative mb-8 select-none">
          <span className="text-[10rem] font-black text-white/[0.04] leading-none">404</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Página no encontrada</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          La página que estás buscando no existe o ha sido movida.<br />
          Comprueba la URL o vuelve al inicio.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-white text-[#1E1E26] rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/projects"
            className="px-6 py-2.5 border border-white/10 text-gray-400 rounded-xl text-sm font-medium hover:text-white hover:border-white/20 transition-colors"
          >
            Ver proyectos
          </Link>
        </div>

      </div>

      <p className="absolute bottom-6 text-xs text-gray-700">
        © {new Date().getFullYear()} ProdSync
      </p>
    </div>
  );
}
