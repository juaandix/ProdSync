import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import ProjectAnalytics from '@/components/project-profile/ProjectAnalytics';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';
import { Task, TimeEntry } from '@/types/models';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('next/dynamic', () =>
  (_loader: unknown, _options?: unknown) => {
    const MockChart = ({ type }: { type?: string }) => (
      <div data-testid={`apex-chart-${type ?? 'chart'}`} />
    );
    MockChart.displayName = 'MockApexChart';
    return MockChart;
  }
);

jest.mock('@/services/taskService', () => ({
  taskService: { getAllByProjectId: jest.fn() },
}));

jest.mock('@/services/timeEntryService', () => ({
  timeEntryService: { getAll: jest.fn() },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const renderWithFreshClient = (ui: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

const PROJECT_ID = 'proj_1';

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_TASKS: Task[] = [
  { id: 't1', projectId: PROJECT_ID, descripcion: 'Design schema',      estado: 'COMPLETADO',  estimacion: 10 },
  { id: 't2', projectId: PROJECT_ID, descripcion: 'Build API',          estado: 'EN_PROGRESO', estimacion: 8  },
  { id: 't3', projectId: PROJECT_ID, descripcion: 'Write unit tests',   estado: 'PENDIENTE',   estimacion: 5  },
];

const MOCK_ENTRIES: TimeEntry[] = [
  { id: 'e1', taskId: 't1', userId: 'u1', date: '2024-01-10', hours: 12, description: 'Schema done',   type: 'Normal'     },
  { id: 'e2', taskId: 't2', userId: 'u1', date: '2024-01-11', hours: 5,  description: 'API in progress', type: 'Hora extra' },
];

// ── Suite ──────────────────────────────────────────────────────────────────

describe('ProjectAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (taskService.getAllByProjectId as jest.Mock).mockResolvedValue(MOCK_TASKS);
    (timeEntryService.getAll      as jest.Mock).mockResolvedValue(MOCK_ENTRIES);
  });

  // ── Loading ─────────────────────────────────────────────────────────────

  it('shows skeleton while loading', () => {
    (taskService.getAllByProjectId as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  // ── Empty states ──────────────────────────────────────────────────────

  it('shows empty state when no tasks', async () => {
    (taskService.getAllByProjectId as jest.Mock).mockResolvedValue([]);

    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    expect(await screen.findByText('Aún no hay tareas en este proyecto')).toBeInTheDocument();
  });

  it('shows "no hours" message when tasks exist but no entries', async () => {
    (timeEntryService.getAll as jest.Mock).mockResolvedValue([]);

    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    expect(
      await screen.findByText('Aún no hay horas registradas en este proyecto')
    ).toBeInTheDocument();
  });

  // ── KPI cards ──────────────────────────────────────────────────────────
  // totalReal = 12+5 = 17h | totalEst = 10+8+5 = 23h | completadas = 1

  it('renders correct KPI values', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    await waitFor(() => {
      expect(screen.getByText('17h')).toBeInTheDocument(); // registered
      expect(screen.getByText('23h')).toBeInTheDocument(); // estimated
      expect(screen.getByText('1 / 3')).toBeInTheDocument(); // completed
    });
  });

  it('shows "Por debajo del estimado" when real < estimated', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    await waitFor(() => {
      expect(screen.getByText('Por debajo del estimado')).toBeInTheDocument();
    });
  });

  // ── Estado de tareas — task list (new feature) ─────────────────────────

  it('renders "Estado de tareas" section heading', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    expect(await screen.findByText('Estado de tareas')).toBeInTheDocument();
  });

  it('renders task names grouped under their status', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    await waitFor(() => {
      expect(screen.getAllByText('Design schema').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Build API').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Write unit tests').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders status group headings with correct counts', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    await waitFor(() => {
      expect(screen.getByText(/COMPLETADO \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/EN_PROGRESO \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/PENDIENTE \(1\)/)).toBeInTheDocument();
    });
  });

  it('renders task links to project tasks page', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: 'Design schema' });
      expect(links.some(l => l.getAttribute('href') === `/projects/${PROJECT_ID}/tasks`)).toBe(true);
    });
  });

  it('renders donut chart', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('apex-chart-donut').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Hours by type section ─────────────────────────────────────────────

  it('renders "Horas por tipo de entrada" section heading', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    expect(await screen.findByText('Horas por tipo de entrada')).toBeInTheDocument();
  });

  // ── Estimado vs Registrado ────────────────────────────────────────────

  it('renders "Estimado vs Registrado por tarea" section', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    expect(await screen.findByText('Estimado vs Registrado por tarea')).toBeInTheDocument();
  });

  it('renders task names as links in the comparison chart', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: /Design schema/ });
      expect(links.some(l => l.getAttribute('href') === `/projects/${PROJECT_ID}/tasks`)).toBe(true);
    });
  });

  // ── Service calls ─────────────────────────────────────────────────────

  it('calls getAllByProjectId with the correct project id', async () => {
    renderWithFreshClient(<ProjectAnalytics projectId={PROJECT_ID} />);

    await waitFor(() => {
      expect(taskService.getAllByProjectId).toHaveBeenCalledWith(PROJECT_ID);
    });
  });
});
