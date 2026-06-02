'use client';
import React from 'react';

interface DashboardMetricCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
}

export default function DashboardMetricCard({ title, value, description, icon, trend }: DashboardMetricCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 hover:bg-white/[0.06] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{title}</span>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
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
