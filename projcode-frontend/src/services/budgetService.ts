/**
 * budgetService
 *
 * Servicio de gestión de presupuestos.
 *
 * ESTADO ACTUAL: Utiliza datos mock en memoria (sin llamadas reales al backend).
 * Cuando el backend tenga el módulo de presupuestos implementado, reemplazar
 * MOCK_BUDGETS y las operaciones CRUD por llamadas a apiClient.
 *
 * Operaciones disponibles:
 *  getAll()       → lista todos los presupuestos
 *  getById()      → obtiene un presupuesto por ID
 *  create()       → crea un nuevo presupuesto calculando totales por línea
 *  update()       → actualiza un presupuesto existente recalculando totales
 *  delete()       → elimina un presupuesto
 *  updateStatus() → cambia el estado de un presupuesto (atajo sobre update)
 */
import { Budget, BudgetLine } from '@/types/models';
import { BudgetFormData } from '@/schemas/budgetSchema';

// ---------------------------------------------------------------------------
// MOCK DATA — reemplazar por llamadas reales al backend cuando esté disponible
// ---------------------------------------------------------------------------

let MOCK_BUDGETS: Budget[] = [
  {
    id: '1',
    numero: 'PRE-2024-001',
    title: 'Desarrollo aplicación web corporativa',
    clientId: '1',
    clientName: 'Acme Corp',
    projectId: '1',
    projectName: 'Portal Corporativo',
    status: 'accepted',
    createdAt: '2024-01-15',
    validUntil: '2024-02-15',
    lines: [
      { id: 'l1', concept: 'Análisis y diseño', quantity: 40, unitPrice: 75, total: 3000 },
      { id: 'l2', concept: 'Desarrollo frontend', quantity: 120, unitPrice: 65, total: 7800 },
      { id: 'l3', concept: 'Desarrollo backend', quantity: 80, unitPrice: 70, total: 5600 },
    ],
    totalAmount: 16400,
    notes: 'Precio por hora. IVA no incluido.',
  },
  {
    id: '2',
    numero: 'PRE-2024-002',
    title: 'Mantenimiento anual plataforma',
    clientId: '2',
    clientName: 'TechStart SL',
    status: 'sent',
    createdAt: '2024-03-01',
    validUntil: '2024-04-01',
    lines: [
      { id: 'l4', concept: 'Soporte técnico mensual', quantity: 12, unitPrice: 500, total: 6000 },
      { id: 'l5', concept: 'Actualizaciones de seguridad', quantity: 1, unitPrice: 1200, total: 1200 },
    ],
    totalAmount: 7200,
  },
  {
    id: '3',
    numero: 'PRE-2024-003',
    title: 'Consultoría transformación digital',
    clientId: '3',
    clientName: 'Innovate SA',
    status: 'draft',
    createdAt: '2024-04-10',
    validUntil: '2024-05-10',
    lines: [
      { id: 'l6', concept: 'Auditoría procesos', quantity: 20, unitPrice: 90, total: 1800 },
      { id: 'l7', concept: 'Plan de transformación', quantity: 30, unitPrice: 90, total: 2700 },
    ],
    totalAmount: 4500,
  },
];

/** Contador incremental para generar IDs únicos en el mock. */
let nextId = 4;

/**
 * calcTotal
 * Suma los totales de todas las líneas del presupuesto.
 * Cada línea calcula su total como `quantity * unitPrice`.
 */
const calcTotal = (lines: BudgetLine[]) =>
  lines.reduce((sum, l) => sum + l.total, 0);

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const budgetService = {
  /** Lista todos los presupuestos (copia superficial para evitar mutaciones externas). */
  async getAll(): Promise<Budget[]> {
    return [...MOCK_BUDGETS];
  },

  /** Obtiene un presupuesto por su ID. Lanza error si no existe. */
  async getById(id: string): Promise<Budget> {
    const budget = MOCK_BUDGETS.find(b => b.id === id);
    if (!budget) throw new Error(`Budget ${id} not found`);
    return { ...budget };
  },

  /**
   * Crea un nuevo presupuesto.
   * - Recalcula el `total` de cada línea como `quantity * unitPrice`.
   * - Genera IDs únicos para las líneas usando `Date.now()` + índice.
   * - Calcula el `totalAmount` sumando todos los totales de línea.
   */
  async create(data: BudgetFormData & { clientName?: string; projectName?: string }): Promise<Budget> {
    const lines: BudgetLine[] = data.lines.map((l, i) => ({
      ...l,
      id: `l_${Date.now()}_${i}`,  // ID temporal único mientras no haya backend
      total: l.quantity * l.unitPrice,
    }));
    const budget: Budget = {
      id: String(nextId++),
      numero: data.numero,
      title: data.title,
      clientId: data.clientId,
      clientName: data.clientName,
      projectId: data.projectId,
      projectName: data.projectName,
      status: data.status,
      createdAt: data.createdAt,
      validUntil: data.validUntil,
      lines,
      totalAmount: calcTotal(lines),
      notes: data.notes,
    };
    MOCK_BUDGETS.push(budget);
    return budget;
  },

  /**
   * Actualiza un presupuesto existente.
   * - Si `data.lines` no se proporciona, conserva las líneas actuales.
   * - Recalcula totales de línea y el `totalAmount` global.
   * - Preserva las líneas que ya tienen ID; las nuevas reciben ID temporal.
   */
  async update(id: string, data: Partial<BudgetFormData> & { clientName?: string; projectName?: string }): Promise<Budget> {
    const index = MOCK_BUDGETS.findIndex(b => b.id === id);
    if (index === -1) throw new Error(`Budget ${id} not found`);
    const lines: BudgetLine[] = (data.lines ?? MOCK_BUDGETS[index].lines).map((l, i) => ({
      ...l,
      id: l.id || `l_${Date.now()}_${i}`,
      total: l.quantity * l.unitPrice,
    }));
    const updated: Budget = {
      ...MOCK_BUDGETS[index],
      ...data,
      lines,
      totalAmount: calcTotal(lines),
    };
    MOCK_BUDGETS[index] = updated;
    return updated;
  },

  /** Elimina un presupuesto por su ID. */
  async delete(id: string): Promise<void> {
    MOCK_BUDGETS = MOCK_BUDGETS.filter(b => b.id !== id);
  },

  /**
   * Cambia el estado de un presupuesto.
   * Atajo sobre `update()` para transiciones de estado (draft → sent → accepted/rejected).
   */
  async updateStatus(id: string, status: Budget['status']): Promise<Budget> {
    return budgetService.update(id, { status });
  },
};
