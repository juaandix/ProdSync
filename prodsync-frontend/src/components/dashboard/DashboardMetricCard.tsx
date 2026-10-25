'use client';
import React from 'react';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

interface DashboardMetricCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  /** Cifra principal de la pantalla: se pinta con el acento. Solo una por vista. */
  highlight?: boolean;
}

export default function DashboardMetricCard({ title, value, description, icon, trend, highlight }: DashboardMetricCardProps) {
  return (
    <div className={`rounded-2xl p-5 lift ${highlight ? 'glass-accent' : 'glass hover:border-white/[0.11]'}`}>
      <div className="flex items-start justify-between mb-4">
        <span className={`text-xs font-medium uppercase tracking-wider ${highlight ? 'text-white/75' : 'text-gray-400'}`}>{title}</span>
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${
          highlight ? 'bg-white/15 text-white' : 'bg-brand-500/10 text-brand-400'
        }`}>
          {icon}
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight"><AnimatedNumber value={value} /></p>
          {description && (
            <p className={`mt-1 text-xs ${highlight ? 'text-white/70' : 'text-gray-500'}`}>{description}</p>
          )}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
            highlight
              ? 'text-white bg-white/15'
              : trend.positive
                ? 'text-success-400 bg-success-500/10'
                : 'text-error-400 bg-error-500/10'
          }`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
