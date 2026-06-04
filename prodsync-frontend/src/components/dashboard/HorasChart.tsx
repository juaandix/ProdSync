'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { timeEntryService } from '@/services/timeEntryService';
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

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'inherit',
    },
    theme: { mode: 'dark' },
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '50%' },
    },
    dataLabels: { enabled: false },
    colors: ['#6366f1'],
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
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-white">Horas registradas</h3>
        <p className="text-xs text-gray-500 mt-0.5">Últimos 6 meses</p>
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
