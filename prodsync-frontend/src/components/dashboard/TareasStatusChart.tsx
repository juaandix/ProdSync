'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { TASK_STATUS } from '@/lib/chartColors';
import { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En progreso',
  COMPLETADO: 'Completado',
};

const COLORS = [TASK_STATUS.PENDIENTE, TASK_STATUS.EN_PROGRESO, TASK_STATUS.COMPLETADO];

/** `compact`: donut encima de la leyenda, para columnas estrechas. */
export default function TareasStatusChart({ compact = false }: { compact?: boolean }) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskService.getAll,
  });

  const pendiente = tasks.filter((t) => t.estado === 'PENDIENTE').length;
  const enProgreso = tasks.filter((t) => t.estado === 'EN_PROGRESO').length;
  const completado = tasks.filter((t) => t.estado === 'COMPLETADO').length;
  const total = tasks.length;

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: 'inherit',
      animations: {
        enabled: true,
        speed: 600,
        animateGradually: { enabled: true, delay: 60 },
        dynamicAnimation: { enabled: true, speed: 300 },
      },
    },
    theme: { mode: 'dark' },
    labels: [LABELS.PENDIENTE, LABELS.EN_PROGRESO, LABELS.COMPLETADO],
    colors: COLORS,
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: '#9ca3af',
              fontSize: '13px',
              formatter: () => String(total),
            },
            value: {
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: '600',
            },
          },
        },
      },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (v) => `${v} tarea${v !== 1 ? 's' : ''}` },
    },
    stroke: { width: 0 },
  };

  const stats = [
    { label: 'Pendiente', count: pendiente, color: TASK_STATUS.PENDIENTE },
    { label: 'En progreso', count: enProgreso, color: TASK_STATUS.EN_PROGRESO },
    { label: 'Completado', count: completado, color: TASK_STATUS.COMPLETADO },
  ];

  return (
    <div className={`rounded-2xl glass h-full ${compact ? 'p-5' : 'p-6'}`}>
      <div className={`flex items-start justify-between gap-3 ${compact ? 'mb-2' : 'mb-5'}`}>
        <div>
          <h3 className="text-base font-semibold text-white">Estado de tareas</h3>
          <p className="text-xs text-gray-500 mt-0.5">{total} tareas en total</p>
        </div>
        {total > 0 && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-success-400 bg-success-500/10 whitespace-nowrap">
            {Math.round((completado / total) * 100)}% hecho
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="h-[220px] flex items-center justify-center">
          <span className="text-sm text-gray-500">Cargando...</span>
        </div>
      ) : total === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">
          Sin tareas registradas
        </div>
      ) : (
        <div className={compact ? 'flex flex-col items-center gap-3' : 'flex items-center gap-6'}>
          <div className="flex-shrink-0">
            <ReactApexChart
              options={options}
              series={[pendiente, enProgreso, completado]}
              type="donut"
              height={compact ? 150 : 200}
              width={compact ? 150 : 200}
            />
          </div>
          <div className={`flex flex-col flex-1 ${compact ? 'gap-2 w-full' : 'gap-3'}`}>
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-sm text-gray-400">{s.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{s.count}</span>
                  <span className="text-xs text-gray-600">
                    {total > 0 ? `${Math.round((s.count / total) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
