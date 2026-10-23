'use client';
import React from 'react';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

interface DashboardMetricCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
}

export default function DashboardMetricCard({ title, value, description, icon, trend }: DashboardMetricCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 hover:bg-white/[0.06] hover:border-white/[0.09] transition-colors duration-200">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{title}</span>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400">
          {icon}
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight"><AnimatedNumber value={value} /></p>
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
            trend.positive
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
