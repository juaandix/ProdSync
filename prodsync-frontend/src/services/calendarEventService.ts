import apiClient from '@/lib/apiClient';

export type CalendarEvent = {
  id?: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  color: string;
  allDay?: boolean;
};

const BASE = '/calendar-events';

export const calendarEventService = {
  async getAll(): Promise<CalendarEvent[]> {
    const { data } = await apiClient.get<CalendarEvent[]>(BASE);
    return data;
  },
  async create(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const { data } = await apiClient.post<CalendarEvent>(BASE, event);
    return data;
  },
  async delete(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
