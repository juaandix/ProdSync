'use client';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#1E1E26] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">

        <div className="relative mb-8 select-none">
          <span className="text-[10rem] font-black text-white/[0.04] leading-none">403</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Acceso denegado</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          No tienes permiso para ver esta sección.<br />
          Si crees que es un error, contacta con el administrador.
        </p>

        <Link
          href="/dashboard"
          className="px-6 py-2.5 bg-white text-[#1E1E26] rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          Volver al Dashboard
        </Link>
      </div>

      <p className="absolute bottom-6 text-xs text-gray-700">
        © {new Date().getFullYear()} ProdSync
      </p>
    </div>
  );
}
