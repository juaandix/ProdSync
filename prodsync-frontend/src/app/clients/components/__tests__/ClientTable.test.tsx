import React from 'react';
import { screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientTable from '@/app/clients/components/ClientTable';
import { Client } from '@/types/models';
import { clientService } from '@/services/clientService';
import { ApiServiceError } from '@/services/errors';
import { renderWithClient } from 'test-utils/QueryWrapper';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';

const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Client A',
    identification: 'ID123',
    contactPerson: 'John Doe',
    email: 'client.a@example.com',
    location: 'City A',
    province: 'Province A',
  },
  {
    id: '2',
    name: 'Client B',
    identification: 'ID456',
    contactPerson: 'Jane Doe',
    email: 'client.b@example.com',
    location: 'City B',
    province: 'Province B',
  },
  {
    id: '3',
    name: 'Client C',
    identification: 'ID789',
    contactPerson: 'Peter Jones',
    email: 'client.c@example.com',
    location: 'City C',
    province: 'Province C',
  },
  {
    id: '4',
    name: 'Client D',
    identification: 'ID101',
    contactPerson: 'Alice Smith',
    email: 'client.d@example.com',
    location: 'City D',
    province: 'Province D',
  },
  {
    id: '5',
    name: 'Client E',
    identification: 'ID112',
    contactPerson: 'Bob Johnson',
    email: 'client.e@example.com',
    location: 'City E',
    province: 'Province E',
  },
  {
    id: '6',
    name: 'Client F',
    identification: 'ID131',
    contactPerson: 'Charlie Brown',
    email: 'client.f@example.com',
    location: 'City F',
    province: 'Province F',
  },
  {
    id: '7',
    name: 'Client G',
    identification: 'ID142',
    contactPerson: 'David Green',
    email: 'client.g@example.com',
    location: 'City G',
    province: 'Province G',
  },
  {
    id: '8',
    name: 'Client H',
    identification: 'ID153',
    contactPerson: 'Eve Black',
    email: 'client.h@example.com',
    location: 'City H',
    province: 'Province H',
  },
  {
    id: '9',
    name: 'Client I',
    identification: 'ID164',
    contactPerson: 'Frank White',
    email: 'client.i@example.com',
    location: 'City I',
    province: 'Province I',
  },
  {
    id: '10',
    name: 'Client J',
    identification: 'ID175',
    contactPerson: 'Grace Blue',
    email: 'client.j@example.com',
    location: 'City J',
    province: 'Province J',
  },
  {
    id: '11',
    name: 'Client K',
    identification: 'ID186',
    contactPerson: 'Harry Red',
    email: 'client.k@example.com',
    location: 'City K',
    province: 'Province K',
  },
  {
    id: '12',
    name: 'Client L',
    identification: 'ID197',
    contactPerson: 'Ivy Yellow',
    email: 'client.l@example.com',
    location: 'City L',
    province: 'Province L',
  },
  {
    id: '13',
    name: 'Client M',
    identification: 'ID208',
    contactPerson: 'Jack Purple',
    email: 'client.m@example.com',
    location: 'City M',
    province: 'Province M',
  },
  {
    id: '14',
    name: 'Client N',
    identification: 'ID219',
    contactPerson: 'Karen Orange',
    email: 'client.n@example.com',
    location: 'City N',
    province: 'Province N',
  },
  {
    id: '15',
    name: 'Client O',
    identification: 'ID230',
    contactPerson: 'Leo Brown',
    email: 'client.o@example.com',
    location: 'City O',
    province: 'Province O',
  },
  {
    id: '16',
    name: 'Client P',
    identification: 'ID241',
    contactPerson: 'Mia Pink',
    email: 'client.p@example.com',
    location: 'City P',
    province: 'Province P',
  },
];

interface MutationOptions {
  onSuccess?: (...args: unknown[]) => unknown;
  onError?: (error: Error, ...args: unknown[]) => unknown;
}

let capturedMutationOptions: MutationOptions;
const mockMutate = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
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

jest.mock('@/services/clientService', () => ({
  clientService: {
    getAll: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn((message, options) => options?.id || 'mock-success-toast-id'),
    error: jest.fn((message, options) => options?.id || 'mock-error-toast-id'),
    loading: jest.fn(() => 'loading-toast-id'),
  },
}));

jest.mock('@/components/ui/modal', () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode, isOpen: boolean }) => {
    return isOpen ? <div role="dialog">{children}</div> : null;
  },
}));

