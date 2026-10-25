'use client';
import React, { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

/* Piezas comunes de las páginas de listado (clientes, usuarios…), con el mismo
   lenguaje que el dashboard: cabecera con cifras sueltas y tarjetas de cristal. */

export type Kpi = { label: string; value: number | string; chip?: string; tone?: 'success' | 'neutral' };

/** Cifras sueltas, sin tarjeta, como en la cabecera del dashboard. */
export function KpiRow({ kpis }: { kpis: Kpi[] }) {
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4 stagger-children">
      {kpis.map((k) => (
        <div key={k.label}>
          <dt className="text-xs text-gray-500">{k.label}</dt>
          <dd className="flex items-center gap-2 mt-0.5">
            <span className="text-3xl font-semibold text-white tracking-tight">
              <AnimatedNumber value={k.value} />
            </span>
            {k.chip && (
              <span
                className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                  k.tone === 'neutral' ? 'text-gray-300 bg-white/[0.06]' : 'text-success-400 bg-success-500/10'
                }`}
              >
                {k.chip}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Título de la página a la izquierda y cifras a la derecha. */
export function PageHeader({ title, subtitle, kpis }: { title: string; subtitle?: string; kpis?: Kpi[] }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {kpis && <KpiRow kpis={kpis} />}
    </div>
  );
}

export type ViewMode = 'grid' | 'list';

/** Vista elegida (tarjetas o lista), recordada por página en este navegador. */
export function useViewMode(key: string, initial: ViewMode = 'grid') {
  const [mode, setMode] = useState<ViewMode>(initial);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`view:${key}`);
      if (saved === 'grid' || saved === 'list') setMode(saved);
    } catch {
      /* almacenamiento no disponible: se queda la vista por defecto */
    }
  }, [key]);
  const update = (m: ViewMode) => {
    setMode(m);
    try {
      localStorage.setItem(`view:${key}`, m);
    } catch {
      /* sin persistencia */
    }
  };
  return [mode, update] as const;
}

/** Interruptor Tarjetas / Lista en píldora. */
export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (m: ViewMode) => void }) {
  const opts: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'grid', label: 'Tarjetas', icon: <LayoutGrid size={14} /> },
    { mode: 'list', label: 'Lista', icon: <List size={14} /> },
  ];
  return (
    <div role="group" aria-label="Vista" className="flex items-center gap-0.5 p-1 rounded-full bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]">
      {opts.map((o) => {
        const active = value === o.mode;
        return (
          <button
            key={o.mode}
            type="button"
            aria-pressed={active}
            title={o.label}
            onClick={() => onChange(o.mode)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
              active ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            {o.icon}
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Píldoras de filtro (pestañas) con contador. */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              active
                ? 'bg-white/[0.1] text-white ring-1 ring-inset ring-white/[0.12]'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={`tabular-nums ${active ? 'text-gray-300' : 'text-gray-600'}`}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Buscador en píldora. */
export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-0 sm:flex-none">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full sm:w-60 rounded-full bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-brand-500/50 transition-shadow"
      />
    </div>
  );
}
