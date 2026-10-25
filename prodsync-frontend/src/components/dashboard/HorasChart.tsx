'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { timeEntryService } from '@/services/timeEntryService';
import { CATEGORICAL, MUTED_BAR } from '@/lib/chartColors';
import { monthToDateDelta } from './TeamOverview';
import { ApexOptions } from 'apexcharts';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function HorasChart() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: timeEntryService.getAll,
  });

  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MESES[d.getMonth()] };
  });

  const data = last6.map(({ year, month }) => {
    const total = entries
      .filter((e) => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((acc, e) => acc + (e.hours || 0), 0);
    return Math.round(total * 10) / 10;
  });

  const current = data[data.length - 1];
  const delta = monthToDateDelta(entries);
  const sixMonthTotal = Math.round(data.reduce((a, b) => a + b, 0));

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
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
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '50%', distributed: true, dataLabels: { position: 'top' } },
    },
    legend: { show: false },
    // Solo la barra del mes en curso lleva su valor encima
    dataLabels: {
      enabled: true,
      formatter: (v, { dataPointIndex }) => (dataPointIndex === last6.length - 1 ? `${v}h` : ''),
      offsetY: -22,
      style: { fontSize: '11px', fontWeight: 600, colors: ['#ffffff'] },
      background: { enabled: true, foreColor: '#ffffff', borderRadius: 999, padding: 6, borderWidth: 0, opacity: 0.12 },
    },
    // Solo el mes en curso lleva el acento; el resto queda en segundo plano
    colors: last6.map((_, i) => (i === last6.length - 1 ? CATEGORICAL[0] : MUTED_BAR)),
    states: { hover: { filter: { type: 'lighten' } } },
    grid: {
      borderColor: 'rgba(255,255,255,0.06)',
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: last6.map((m) => m.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#6b7280', fontSize: '12px' } },
    },
    yaxis: {
      labels: {
        style: { colors: '#6b7280', fontSize: '12px' },
        formatter: (v) => `${v}h`,
      },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (v) => `${v} horas` },
    },
  };

  return (
    <div className="rounded-2xl glass p-6 h-full">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Horas registradas</h3>
          <p className="text-xs text-gray-500 mt-0.5">Últimos 6 meses · {sixMonthTotal}h</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-white tracking-tight tabular-nums">{current}h</p>
          <p className="text-[11px] text-gray-500">
            este mes
            {delta !== null && (
              <span className={`ml-1.5 font-medium px-1.5 py-0.5 rounded-full ${delta >= 0 ? 'text-success-400 bg-success-500/10' : 'text-error-400 bg-error-500/10'}`}>
                {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
              </span>
            )}
          </p>
          {delta !== null && (
            <p className="text-[10px] text-gray-600 mt-0.5">vs mismo tramo del mes anterior</p>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="h-[220px] flex items-center justify-center">
          <span className="text-sm text-gray-500">Cargando...</span>
        </div>
      ) : (
        <ReactApexChart
          options={options}
          series={[{ name: 'Horas', data }]}
          type="bar"
          height={220}
        />
      )}
    </div>
  );
}
