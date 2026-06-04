import React from 'react';

interface Props {
  rows?: number;
  cols?: number;
}

export default function TableSkeleton({ rows = 6, cols = 5 }: Props) {
  return (
    <div className="w-full animate-pulse">
      {/* Header row */}
      <div className="flex gap-4 pb-3 border-b border-white/[0.06] mb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={`h-3 rounded bg-white/[0.06] ${i === 0 ? 'w-1/4' : i === cols - 1 ? 'w-16 ml-auto' : 'flex-1'}`} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5 border-b border-white/[0.04]">
          <div className="h-9 w-9 rounded-full bg-white/[0.06] shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded bg-white/[0.06] w-2/5" />
            <div className="h-2.5 rounded bg-white/[0.06] w-1/4" />
          </div>
          {Array.from({ length: cols - 2 }).map((_, j) => (
            <div key={j} className="h-3 rounded bg-white/[0.06] w-1/6" />
          ))}
          <div className="flex gap-1 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
            <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
