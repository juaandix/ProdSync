/**
 * Paleta única de gráficos (modo oscuro, sobre las tarjetas de cristal).
 *
 * Validada con el método dataviz: banda de luminosidad OKLCH 0.48–0.67,
 * croma ≥ 0.10, separación para daltonismo (protan/deutan) ΔE ≥ 8 entre
 * vecinos, ΔE ≥ 15 con visión normal y contraste ≥ 3:1 sobre #1c1c22.
 *
 * Reglas:
 * - Las series toman los huecos en este orden fijo; nunca se reciclan.
 *   Más de 8 series → agrupar en "Otros".
 * - El color sigue a la entidad, no a su posición: usa `colorFor(key, keys)`
 *   con la lista completa de claves para que un filtro no repinte las series.
 */
export const CATEGORICAL = [
  '#5b6cff', // azul ProdSync
  '#d95926', // naranja
  '#199e70', // aguamarina
  '#c98500', // ámbar
  '#d55181', // magenta
  '#008300', // verde
  '#9085e9', // violeta
  '#e66767', // rojo
] as const;

/** Estados de tarea (validados entre sí con todos los pares). */
export const TASK_STATUS = {
  PENDIENTE: '#c98500',
  EN_PROGRESO: '#5b6cff',
  COMPLETADO: '#199e70',
} as const;

/** Tipos de imputación con color fijo en toda la app. */
export const TIME_ENTRY_TYPE: Record<string, string> = {
  DESARROLLO: CATEGORICAL[0],
  ANALISIS: CATEGORICAL[1],
  TESTING: CATEGORICAL[2],
  REUNION: CATEGORICAL[3],
  'DISEÑO': CATEGORICAL[4],
};

/** Barras en segundo plano cuando solo una lleva el acento. */
export const MUTED_BAR = 'rgba(255,255,255,0.12)';

/** Ejes, rejilla y textos de los gráficos. */
export const AXIS_TEXT = '#6b7280';
export const GRID_LINE = 'rgba(255,255,255,0.06)';

/** Color estable de una clave dentro de su conjunto completo (ordenado). */
export function colorFor(key: string, allKeys: string[]): string {
  const i = [...allKeys].sort().indexOf(key);
  return i >= 0 && i < CATEGORICAL.length ? CATEGORICAL[i] : '#6b7280';
}
