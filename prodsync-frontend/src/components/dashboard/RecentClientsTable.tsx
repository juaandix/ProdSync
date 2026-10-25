'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';
import { projectService } from '@/services/projectService';
import ClientLogo from '@/components/ui/avatar/ClientLogo';

/** `compact`: cuatro filas y sin correo, para columnas estrechas. */
export default function RecentClientsTable({ compact = false }: { compact?: boolean }) {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  });

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectService.getAll });
  const projectCount = (clientId: string) => projects.filter((p) => p.client?.id === clientId).length;

  const recent = clients.slice(0, compact ? 4 : 5);

  return (
    <div className={`rounded-2xl glass h-full flex flex-col ${compact ? 'p-5' : 'p-6'}`}>
      <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-6'}`}>
        <h3 className="text-base font-semibold text-white">Clientes recientes</h3>
        <Link
          href="/clients"
          className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          Ver todos →
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-3 shimmer rounded-lg">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
              <div className="h-4 rounded bg-white/10 w-1/3" />
              <div className="h-4 rounded bg-white/10 w-1/3 ml-auto" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">Todavía no hay clientes.</div>
      ) : (
        <div className="space-y-1 stagger-children">
          {recent.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
            >
              <ClientLogo client={client} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors truncate">
                  {client.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{compact ? client.location : client.email}</p>
              </div>
              {compact ? (
                <span className="text-[11px] text-gray-400 bg-white/[0.06] rounded-full px-2 py-0.5 shrink-0 tabular-nums">
                  {projectCount(client.id)} proy.
                </span>
              ) : (
                <span className="text-xs text-gray-500 shrink-0">{client.location}</span>
              )}
            </Link>
          ))}
        </div>
      )}
      {compact && clients.length > 0 && (
        <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {clients.length} clientes · {new Set(clients.map((c) => c.province).filter(Boolean)).size} provincias
          </span>
          <span className="text-gray-400 tabular-nums">{projects.length} proyectos</span>
        </div>
      )}
    </div>
  );
}
