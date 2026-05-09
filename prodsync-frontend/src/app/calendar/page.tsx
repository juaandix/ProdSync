'use client';

import React, { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntryService } from '@/services/timeEntryService';
import { projectService } from '@/services/projectService';
import { calendarEventService } from '@/services/calendarEventService';
import { useSidebar } from '@/context/SidebarContext';

const TYPE_COLORS: Record<string, string> = {
  DESARROLLO: '#3b82f6',
  ANALISIS:   '#8b5cf6',
  TESTING:    '#10b981',
  REUNION:    '#f59e0b',
  DISEÑO:     '#ec4899',
};

const EVENT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6'];

type FilterKey = 'timeEntries' | 'projects' | 'custom';
const DEFAULT_FILTERS: Record<FilterKey, boolean> = { timeEntries: true, projects: true, custom: true };

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const { isExpanded, isHovered } = useSidebar();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', color: EVENT_COLORS[0] });

  const { data: timeEntries = [] } = useQuery({ queryKey: ['time-entries'], queryFn: () => timeEntryService.getAll() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => projectService.getAll() });
  const { data: customEvents = [] } = useQuery({ queryKey: ['calendar-events'], queryFn: () => calendarEventService.getAll() });

  const createEvent = useMutation({
    mutationFn: calendarEventService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowModal(false);
      setForm({ title: '', description: '', startDate: '', endDate: '', color: EVENT_COLORS[0] });
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => { calendarRef.current?.getApi().updateSize(); }, 320);
    return () => clearTimeout(timer);
  }, [isExpanded, isHovered]);

  const timeEntryEvents = filters.timeEntries ? timeEntries.map(e => ({
    id: `te-${e.id}`, title: `${e.hours}h — ${e.description ?? 'Time entry'}`, date: e.date,
    backgroundColor: TYPE_COLORS[e.type ?? ''] ?? '#6b7280', borderColor: 'transparent', textColor: '#fff',
  })) : [];

  const projectEvents = filters.projects ? projects.filter(p => p.endDate).map(p => ({
    id: `proj-${p.id}`, title: `📁 ${p.name}`, date: p.endDate,
    backgroundColor: '#1E1E26', borderColor: '#A7ABB4', textColor: '#fff',
  })) : [];

  const customEventsForCalendar = filters.custom ? customEvents.map(e => ({
    id: `ev-${e.id}`, title: e.title, start: e.startDate, end: e.endDate,
    backgroundColor: e.color, borderColor: 'transparent', textColor: '#fff', allDay: e.allDay ?? true,
  })) : [];

  const events = [...timeEntryEvents, ...projectEvents, ...customEventsForCalendar];

  const handleDateClick = (info: { dateStr: string }) => {
    setForm(f => ({ ...f, startDate: info.dateStr, endDate: info.dateStr }));
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate({ title: form.title, description: form.description, startDate: form.startDate, endDate: form.endDate || undefined, color: form.color, allDay: true });
  };

  const toggleFilter = (key: FilterKey) => setFilters(f => ({ ...f, [key]: !f[key] }));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Calendar</h2>

      {/* Calendar card */}
      <div className="relative rounded-2xl border border-gray-200 bg-white p-5 text-gray-900
        [&_.fc-button]:!text-xs [&_.fc-button]:!px-2 [&_.fc-button]:!py-1 [&_.fc-button]:!rounded-md [&_.fc-button]:!font-medium
        [&_.fc-toolbar-title]:!text-sm [&_.fc-toolbar-title]:!font-semibold
        [&_.fc-toolbar]:!gap-2 [&_.fc-toolbar-chunk]:!flex [&_.fc-toolbar-chunk]:!items-center [&_.fc-toolbar-chunk]:!gap-1
        [&_.fc-button-group]:!gap-0.5
        [&_.fc-filterBtn-button]:!bg-gray-100 [&_.fc-filterBtn-button]:!text-gray-700 [&_.fc-filterBtn-button]:!border-gray-300
        [&_.fc-addEventBtn-button]:!bg-[#1E1E26] [&_.fc-addEventBtn-button]:!text-white [&_.fc-addEventBtn-button]:!border-[#1E1E26]">

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          customButtons={{
            filterBtn: {
              text: '⚙ Filtrar',
              click: () => setShowFilter(f => !f),
            },
            addEventBtn: {
              text: '+ Añadir evento',
              click: () => { setForm(f => ({ ...f, startDate: '', endDate: '' })); setShowModal(true); },
            },
          }}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'filterBtn addEventBtn dayGridMonth,timeGridWeek,listWeek',
          }}
          events={events}
          height="auto"
          locale="es"
          dateClick={handleDateClick}
          buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', list: 'Lista' }}
        />

        {/* Filter dropdown — posicionado dentro de la tarjeta */}
        {showFilter && (
          <div className="absolute top-14 right-5 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 p-3 space-y-2">
            {([['timeEntries', 'Time Entries'], ['projects', 'Proyectos'], ['custom', 'Eventos']] as [FilterKey, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={filters[key]} onChange={() => toggleFilter(key)} className="rounded" />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-sm text-white/80">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            {type}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-sm text-white/80">
          <span className="inline-block w-3 h-3 rounded-full bg-[#1E1E26] border border-[#A7ABB4]" />
          Fin de proyecto
        </span>
      </div>

      {/* Modal añadir evento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md text-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nuevo evento</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A7ABB4]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A7ABB4]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inicio *</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A7ABB4]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A7ABB4]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={createEvent.isPending}
                  className="px-4 py-2 text-sm text-white bg-[#1E1E26] rounded-lg hover:bg-[#13131a] disabled:opacity-50">
                  {createEvent.isPending ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
