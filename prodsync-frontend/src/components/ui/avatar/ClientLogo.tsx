'use client';
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';
import { CATEGORICAL } from '@/lib/chartColors';
import type { Client } from '@/types/models';

interface ClientLogoProps {
  client: Pick<Client, 'id' | 'name' | 'logoVersion'>;
  /** Lado en píxeles. */
  size?: number;
  className?: string;
}

/** Iniciales de la empresa: dos primeras palabras significativas. */
function monogram(name: string) {
  const words = name.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w));
  return (words.length ? words : [name])
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Color estable por cliente a partir de su id. */
function colorFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CATEGORICAL[h % CATEGORICAL.length];
}

/**
 * Logo de un cliente. Las empresas van en un cuadrado redondeado (las personas
 * en círculo) para distinguirlas de un vistazo. Sin logo subido, monograma.
 */
export default function ClientLogo({ client, size = 32, className = '' }: ClientLogoProps) {
  const version = client.logoVersion;
  const { data: blob } = useQuery({
    queryKey: ['client-logo', client.id, version],
    queryFn: () => clientService.getLogo(client.id, version!),
    enabled: !!version,
    staleTime: Infinity,
  });

  // La URL se crea y se libera en el mismo efecto (seguro con el doble montaje de StrictMode)
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!(blob instanceof Blob)) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const radius = size >= 48 ? 'rounded-2xl' : 'rounded-lg';
  const box = { width: size, height: size };

  if (src) {
    // Relleno en px: un % se calcularía sobre el ancho del contenedor (p. ej. la celda), no del logo
    return (
      <div
        style={{ ...box, padding: Math.round(size * 0.08) }}
        className={`${radius} shrink-0 overflow-hidden bg-white ring-1 ring-white/10 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- blob local descargado con autenticación */}
        <img src={src} alt={`Logo de ${client.name}`} className="w-full h-full object-contain" />
      </div>
    );
  }

  const color = colorFor(client.id);
  return (
    <div
      role="img"
      aria-label={client.name}
      style={{ ...box, fontSize: size * 0.36, background: `color-mix(in oklab, ${color} 24%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 40%, transparent)` }}
      className={`${radius} shrink-0 flex items-center justify-center font-semibold text-white/90 ${className}`}
    >
      {monogram(client.name)}
    </div>
  );
}
