import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithClient } from 'test-utils/QueryWrapper';
import '@testing-library/jest-dom';
import CreateProjectForm from '@/components/form/CreateProjectForm';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// --- MOCKS ---
jest.mock('../date-picker', () => {
  const MockDatePicker = ({ id, label, onChange }: { id: string; label: string; onChange: (dates: Date[], dateStr: string) => void }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" onChange={(e) => onChange([], e.target.value)} />
    </div>
  );
  MockDatePicker.displayName = 'MockDatePicker';
  return MockDatePicker;
});

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock de clientService ya no es necesario, se mockea useQuery
jest.mock('@/services/clientService', () => ({
  clientService: {
    getAll: jest.fn(),
  },
}));

let mockMutate = jest.fn();
interface MutationOptions {
  onSuccess?: (...args: unknown[]) => unknown;
  onError?: (error: Error, ...args: unknown[]) => unknown;
}
let capturedMutationOptions: MutationOptions = {};

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockClients = [
  { id: 'client1', name: 'Client One' },
  { id: 'client2', name: 'Client Two' },
];

describe('CreateProjectForm', () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate = jest.fn();
    capturedMutationOptions = {};
    (useRouter as jest.Mock).mockReturnValue({ push });

    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'clients') {
        return { data: mockClients, isLoading: false, isError: false };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    (useMutation as jest.Mock).mockImplementation((options: MutationOptions) => {
      Object.assign(capturedMutationOptions, options);
      return {
        mutate: mockMutate,
        isPending: false,
      };
    });
  });

  it('renders the form and loads clients', async () => {
    renderWithClient(<CreateProjectForm />);
    expect(await screen.findByLabelText('Nombre del Proyecto')).toBeInTheDocument();
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument();
    expect(await screen.findByText('Client One')).toBeInTheDocument();
  });

  it('shows validation errors from Zod schema', async () => {
    renderWithClient(<CreateProjectForm />);
    await screen.findByText('Client One');

    fireEvent.click(screen.getByRole('button', { name: 'Crear Proyecto' }));

    expect(await screen.findByText('El nombre del proyecto es obligatorio.')).toBeInTheDocument();
    expect(await screen.findByText('Debes seleccionar un cliente.')).toBeInTheDocument();
  });

  it('submits the form with valid data', async () => {
    renderWithClient(<CreateProjectForm />);
    await screen.findByText('Client One');

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nombre del Proyecto'), { target: { value: 'New Awesome Project' } });
      fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'client1' } });
      fireEvent.change(screen.getByLabelText('Fecha de Inicio'), { target: { value: '2024-01-01' } });
      fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'ACTIVO' } });
      fireEvent.click(screen.getByRole('button', { name: 'Crear Proyecto' }));
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Awesome Project',
        clientId: 'client1',
        startDate: '2024-01-01',
      }));
    });
  });

  it('shows success toast and redirects on successful submission', async () => {
    renderWithClient(<CreateProjectForm />);
    await screen.findByText('Client One');

    await act(async () => {
      if (capturedMutationOptions.onSuccess) {
        capturedMutationOptions.onSuccess({});
      }
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Proyecto creado con éxito!');
      expect(push).toHaveBeenCalledWith('/projects');
    });
  });

  it('shows error toast on failed submission', async () => {
    const error = new Error('Failed to create');
    renderWithClient(<CreateProjectForm />);
    await screen.findByText('Client One');

    await act(async () => {
      if (capturedMutationOptions.onError) {
        capturedMutationOptions.onError(error);
      }
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo crear el proyecto. Inténtalo de nuevo.');
    });
  });
});