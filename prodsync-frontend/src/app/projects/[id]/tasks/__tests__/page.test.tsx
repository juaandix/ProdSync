import React from 'react';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { renderWithClient } from 'test-utils/QueryWrapper';
import '@testing-library/jest-dom';
import ProjectTasksPage from '@/app/projects/[id]/tasks/page';
import { Task, TimeEntry } from '@/types/models';
import { taskService } from '@/services/taskService';
import { timeEntryService } from '@/services/timeEntryService';

// Mockear next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href, ...props }, children),
}));

// Mockear next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, ...props }: { src: string; alt: string; width?: number | string; height?: number | string; }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} width={width} height={height} {...props} />;
  },
}));

// Simular useRouter y useParams
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useParams: () => ({ id: 'proj_1' }), // Mockear useParams para devolver un projectId
}));

// Mockear el módulo taskService y timeEntryService
jest.mock('@/services/taskService', () => ({
  taskService: {
    getAllByProjectId: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/services/timeEntryService', () => ({
  timeEntryService: {
    getAll: jest.fn(),
    create: jest.fn(),
  },
}));


// Mockear componentes secundarios para simplificar las pruebas de la página en sí
jest.mock('@/components/tasks/CreateTaskForm', () => {
  const MockCreateTaskForm = ({ projectId, onTaskCreated, onClose }: { projectId: string; onTaskCreated: (task: Task) => void; onClose: () => void }) => (
    <div data-testid="create-task-form">
      Create Task Form for {projectId}
      <button onClick={() => onTaskCreated({ id: 'new_task', projectId, summary: 'New Task', description: '', status: 'To Do' } as Task)}>
        Simulate Create Task
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
  MockCreateTaskForm.displayName = 'MockCreateTaskForm';
  return MockCreateTaskForm;
});

jest.mock('@/components/tasks/CreateTimeEntryForm', () => {
  const MockCreateTimeEntryForm = ({ taskId, onTimeEntryCreated, onClose }: { taskId: string; onTimeEntryCreated: (entry: TimeEntry) => void; onClose: () => void }) => (
    <div data-testid="time-entry-form">
      Time Entry Form for {taskId}
      <button onClick={() => onTimeEntryCreated({ id: 'new_time_entry', taskId, date: '2024-01-01', hours: 1, description: 'Logged' } as TimeEntry)}>
        Simulate Log Time
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
  MockCreateTimeEntryForm.displayName = 'MockCreateTimeEntryForm';
  return MockCreateTimeEntryForm;
});

// Mockear el componente Modal (ui/modal)
jest.mock('@/components/ui/modal', () => {
  const MockModal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; className?: string; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    );
  };
  MockModal.displayName = 'MockModal';
  return { Modal: MockModal };
});

// Mockear AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'ADMIN', status: 'active' },
    token: 'mock-token',
    isLoading: false,
  }),
}));

// Mockear PageBreadCrumb
jest.mock('@/components/common/PageBreadCrumb', () => {
  const MockPageBreadCrumb = ({ pageTitle }: { pageTitle: string }) => (
    <div data-testid="page-breadcrumb">{pageTitle}</div>
  );
  MockPageBreadCrumb.displayName = 'MockPageBreadCrumb';
  return MockPageBreadCrumb;
});

describe('ProjectTasksPage', () => {
  jest.setTimeout(10000); // Aumentar el timeout para esta suite de pruebas
  const projectId = 'proj_1';
  const mockTasks = [
    { id: 'task_1', projectId: 'proj_1', descripcion: 'Design database schema', estado: 'In Progress' },
    { id: 'task_2', projectId: 'proj_1', descripcion: 'Develop user authentication', estado: 'To Do' },
  ];
  const mockTimeEntries = [
    { id: 'te_1', taskId: 'task_1', date: '2024-01-16', hours: 4, description: 'Initial schema draft' },
    { id: 'te_2', taskId: 'task_1', date: '2024-01-17', hours: 3.5, description: 'Refined product tables' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (taskService.getAllByProjectId as jest.Mock).mockResolvedValue(mockTasks);
    (timeEntryService.getAll as jest.Mock).mockResolvedValue(mockTimeEntries);
    // Ensure taskService.create and timeEntryService.create are also cleared and ready for specific mocks
    (taskService.create as jest.Mock).mockClear();
    (timeEntryService.create as jest.Mock).mockClear();
  });

  

  it('fetches and displays project and tasks', async () => {
    await act(async () => {
      renderWithClient(<ProjectTasksPage />);
    });

    await waitFor(() => expect(screen.queryByText(/loading tasks.../i)).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText(/loading time entries.../i)).not.toBeInTheDocument());

    expect(screen.getByText('Project Tasks')).toBeInTheDocument();
    mockTasks.forEach(task => {
      expect(screen.getByText(task.descripcion)).toBeInTheDocument();
    });
    expect(taskService.getAllByProjectId).toHaveBeenCalledWith(projectId);
    expect(timeEntryService.getAll).toHaveBeenCalledTimes(1);
  });

  it('opens and closes Create New Task modal', async () => {
    await act(async () => {
      renderWithClient(<ProjectTasksPage />);
    });

    await waitFor(() => expect(screen.queryByText(/loading tasks.../i)).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText(/loading time entries.../i)).not.toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /create new task/i }));
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create new task/i })).toBeInTheDocument();
    });
    expect(screen.getByTestId('create-task-form')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /simulate create task/i }));
    });
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /create new task/i })).not.toBeInTheDocument();
    });
    // Instead, verify that tasks are re-fetched.
    expect(taskService.getAllByProjectId).toHaveBeenCalledTimes(2); // Initial fetch + refresh after creation
  });

  it('opens and closes Log Time modal', async () => {
    await act(async () => {
      renderWithClient(<ProjectTasksPage />);
    });

    await waitFor(() => expect(screen.queryByText(/loading tasks.../i)).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText(/loading time entries.../i)).not.toBeInTheDocument());

    const logTimeButtons = screen.getAllByRole('button', { name: /log time/i });
    await act(async () => {
      fireEvent.click(logTimeButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /add time entry/i })).toBeInTheDocument();
    });
    expect(screen.getByTestId('time-entry-form')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /simulate log time/i }));
    });
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /add time entry/i })).not.toBeInTheDocument();
    });
    // Verify that time entries are re-fetched.
    expect(timeEntryService.getAll).toHaveBeenCalledTimes(2); // Initial fetch + refresh after creation
  });

  it('renders view link for each task pointing to task detail page', async () => {
    await act(async () => {
      renderWithClient(<ProjectTasksPage />);
    });

    await waitFor(() => expect(screen.queryByText(/loading tasks.../i)).not.toBeInTheDocument());

    // Each task should have a link with title "Ver" pointing to /projects/[id]/tasks/[taskId]
    mockTasks.forEach(task => {
      const link = document.querySelector(`a[href="/projects/${projectId}/tasks/${task.id}"]`);
      expect(link).toBeInTheDocument();
    });
  });
});