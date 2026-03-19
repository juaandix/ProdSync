import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectTable from '@/app/projects/components/ProjectTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

jest.useFakeTimers();

// --- MOCKS ---

// Mock completo de React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

jest.mock('@/services/clientService', () => ({
  clientService: {
    getAll: jest.fn(),
  },
}));

jest.mock('@/services/projectService', () => ({
  projectService: {
    getAll: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: '1', name: 'Test User', role: 'ADMIN' },
    token: 'mock-token',
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

// --- DATOS MOCK ---

const mockProjects = [
  { id: '1', name: 'Project 1', description: 'Desc 1', status: 'In Progress', type: 'Web', startDate: '2024-01-01', endDate: '2024-12-31', estimate: 100, clientId: 'client1' },
  { id: '2', name: 'Project 2', description: 'Desc 2', status: 'Completed', type: 'Mobile', startDate: '2023-01-01', endDate: '2023-12-31', estimate: 200, clientId: 'client2' },
];

const mockClients = [
  { id: 'client1', name: 'Client One', identification: '123', contactPerson: 'John Doe', email: 'john@example.com', location: 'NY', province: 'NY' },
  { id: 'client2', name: 'Client Two', identification: '456', contactPerson: 'Jane Doe', email: 'jane@example.com', location: 'LA', province: 'CA' },
];

// Define una interfaz para tipar capturedMutationOptions
interface MutationOptions {
  onSuccess?: (...args: unknown[]) => unknown;
  onError?: (error: Error, ...args: unknown[]) => unknown;
  // Añadir otras propiedades de useMutation options que se usen si es necesario
}

describe('ProjectTable', () => {
  let mockMutate: jest.Mock;
  let mockInvalidateQueries: jest.Mock;
  let capturedMutationOptions: MutationOptions;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate = jest.fn();
    mockInvalidateQueries = jest.fn();
    capturedMutationOptions = {}; // Inicializar como objeto vacío

    // 3. Mock de useQueryClient
    (useQueryClient as jest.Mock).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });

    // 4. Mock Inteligente de useQuery (SOLUCIÓN DEL ERROR)
    // Devuelve datos distintos según la key ('projects' o 'clients')
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      const key = queryKey[0];
      if (key === 'projects') {
        return { data: mockProjects, isLoading: false, error: null };
      }
      if (key === 'clients') {
        return { data: mockClients, isLoading: false, error: null };
      }
      return { data: [], isLoading: false, error: null };
    });

    // 5. Mock de useMutation (Captura opciones)
    (useMutation as jest.Mock).mockImplementation((options: MutationOptions) => {
      Object.assign(capturedMutationOptions, options); // Usar Object.assign para copiar propiedades
      return {
        mutate: mockMutate,
        isPending: false,
      };
    });
  });

  it('fetches and displays projects', async () => {
    render(<ProjectTable />);

    // No necesitamos await waitFor porque los datos se entregan síncronamente por el mock
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    
    // Verifica que los nombres de clientes se resuelven (si la tabla hace ese cruce)
    // Si la tabla muestra IDs o requiere cruce, asegúrate de que la lógica esté en el componente.
    // Asumiendo que muestra el nombre del cliente si está disponible:
    // expect(screen.getByText('Client One')).toBeInTheDocument(); 
  });

  it('filters projects based on search term', async () => {
    render(<ProjectTable />);

    // Estado inicial
    expect(screen.getByText('Project 1')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search/i); // Selector más flexible

    // Filtrar por nombre de proyecto
    fireEvent.change(searchInput, { target: { value: 'Project 2' } });
    expect(screen.queryByText('Project 1')).not.toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    
    // Limpiar filtro
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Project 1')).toBeInTheDocument();
  });

  it('opens delete modal and deletes a project', async () => {
    render(<ProjectTable />);

    // 1. Abrir modal (click en el primer botón Eliminar)
    const tableDeleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(tableDeleteButtons[0]);

    // 2. Esperar y localizar el modal
    // Usamos un texto que sabemos que está en el modal, o un role='dialog' si existe
    const modalHeading = await screen.findByText(/confirm deletion/i);
    expect(modalHeading).toBeInTheDocument();

    // 3. Localizar el botón dentro del modal (scope con 'within')
    // Asumimos que el título está dentro del contenedor del modal
    // Si esto falla, inspecciona tu componente Modal para un mejor selector (ej: role="dialog")
    const modalContainer = modalHeading.closest('div')?.parentElement || document.body; 
    
    // Buscamos el botón 'Delete' de confirmación (que suele ser el peligroso/rojo)
    // Si hay ambigüedad, within ayuda mucho.
    const confirmButton = within(modalContainer as HTMLElement).getByRole('button', { name: /delete/i });
    
    fireEvent.click(confirmButton);

    // 4. Verificar llamada a mutate
    expect(mockMutate).toHaveBeenCalledWith('1');

    // 5. Simular éxito manualmente
    await act(async () => {
        if (capturedMutationOptions.onSuccess) {
            capturedMutationOptions.onSuccess();
        }
    });

    // 6. Verificar efectos secundarios (Toast e Invalidación)
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('deleted'));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['projects'] });
  });
});