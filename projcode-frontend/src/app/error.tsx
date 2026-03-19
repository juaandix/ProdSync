"use client";

// Error boundary global de Next.js App Router.
// Se activa cuando un componente hijo lanza un error no capturado,
// evitando que toda la aplicación se rompa.
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // En producción se podría enviar el error a un servicio de monitoreo (ej. Sentry)
    console.error("Error no capturado:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1E1E26] px-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-2 text-4xl font-bold text-white">¡Algo salió mal!</h1>
        <p className="mb-6 text-gray-400">
          Se ha producido un error inesperado. Puedes intentar recargar la página.
        </p>
        {error.digest && (
          <p className="mb-4 text-xs text-gray-600">
            Referencia: <code className="text-gray-500">{error.digest}</code>
          </p>
        )}
        <button
          onClick={reset}
          className="rounded-md bg-[#E93222] px-6 py-2 text-sm font-medium text-white hover:bg-[#C72C1F]"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
