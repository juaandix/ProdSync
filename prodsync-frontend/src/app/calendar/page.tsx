'use client';

import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntryService } from '@/services/timeEntryService';
import { projectService } from '@/services/projectService';
import { calendarEventService } from '@/services/calendarEventService';
import { X, Loader2, SlidersHorizontal, Plus } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  DESARROLLO: '#3b82f6',
  ANALISIS:   '#8b5cf6',
  TESTING:    '#10b981',
  REUNION:    '#f59e0b',
  DISEÑO:     '#ec4899',
};

const EVENT_COLORS = ['#465fff', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6'];

type FilterKey = 'timeEntries' | 'projects' | 'custom';
const DEFAULT_FILTERS: Record<FilterKey, boolean> = { timeEntries: true, projects: true, custom: true };

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 transition-colors [color-scheme:dark]";
const labelClass = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider";

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', color: EVENT_COLORS[0] });

  const { data: timeEntries = [] } = useQuery({ queryKey: ['time-entries'], queryFn: timeEntryService.getAll });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectService.getAll });
  const { data: customEvents = [] } = useQuery({ queryKey: ['calendar-events'], queryFn: calendarEventService.getAll });

  const createEvent = useMutation({
    mutationFn: calendarEventService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowModal(false);
      setForm({ title: '', description: '', startDate: '', endDate: '', color: EVENT_COLORS[0] });
    },
  });

  useEffect(() => {
    if (!showFilter) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById('calendar-filter-panel');
      if (el && !el.contains(e.target as Node)) setShowFilter(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilter]);

  const timeEntryEvents = filters.timeEntries ? timeEntries.map(e => ({
    id: `te-${e.id}`,
    title: `${e.hours}h · ${e.description ?? 'Time entry'}`,
    date: e.date,
    backgroundColor: TYPE_COLORS[e.type ?? ''] ?? '#6b7280',
    borderColor: 'transparent',
    textColor: '#fff',
  })) : [];

  const projectEvents = filters.projects ? projects.filter(p => p.endDate).map(p => ({
    id: `proj-${p.id}`,
    title: `📁 ${p.name}`,
    date: p.endDate,
    backgroundColor: '#465fff22',
    borderColor: '#465fff66',
    textColor: '#93a3ff',
  })) : [];

  const customEventsCalendar = filters.custom ? customEvents.map(e => ({
    id: `ev-${e.id}`,
    title: e.title,
    start: e.startDate,
    end: e.endDate,
    backgroundColor: e.color,
    borderColor: 'transparent',
    textColor: '#fff',
    allDay: e.allDay ?? true,
  })) : [];

  const events = [...timeEntryEvents, ...projectEvents, ...customEventsCalendar];

  const handleDateClick = (info: { dateStr: string }) => {
    setForm(f => ({ ...f, startDate: info.dateStr, endDate: info.dateStr }));
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate({ title: form.title, description: form.description, startDate: form.startDate, endDate: form.endDate || undefined, color: form.color, allDay: true });
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Calendar</h2>
          <p className="text-xs text-gray-500 mt-0.5">Time entries, project deadlines and custom events</p>
        </div>
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowFilter(f => !f)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${showFilter ? 'text-brand-400 bg-brand-500/10 border-brand-500/20' : 'text-gray-400 hover:text-white border-white/[0.08] hover:border-white/20'}`}
          >
            <SlidersHorizontal size={14} /> Filters
          </button>

          {showFilter && (
            <div id="calendar-filter-panel" className="absolute top-full right-28 mt-2 w-52 rounded-xl border border-white/[0.08] bg-[#161820] shadow-xl z-50 p-3 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Show</p>
              {([['timeEntries', 'Time Entries'], ['projects', 'Project Deadlines'], ['custom', 'Custom Events']] as [FilterKey, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer">
                  <input type="checkbox" checked={filters[key]} onChange={() => setFilters(f => ({ ...f, [key]: !f[key] }))}
                    className="w-4 h-4 rounded accent-brand-500 cursor-pointer" />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          )}

          <button
            onClick={() => { setForm(f => ({ ...f, startDate: '', endDate: '' })); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-theme-purple-500 hover:opacity-90 hover:shadow-lg hover:shadow-brand-500/25 active:scale-95 transition-all"
          >
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 overflow-hidden
        [&_.fc-button]:!bg-white/[0.06] [&_.fc-button]:!border-white/[0.08] [&_.fc-button]:!text-gray-300 [&_.fc-button]:!text-xs [&_.fc-button]:!px-3 [&_.fc-button]:!py-1.5 [&_.fc-button]:!rounded-lg [&_.fc-button]:!font-medium
        [&_.fc-button:hover]:!bg-white/[0.10] [&_.fc-button:hover]:!text-white [&_.fc-button:hover]:!border-white/[0.12]
        [&_.fc-button-primary:not(:disabled).fc-button-active]:!bg-brand-500/20 [&_.fc-button-primary:not(:disabled).fc-button-active]:!text-brand-400 [&_.fc-button-primary:not(:disabled).fc-button-active]:!border-brand-500/30
        [&_.fc-toolbar-title]:!text-base [&_.fc-toolbar-title]:!font-semibold [&_.fc-toolbar-title]:!text-white
        [&_.fc-toolbar]:!gap-3 [&_.fc-toolbar-chunk]:!flex [&_.fc-toolbar-chunk]:!items-center [&_.fc-toolbar-chunk]:!gap-1.5
        [&_.fc-day-today]:!bg-brand-500/[0.06]
        [&_.fc-col-header-cell-cushion]:!text-gray-500 [&_.fc-col-header-cell-cushion]:!text-xs [&_.fc-col-header-cell-cushion]:!font-medium [&_.fc-col-header-cell-cushion]:!uppercase [&_.fc-col-header-cell-cushion]:!tracking-wider
        [&_.fc-daygrid-day-number]:!text-gray-400 [&_.fc-daygrid-day-number]:!text-sm
        [&_.fc-scrollgrid]:!border-white/[0.06] [&_.fc-scrollgrid-section>*]:!border-white/[0.04]
        [&_.fc-event]:!rounded-md [&_.fc-event]:!text-xs [&_.fc-event-title]:!font-medium [&_.fc-event]:!px-1
        [&_.fc-list-day-cushion]:!bg-white/[0.04] [&_.fc-list-day-text]:!text-gray-400 [&_.fc-list-day-side-text]:!text-gray-600 [&_.fc-list-event-title]:!text-gray-300 [&_.fc-list-event:hover_td]:!bg-white/[0.03]
        [&_.fc-timegrid-slot-label-cushion]:!text-gray-500 [&_.fc-timegrid-slot-label-cushion]:!text-xs
        dark">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }}
          events={events}
          height="auto"
          locale="es"
          dateClick={handleDateClick}
          buttonText={{ today: 'Today', month: 'Month', week: 'Week', list: 'List' }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-1">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {type}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0 bg-brand-500/40 border border-brand-500/60" />
          Project deadline
        </span>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#161820] rounded-2xl border border-white/[0.08] shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-white">New Event</h3>
                <p className="text-xs text-gray-500 mt-0.5">Add a custom event to the calendar</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Event title" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Optional..." className={`${inputClass} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start *</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>End <span className="text-gray-600 normal-case">(opt.)</span></label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createEvent.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50">
                  {createEvent.isPending && <Loader2 size={14} className="animate-spin" />}
                  {createEvent.isPending ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
