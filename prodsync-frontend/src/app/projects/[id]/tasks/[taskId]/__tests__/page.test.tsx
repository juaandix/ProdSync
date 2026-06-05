import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useQuery } from '@tanstack/react-query';
import ViewTaskPage from '@/app/projects/[id]/tasks/[taskId]/page';
import { Task, TimeEntry, User } from '@/types/models';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'proj_1', taskId: 'task_1' })),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('@/services/taskService',     () => ({ taskService:     { getById: jest.fn() } }));
jest.mock('@/services/timeEntryService', () => ({ timeEntryService: { getAll:   jest.fn() } }));
jest.mock('@/services/userService',      () => ({ userService:      { getAll:   jest.fn() } }));

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_TASK: Task = {
  id: 'task_1',
  projectId: 'proj_1',
  descripcion: 'Implement login flow',
  estado: 'EN_PROGRESO',
  estimacion: 8,
  storyPoints: 5,
};

const MOCK_USERS: User[] = [
  { id: 'user_1', name: 'Alice García', username: 'alice', email: 'alice@test.com', role: 'USER', status: 'ACTIVE' },
  { id: 'user_2', name: 'Bob Martínez', username: 'bob',   email: 'bob@test.com',  role: 'USER', status: 'ACTIVE' },
];

const MOCK_ENTRIES: TimeEntry[] = [
  { id: 'e1', taskId: 'task_1', userId: 'user_1', date: '2024-03-01', hours: 4, description: 'Initial setup',    type: 'Normal'     },
  { id: 'e2', taskId: 'task_1', userId: 'user_2', date: '2024-03-02', hours: 3, description: 'Token handling',   type: 'Hora extra' },
  { id: 'e3', taskId: 'other',  userId: 'user_1', date: '2024-03-03', hours: 9, description: 'Other task entry', type: 'Normal'     },
];

const mockedUseQuery = useQuery as jest.Mock;

// Default: all data loaded
const setupDataLoaded = (overrides: { task?: Task | null; entries?: TimeEntry[]; users?: User[] } = {}) => {
  mockedUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    const key = queryKey[0];
    if (key === 'task')         return { data: 'task' in overrides ? overrides.task : MOCK_TASK,    isLoading: false };
    if (key === 'time-entries') return { data: overrides.entries ?? MOCK_ENTRIES, isLoading: false };
    if (key === 'users')        return { data: overrides.users   ?? MOCK_USERS,   isLoading: false };
    return { data: undefined, isLoading: false };
  });
};

// ── Suite ──────────────────────────────────────────────────────────────────

describe('ViewTaskPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDataLoaded();
  });

  // ── Loading ─────────────────────────────────────────────────────────────

  it('shows skeleton while any query is loading', () => {
    mockedUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    render(<ViewTaskPage />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  // ── Not found ──────────────────────────────────────────────────────────

  it('shows "Tarea no encontrada" when task is null', () => {
    setupDataLoaded({ task: null });
    render(<ViewTaskPage />);
    expect(screen.getByText('Tarea no encontrada.')).toBeInTheDocument();
  });

  // ── Task details ───────────────────────────────────────────────────────

  it('renders task description', () => {
    render(<ViewTaskPage />);
    expect(screen.getByText('Implement login flow')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<ViewTaskPage />);
    expect(screen.getByText('EN_PROGRESO')).toBeInTheDocument();
  });

  it('renders estimation label and value', () => {
    render(<ViewTaskPage />);
    expect(screen.getByText(/Estimación/)).toBeInTheDocument();
    expect(screen.getByText('8h')).toBeInTheDocument();
  });

  it('renders story points', () => {
    render(<ViewTaskPage />);
    expect(screen.getByText(/Story Points/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  // ── Hours summary ─────────────────────────────────────────────────────

  it('renders total hours only for this task (e1+e2=7h, ignores e3)', () => {
    render(<ViewTaskPage />);
    // 4h + 3h = 7h; e3 belongs to 'other'
    expect(screen.getAllByText('7h').length).toBeGreaterThanOrEqual(1);
  });

  it('renders deviation percentage when estimation > 0', () => {
    // real=7h, est=8h → (7-8)/8*100 = -12.5%
    render(<ViewTaskPage />);
    expect(screen.getByText('-12.5%')).toBeInTheDocument();
  });

  it('does not render deviation when estimation is 0', () => {
    setupDataLoaded({ task: { ...MOCK_TASK, estimacion: 0 } });
    render(<ViewTaskPage />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('does not render estimation label when estimacion is null', () => {
    setupDataLoaded({ task: { ...MOCK_TASK, estimacion: undefined } });
    render(<ViewTaskPage />);
    expect(screen.queryByText(/Estimación/)).not.toBeInTheDocument();
  });

  // ── Time entries table ────────────────────────────────────────────────

  it('renders time entries heading with count (only for this task)', () => {
    render(<ViewTaskPage />);
    expect(screen.getByText('Registros de tiempo (2)')).toBeInTheDocument();
  });

  it('renders user names as links to user profile', () => {
    render(<ViewTaskPage />);
    const aliceLink = screen.getByRole('link', { name: 'Alice García' });
    expect(aliceLink).toHaveAttribute('href', '/users/user_1');

    const bobLink = screen.getByRole('link', { name: 'Bob Martínez' });
    expect(bobLink).toHaveAttribute('href', '/users/user_2');
  });

  it('renders entry dates and hours in table', () => {
    render(<ViewTaskPage />);
    expect(screen.getByText('2024-03-01')).toBeInTheDocument();
    expect(screen.getByText('4h')).toBeInTheDocument();
    expect(screen.getByText('2024-03-02')).toBeInTheDocument();
    expect(screen.getByText('3h')).toBeInTheDocument();
  });

  it('does not display entries from other tasks', () => {
    render(<ViewTaskPage />);
    expect(screen.queryByText('Other task entry')).not.toBeInTheDocument();
  });

  it('shows "—" for user column when userId is missing', () => {
    const entriesNoUser: TimeEntry[] = [
      { id: 'e1', taskId: 'task_1', date: '2024-03-01', hours: 2, description: 'anon', type: 'Normal' },
    ];
    setupDataLoaded({ entries: entriesNoUser });
    render(<ViewTaskPage />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no entries exist for this task', () => {
    setupDataLoaded({ entries: [] });
    render(<ViewTaskPage />);
    expect(screen.getByText('No hay registros de tiempo para esta tarea.')).toBeInTheDocument();
  });

  it('shows total row in entries table footer', () => {
    render(<ViewTaskPage />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  // ── Back link ─────────────────────────────────────────────────────────

  it('renders back link to project tasks list', () => {
    render(<ViewTaskPage />);
    const backLink = screen.getByRole('link', { name: /Volver a tareas del proyecto/ });
    expect(backLink).toHaveAttribute('href', '/projects/proj_1/tasks');
  });
});
