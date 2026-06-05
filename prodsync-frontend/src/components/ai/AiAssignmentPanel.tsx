'use client';
import React, { useState } from 'react';
import { useAiAssignment } from '@/hooks/useAiAssignment';
import { AiAssignmentRequest } from '@/services/aiAssignmentService';

const TIPOS = ['DESARROLLO', 'TESTING', 'ANALISIS', 'REUNION', 'DISEÑO'] as const;

interface AiAssignmentPanelProps {
  descripcion: string;
  estimacion?: number;
  storyPoints?: number;
}

export function AiAssignmentPanel({ descripcion, estimacion, storyPoints }: AiAssignmentPanelProps) {
  const [tipo, setTipo] = useState<string>('DESARROLLO');
  const { suggest, recommendations, isLoading, isError, reset } = useAiAssignment();

  const handleSuggest = () => {
    if (!descripcion.trim()) return;
    const request: AiAssignmentRequest = {
      descripcion,
      tipo,
      estimacion:   estimacion   ?? 0,
      storyPoints:  storyPoints  ?? 0,
    };
    suggest(request);
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3 bg-gray-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Tipo de tarea:</span>
          <select
            value={tipo}
            onChange={e => { setTipo(e.target.value); reset(); }}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E1E26]"
          >
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSuggest}
          disabled={isLoading || !descripcion.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#1E1E26] text-white rounded-lg
                     hover:bg-[#13131a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Consultando IA…
            </>
          ) : (
            <>✦ Sugerir asignación IA</>
          )}
        </button>
      </div>

      {isError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Error al contactar con la IA. Asegúrate de que{' '}
          <code className="font-mono">ANTHROPIC_API_KEY</code> está configurada en el servidor.
        </p>
      )}

      {recommendations.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="px-3 py-2 bg-[#1E1E26] flex items-center gap-2">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">
              ✦ Recomendación IA — Ranking de desarrolladores
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 bg-gray-50">
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Desarrollador</th>
                <th className="px-3 py-2 text-left font-medium">Score</th>
                <th className="px-3 py-2 text-left font-medium">Justificación</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec, i) => (
                <tr
                  key={rec.userId}
                  className={`border-b border-gray-50 last:border-0 transition-colors ${
                    i === 0 ? 'bg-emerald-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-3 py-2.5 font-semibold text-gray-400 text-xs">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-gray-900">{rec.nombre}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rec.puntuacion >= 80 ? 'bg-emerald-500'
                            : rec.puntuacion >= 60 ? 'bg-amber-400'
                            : 'bg-red-400'
                          }`}
                          style={{ width: `${rec.puntuacion}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-6">{rec.puntuacion}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[220px]">
                    {rec.justificacion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
