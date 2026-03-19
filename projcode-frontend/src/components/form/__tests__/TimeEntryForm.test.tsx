import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeEntryForm from '@/components/form/TimeEntryForm';
import { timeEntryService } from '@/services/timeEntryService';
import { ApiServiceError } from '@/services/errors';
import { renderWithClient } from 'test-utils/QueryWrapper';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

// --- MOCKS ---
interface MutationOptions {
  onSuccess?: (...args: unknown[]) => unknown;
  onError?: (error: Error, ...args: unknown[]) => unknown;
  // Añadir otras propiedades de useMutation options que se usen si es necesario
}
let capturedMutationOptions: MutationOptions;
const mockMutate = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/services/timeEntryService', () => ({
  timeEntryService: {
    create: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn((message, options) => options?.id || 'mock-success-toast-id'),
    error: jest.fn((message, options) => options?.id || 'mock-error-toast-id'),
    loading: jest.fn(() => 'loading-toast-id'),
  },
}));

describe('TimeEntryForm', () => {
  const mockOnTimeEntryCreated = jest.fn();
  const taskId = 'task_1';

  beforeEach(() => {
    jest.clearAllMocks();
    capturedMutationOptions = {}; // Re-initialize capturedMutationOptions for each test
    mockMutate.mockClear(); // Clear any previous mock calls
    mockInvalidateQueries.mockClear(); // Clear any previous mock calls

    (useMutation as jest.Mock).mockImplementation((options: MutationOptions) => {
      Object.assign(capturedMutationOptions, options);
      return {
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
      };
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the form correctly', () => {
    renderWithClient(<TimeEntryForm taskId={taskId} onTimeEntryCreated={mockOnTimeEntryCreated} />);

    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hours spent/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej: 1.5 o 1:30')).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log time/i })).toBeInTheDocument();
  });

  it('submits the form with the correct data and calls onTimeEntryCreated', async () => {
    const newEntryData = {
      date: '2024-01-01',
      hours: '7.5',
      description: 'Worked on feature X',
      type: 'Normal',
    };
    const createdTimeEntry = { ...newEntryData, id: 'new_time_entry_id', taskId, hours: 7.5 };

    (timeEntryService.create as jest.Mock).mockResolvedValue(createdTimeEntry);

    renderWithClient(<TimeEntryForm taskId={taskId} onTimeEntryCreated={mockOnTimeEntryCreated} />);

    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: newEntryData.date } });
    fireEvent.change(screen.getByLabelText(/hours spent/i), { target: { value: newEntryData.hours } });
    fireEvent.change(screen.getByLabelText(/type/i), { target: { value: newEntryData.type } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: newEntryData.description } });

    fireEvent.click(screen.getByRole('button', { name: /log time/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ ...newEntryData });
    });

    await act(async () => {
      capturedMutationOptions.onSuccess(createdTimeEntry);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Time entry created successfully!');
      expect(mockOnTimeEntryCreated).toHaveBeenCalledWith(createdTimeEntry);
    });
  });

  it('shows an error message if hours are not provided or invalid', async () => {
    renderWithClient(<TimeEntryForm taskId={taskId} onTimeEntryCreated={mockOnTimeEntryCreated} />);

    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText(/hours spent/i), { target: { value: '' } }); // Horas inválidas
    fireEvent.click(screen.getByRole('button', { name: /log time/i }));

    await waitFor(() => {
      expect(screen.getByText('Las horas son obligatorias')).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockOnTimeEntryCreated).not.toHaveBeenCalled();
  });

  it('shows an error message on failed submission', async () => {
    const mockError = new ApiServiceError('Failed to log time', 500);
    (timeEntryService.create as jest.Mock).mockRejectedValueOnce(mockError);

    renderWithClient(<TimeEntryForm taskId={taskId} onTimeEntryCreated={mockOnTimeEntryCreated} />);

    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText(/hours spent/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /log time/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({ hours: '1' }));
    });

    await act(async () => {
      capturedMutationOptions.onError(mockError);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error interno del servidor. Por favor, inténtalo de nuevo más tarde.');
    });
    expect(mockOnTimeEntryCreated).not.toHaveBeenCalled();
  });
});