import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import UserAnalytics from '@/components/user-profile/UserAnalytics';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';
import { projectService } from '@/services/projectService';
import { Task, TimeEntry, Project } from '@/types/models';

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

// Component now uses getAllByProjectId (via useQueries), not getAll
jest.mock('@/services/taskService', () => ({
  taskService: { getAllByProjectId: jest.fn() },
}));

jest.mock('@/services/timeEntryService', () => ({
  timeEntryService: { getByUserId: jest.fn() },
}));

jest.mock('@/services/projectService', () => ({
  projectService: { getAll: jest.fn() },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const renderWithFreshClient = (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

const USER_ID = '42';

// ── Fixtures (DB-correct enum values) ──────────────────────────────────────

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Project Alpha', description: '', startDate: '2024-01-01', endDate: '2024-12-31', status: 'EN_PROGRESO' },
  { id: '2', name: 'Project Beta',  description: '', startDate: '2024-03-01', endDate: '2024-09-30', status: 'COMPLETADO'  },
];

const MOCK_TASKS: Task[] = [
  { id: 't1', projectId: '1', descripcion: 'Task 1', estado: 'COMPLETADO',  estimacion: 10 },
  { id: 't2', projectId: '1', descripcion: 'Task 2', estado: 'EN_PROGRESO', estimacion: 8  },
  { id: 't3', projectId: '2', descripcion: 'Task 3', estado: 'COMPLETADO',  estimacion: 5  },
];

// All entries belong to USER_ID
const MOCK_ENTRIES: TimeEntry[] = [
  { id: 'e1', taskId: 't1', userId: USER_ID, date: '2024-01-15', hours: 12, description: 'Work',   type: 'Normal'     },
  { id: 'e2', taskId: 't2', userId: USER_ID, date: '2024-01-16', hours: 6,  description: 'Extra',  type: 'Hora extra' },
  { id: 'e3', taskId: 't3', userId: USER_ID, date: '2024-02-01', hours: 4,  description: 'Travel', type: 'Viaje'      },
];

// ── Suite ──────────────────────────────────────────────────────────────────

describe('UserAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (projectService.getAll as jest.Mock).mockResolvedValue(MOCK_PROJECTS);
    (timeEntryService.getByUserId as jest.Mock).mockResolvedValue(MOCK_ENTRIES);
    // Per-project task fetching (useQueries calls getAllByProjectId per project)
    (taskService.getAllByProjectId as jest.Mock).mockImplementation((projectId: string) =>
      Promise.resolve(MOCK_TASKS.filter(t => t.projectId === projectId))
    );
  });

  // ── Loading state ──────────────────────────────────────────────────────

  it('shows skeleton loader while data is fetching', () => {
    (projectService.getAll as jest.Mock).mockReturnValue(new Promise(() => {}));
    (timeEntryService.getByUserId as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  // ── Empty state ────────────────────────────────────────────────────────

  it('shows empty state when user has no time entries', async () => {
    (timeEntryService.getByUserId as jest.Mock).mockResolvedValue([]);

    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    expect(
      await screen.findByText('Este usuario aún no tiene horas registradas')
    ).toBeInTheDocument();
  });

  // ── Service calls ──────────────────────────────────────────────────────

  it('calls getByUserId with the correct userId', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(timeEntryService.getByUserId).toHaveBeenCalledWith(USER_ID);
    });
  });

  it('calls getAllByProjectId once per project', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(taskService.getAllByProjectId).toHaveBeenCalledWith('1');
      expect(taskService.getAllByProjectId).toHaveBeenCalledWith('2');
    });
  });

  // ── KPI cards ──────────────────────────────────────────────────────────
  // totalReal = 12+6+4 = 22h | totalEst = 10+8+5 = 23h | completadas = 2/3

  it('renders correct KPI values', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('22h')).toBeInTheDocument();
      expect(screen.getByText('23h')).toBeInTheDocument();
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });
  });

  it('shows KPI section labels', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('Horas registradas')).toBeInTheDocument();
      expect(screen.getByText('Horas estimadas')).toBeInTheDocument();
      expect(screen.getByText('Tareas completadas')).toBeInTheDocument();
    });
  });

  // ── Deviation ─────────────────────────────────────────────────────────

  it('shows "Por debajo del estimado" when real < estimated', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('Por debajo del estimado')).toBeInTheDocument();
    });
  });

  it('shows "Por encima del estimado" when real > estimated', async () => {
    const tasks: Task[] = [{ id: 't1', projectId: '1', descripcion: 'T', estado: 'COMPLETADO', estimacion: 10 }];
    const entries: TimeEntry[] = [{ id: 'e1', taskId: 't1', userId: USER_ID, date: '2024-01-01', hours: 15, description: '', type: 'Normal' }];

    (projectService.getAll as jest.Mock).mockResolvedValue([MOCK_PROJECTS[0]]);
    (timeEntryService.getByUserId as jest.Mock).mockResolvedValue(entries);
    (taskService.getAllByProjectId as jest.Mock).mockResolvedValue(tasks);

    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('Por encima del estimado')).toBeInTheDocument();
    });
  });

  it('shows "—" when no estimations', async () => {
    const tasks: Task[] = [{ id: 't1', projectId: '1', descripcion: 'T', estado: 'PENDIENTE' }];
    (projectService.getAll as jest.Mock).mockResolvedValue([MOCK_PROJECTS[0]]);
    (taskService.getAllByProjectId as jest.Mock).mockResolvedValue(tasks);

    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Tareas asociadas (new feature) ─────────────────────────────────────

  it('renders "Tareas asociadas" heading', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    expect(await screen.findByText('Tareas asociadas')).toBeInTheDocument();
  });

  it('lists all worked task descriptions', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getAllByText('Task 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Task 2').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Task 3').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders task link to task view page in "Tareas asociadas"', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: 'Task 1' });
      expect(links.some(l => l.getAttribute('href') === '/projects/1/tasks/t1')).toBe(true);
    });
  });

  it('renders project name in "Tareas asociadas" linking to project', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      const alphaLinks = screen.getAllByRole('link', { name: 'Project Alpha' });
      expect(alphaLinks.some(l => l.getAttribute('href') === '/projects/1')).toBe(true);
    });
  });

  // ── Estado de tareas — grouped task list (new feature) ─────────────────

  it('renders "Estado de tareas" section heading', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('Estado de tareas')).toBeInTheDocument();
    });
  });

  it('renders status group headings with counts', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText(/COMPLETADO \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/EN_PROGRESO \(1\)/)).toBeInTheDocument();
    });
  });

  it('renders task links inside each status group', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      // Task 1 and Task 3 are COMPLETADO; both should appear in the status list
      const task1Links = screen.getAllByRole('link', { name: 'Task 1' });
      const task3Links = screen.getAllByRole('link', { name: 'Task 3' });
      expect(task1Links.length).toBeGreaterThanOrEqual(1);
      expect(task3Links.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Charts ─────────────────────────────────────────────────────────────

  it('renders chart section headings', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText('Horas por tipo de entrada')).toBeInTheDocument();
      expect(screen.getByText('Estado de tareas')).toBeInTheDocument();
    });
  });

  it('renders bar and donut charts', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('apex-chart-bar')).toBeInTheDocument();
      expect(screen.getAllByTestId('apex-chart-donut').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Proyectos trabajados ───────────────────────────────────────────────

  it('renders "Proyectos trabajados" heading', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    expect(await screen.findByText('Proyectos trabajados')).toBeInTheDocument();
  });

  it('only shows projects the user worked on', async () => {
    // Only entries for project 1 tasks
    const entries = MOCK_ENTRIES.filter(e => e.taskId === 't1' || e.taskId === 't2');
    (timeEntryService.getByUserId as jest.Mock).mockResolvedValue(entries);

    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getAllByText('Project Alpha').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
    });
  });

  it('renders project names as links to project view', async () => {
    renderWithFreshClient(<UserAnalytics userId={USER_ID} />);

    await waitFor(() => {
      const alphaLinks = screen.getAllByRole('link', { name: 'Project Alpha' });
      expect(alphaLinks.some(l => l.getAttribute('href') === '/projects/1')).toBe(true);
    });
  });
});