describe('ClientTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedMutationOptions = {};
    let queryInvalidated = false;
    mockInvalidateQueries.mockClear();
    mockInvalidateQueries.mockImplementation(() => {
        queryInvalidated = true;
    });

    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'clients' && !queryInvalidated) {
            return { data: MOCK_CLIENTS, isLoading: false, isError: false, error: null };
        }
        if (queryKey[0] === 'clients' && queryInvalidated) {
            return { data: MOCK_CLIENTS.filter(client => client.id !== '1'), isLoading: false, isError: false, error: null };
        }
        return { data: [], isLoading: false, isError: false, error: null };
    });

    (useMutation as jest.Mock).mockImplementation((options: MutationOptions) => {
      Object.assign(capturedMutationOptions, options);
      return {
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
      };
    });
  });

  it('renders the table with client data', async () => {
    renderWithClient(<ClientTable />);

    await waitFor(() => {
      expect(screen.getByText('Client A')).toBeInTheDocument();
      expect(screen.getByText('client.b@example.com')).toBeInTheDocument();
      expect(screen.getByText('ID123')).toBeInTheDocument();
    });
  });

  it('filters clients by name', async () => {
    renderWithClient(<ClientTable />);

    await waitFor(() => {
      expect(screen.getByText('Client A')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search by All...'), {
      target: { value: 'Client B' },
    });

    expect(screen.queryByText('Client A')).not.toBeInTheDocument();
    expect(screen.getByText('Client B')).toBeInTheDocument();
  });

  it('paginates the client list', async () => {
    renderWithClient(<ClientTable />);

    await waitFor(() => {
      expect(screen.getByText('Client A')).toBeInTheDocument();
    });

    // Client P should not be in the document on the first page
    expect(screen.queryByText('Client P')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    // On the second page, Client P should be visible, and Client A should not
    expect(await screen.findByText('Client P')).toBeInTheDocument();
    expect(screen.queryByText('Client A')).not.toBeInTheDocument();
  });

  it('opens a modal when deleting a client', async () => {
    renderWithClient(<ClientTable />);

    await waitFor(() => {
      expect(screen.getByText('Client A')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
  });

  it('deletes a client when the delete button is clicked in the modal', async () => {
    (clientService.delete as jest.Mock).mockResolvedValueOnce(undefined);
    renderWithClient(<ClientTable />);

    await waitFor(() => {
      expect(screen.getByText('Client A')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[0]);

    const modal = screen.getByRole('dialog');
    const confirmDeleteButton = within(modal).getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith('1');
    });
  });

  it('removes the client from the list after deletion', async () => {
    (clientService.delete as jest.Mock).mockResolvedValueOnce(undefined);

    (useQuery as jest.Mock).mockReturnValueOnce({
        data: MOCK_CLIENTS,
        isLoading: false,
        isError: false,
        error: null,
    }).mockReturnValueOnce({
        data: MOCK_CLIENTS.filter(client => client.id !== '1'),
        isLoading: false,
        isError: false,
        error: null,
    });

    renderWithClient(<ClientTable />);

    await waitFor(() => {
      expect(screen.getByText('Client A')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[0]);

    const modal = screen.getByRole('dialog');
    const confirmDeleteButton = within(modal).getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith('1');
    });

    await act(async () => {
        capturedMutationOptions.onSuccess();
    });

    await waitFor(() => {
      expect(screen.queryByText('Client A')).not.toBeInTheDocument();
    });
  });

  it('shows an error message if deletion fails', async () => {
    (clientService.delete as jest.Mock).mockRejectedValueOnce(new ApiServiceError('Failed to delete client.', 500));
    renderWithClient(<ClientTable />);

    await waitFor(() => {
      expect(screen.getByText('Client A')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[0]);

    const modal = screen.getByRole('dialog');
    const confirmDeleteButton = within(modal).getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith('1');
    });

    await act(async () => {
        capturedMutationOptions.onError(new ApiServiceError('Failed to delete client.', 500));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error interno del servidor. Por favor, inténtalo de nuevo más tarde.');
    });
  });

  it('navigates to the create client page when "Create New Client" is clicked', async () => {
    renderWithClient(<ClientTable />);
    const createButton = await screen.findByText('Create New Client');
    expect(createButton.closest('a')).toHaveAttribute('href', '/clients/create');
  });

  it('navigates to the view client page when "View" is clicked', async () => {
    renderWithClient(<ClientTable />);
    await waitFor(() => expect(screen.getByText('Client A')).toBeInTheDocument());
    const viewLinks = screen.getAllByTitle('Ver');
    expect(viewLinks[0]).toHaveAttribute('href', '/clients/1');
  });

  it('navigates to the edit client page when "Edit" is clicked', async () => {
    renderWithClient(<ClientTable />);
    await waitFor(() => expect(screen.getByText('Client A')).toBeInTheDocument());
    const editLinks = screen.getAllByTitle('Editar');
    expect(editLinks[0]).toHaveAttribute('href', '/clients/edit/1');
  });
});
