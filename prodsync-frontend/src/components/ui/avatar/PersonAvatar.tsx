'use client';
import React, { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';

// Fondos: tintes claros de los tonos de la paleta de gráficos
const BACKGROUNDS = ['c9cfff', 'f6c9b3', 'b3e3d0', 'f1dca8', 'f3c4d6', 'd6d1fa'];

interface PersonAvatarProps {
  /** Identificador estable (id de usuario). El mismo seed da siempre la misma cara. */
  seed: string;
  /** Nombre para el texto alternativo. */
  name: string;
  /** Lado en píxeles. */
  size?: number;
  className?: string;
}

/**
 * Avatar ilustrado tipo Memoji (DiceBear "Avataaars", libre para uso comercial).
 * Se genera en el navegador a partir del id: sin peticiones ni subida de fotos.
 * Solo expresiones amables y sin barba para que encaje con cualquier persona.
 */
export default function PersonAvatar({ seed, name, size = 32, className = '' }: PersonAvatarProps) {
  const src = useMemo(
    () =>
      createAvatar(avataaars, {
        seed,
        backgroundColor: BACKGROUNDS,
        mouth: ['smile', 'default', 'twinkle'],
        eyes: ['default', 'happy', 'wink', 'squint'],
        eyebrows: ['default', 'defaultNatural', 'raisedExcitedNatural'],
        facialHairProbability: 0,
        accessoriesProbability: 15,
      }).toDataUri(),
    [seed]
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG en data URI generado localmente
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={`rounded-full shrink-0 ring-1 ring-white/10 bg-white/5 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
