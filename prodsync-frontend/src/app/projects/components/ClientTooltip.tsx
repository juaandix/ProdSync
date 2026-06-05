"use client";
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Client } from '@/types/models';
import { Mail, MapPin, User, ExternalLink } from 'lucide-react';

interface Props {
  client: Client;
}

export default function ClientTooltip({ client }: Props) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<'bottom' | 'top'>('bottom');
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos(rect.bottom + 180 > window.innerHeight ? 'top' : 'bottom');
    }
    setVisible(true);
  };

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {/* Trigger */}
      <Link
        href={`/clients/${client.id}`}
        onClick={e => e.stopPropagation()}
        className="text-sm text-gray-400 hover:text-gray-200 transition-colors underline-offset-2 hover:underline"
      >
        {client.name}
      </Link>

      {/* Tooltip */}
      <div className={`absolute z-50 left-0 w-60 transition-all duration-150 ${
        pos === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
      } ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>

        {/* Arrow */}
        <div className={`absolute left-4 w-2 h-2 bg-[#1a1c25] border-white/[0.08] rotate-45 ${
          pos === 'bottom'
            ? '-top-1 border-t border-l'
            : '-bottom-1 border-b border-r'
        }`} />

        <div className="rounded-xl border border-white/[0.08] bg-[#1a1c25] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-500/20 text-brand-400 font-semibold text-sm shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{client.name}</p>
              {client.identification && (
                <p className="text-xs text-gray-500 truncate">{client.identification}</p>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="px-4 py-3 space-y-2">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-gray-600 shrink-0" />
                <span className="text-xs text-gray-400 truncate">{client.email}</span>
              </div>
            )}
            {client.contactPerson && (
              <div className="flex items-center gap-2">
                <User size={12} className="text-gray-600 shrink-0" />
                <span className="text-xs text-gray-400 truncate">{client.contactPerson}</span>
              </div>
            )}
            {client.location && (
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-gray-600 shrink-0" />
                <span className="text-xs text-gray-400 truncate">{client.location}{client.province ? `, ${client.province}` : ''}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/[0.06]">
            <Link
              href={`/clients/${client.id}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              <ExternalLink size={11} />
              View full profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
