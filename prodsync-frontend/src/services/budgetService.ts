import { Budget } from '@/types/models';
import { BudgetFormData } from '@/schemas/budgetSchema';
import apiClient from '@/lib/apiClient';

const BASE = '/presupuestos';

const mapBudget = (b: Budget): Budget => ({
  ...b,
  id: String(b.id),
  clientId: String(b.clientId),
  projectId: b.projectId ? String(b.projectId) : undefined,
});

export const budgetService = {
  async getAll(): Promise<Budget[]> {
    const { data } = await apiClient.get<Budget[]>(BASE);
    return data.map(mapBudget);
  },

  async getById(id: string): Promise<Budget> {
    const { data } = await apiClient.get<Budget>(`${BASE}/${id}`);
    return mapBudget(data);
  },

  async create(data: BudgetFormData & { clientName?: string; projectName?: string }): Promise<Budget> {
    const payload = {
      numero: data.numero,
      title: data.title,
      clientId: Number(data.clientId),
      projectId: data.projectId ? Number(data.projectId) : null,
      status: data.status,
      createdAt: data.createdAt,
      validUntil: data.validUntil,
      lines: data.lines.map(l => ({
        concept: l.concept,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        total: l.quantity * l.unitPrice,
      })),
      notes: data.notes ?? null,
    };
    const { data: created } = await apiClient.post<Budget>(BASE, payload);
    return mapBudget(created);
  },

  async update(id: string, data: Partial<BudgetFormData> & { clientName?: string; projectName?: string }): Promise<Budget> {
    const payload = {
      numero: data.numero,
      title: data.title,
      clientId: data.clientId ? Number(data.clientId) : undefined,
      projectId: data.projectId ? Number(data.projectId) : null,
      status: data.status,
      createdAt: data.createdAt,
      validUntil: data.validUntil,
      lines: data.lines?.map(l => ({
        concept: l.concept,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        total: l.quantity * l.unitPrice,
      })),
      notes: data.notes ?? null,
    };
    const { data: updated } = await apiClient.put<Budget>(`${BASE}/${id}`, payload);
    return mapBudget(updated);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },

  async updateStatus(id: string, status: Budget['status']): Promise<Budget> {
    const { data } = await apiClient.patch<Budget>(`${BASE}/${id}/status`, { status });
    return mapBudget(data);
  },
};
