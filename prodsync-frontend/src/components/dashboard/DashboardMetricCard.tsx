'use client';
import React from 'react';

interface DashboardMetricCardProps {
  title: string;
  value: number | string;
  description?: string;
}

export default function DashboardMetricCard({ title, value, description }: DashboardMetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
      <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{value}</h4>
      {description && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description}</p>
      )}
    </div>
  );
}
