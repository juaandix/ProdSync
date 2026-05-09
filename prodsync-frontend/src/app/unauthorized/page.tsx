'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center px-4">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-10 w-10 text-[#E93222]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white">Acceso denegado</h1>
        <p className="mb-8 text-gray-500 dark:text-gray-400">
          No tienes permisos para acceder a esta sección.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md bg-[#1E1E26] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#13131a]"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
