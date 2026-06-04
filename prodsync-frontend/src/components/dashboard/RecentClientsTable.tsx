'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';

function InitialAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 text-xs font-semibold shrink-0">
      {initials}
    </div>
  );
}

export default function RecentClientsTable() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  });

  const recent = clients.slice(0, 5);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-white">Clientes recientes</h3>
        <Link
          href="/clients"
          className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          Ver todos →
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
              <div className="h-4 rounded bg-white/10 w-1/3" />
              <div className="h-4 rounded bg-white/10 w-1/3 ml-auto" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">No clients found.</div>
      ) : (
        <div className="space-y-1">
          {recent.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
            >
              <InitialAvatar name={client.name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors truncate">
                  {client.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{client.email}</p>
              </div>
              <span className="text-xs text-gray-500 shrink-0">{client.location}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
