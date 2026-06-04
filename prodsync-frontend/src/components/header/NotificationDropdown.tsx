"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { notificationService, AppNotification, NotificationType } from "@/services/notificationService";
import { useAuth } from "@/context/AuthContext";

const iconForType: Record<NotificationType, { bg: string; icon: React.ReactNode }> = {
  task_pending: {
    bg: "bg-amber-100",
    icon: (
      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  task_in_progress: {
    bg: "bg-blue-100",
    icon: (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  project_deadline: {
    bg: "bg-orange-100",
    icon: (
      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  project_overdue: {
    bg: "bg-red-100",
    icon: (
      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
};

export default function NotificationDropdown() {
  const { user, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch {
      // silencioso si no hay sesión
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      load();
    }
  }, [load, authLoading, user]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Marcar todas como leídas al cerrar
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-white transition-colors bg-white/[0.1] border border-gray-600 rounded-full hover:bg-white/[0.15] h-11 w-11"
        onClick={isOpen ? handleClose : handleOpen}
      >
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 z-10 flex items-center justify-center h-4 w-4 rounded-full bg-orange-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={handleClose}
        className="absolute -right-[240px] mt-[17px] flex h-[460px] w-[340px] flex-col rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[360px] lg:right-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-semibold text-gray-800 dark:text-white">Notificaciones</h5>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista */}
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
          {loading && (
            <li className="flex items-center justify-center h-full">
              <span className="text-sm text-gray-400">Cargando...</span>
            </li>
          )}

          {!loading && notifications.length === 0 && (
            <li className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
              <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-sm">Sin notificaciones</span>
            </li>
          )}

          {!loading && notifications.map((n) => {
            const { bg, icon } = iconForType[n.type];
            const isRead = readIds.has(n.id);
            return (
              <li key={n.id}>
                <Link
                  href={n.link}
                  onClick={handleClose}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isRead ? "opacity-60" : ""}`}
                >
                  <span className={`mt-0.5 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${bg}`}>
                    {icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-700 dark:text-white truncate">{n.title}</span>
                      <span className="flex-shrink-0 text-xs text-gray-400">{n.timeLabel}</span>
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.description}</span>
                  </span>
                  {!isRead && (
                    <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={load}
            className="w-full text-xs text-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
