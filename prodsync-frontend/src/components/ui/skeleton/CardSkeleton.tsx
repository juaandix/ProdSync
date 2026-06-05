import React from 'react';

interface Props {
  count?: number;
  height?: string;
}

export default function CardSkeleton({ count = 4, height = 'h-24' }: Props) {
  return (
    <div className={`grid grid-cols-2 xl:grid-cols-${count} gap-4 animate-pulse`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} rounded-2xl bg-white/[0.04] border border-white/[0.06]`} />
      ))}
    </div>
  );
}
