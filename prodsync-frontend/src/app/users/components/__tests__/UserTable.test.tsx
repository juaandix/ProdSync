import React from 'react';
import { screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserTable from '@/app/users/components/UserTable';
import { User } from '@/types/models';
import { userService } from '@/services/userService';
import { ApiServiceError } from '@/services/errors';
import { renderWithClient } from 'test-utils/QueryWrapper';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'John Doe',
    username: 'john.doe',
    email: 'john.doe@example.com',
    role: 'admin',
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Doe',
    username: 'jane.doe',
    email: 'jane.doe@example.com',
    role: 'operator',
    status: 'inactive',
  },
  {
    id: '3',
    name: 'Peter Jones',
    username: 'peter.jones',
    email: 'peter.jones@example.com',
    role: 'operator',
    status: 'active',
  },
  {
    id: '4',
    name: 'Alice Smith',
    username: 'alice.smith',
    email: 'alice.smith@example.com',
    role: 'user',
    status: 'active',
  },
  {
    id: '5',
    name: 'Bob Johnson',
    username: 'bob.johnson',
    email: 'bob.johnson@example.com',
    role: 'user',
    status: 'inactive',
  },
  {
    id: '6',
    name: 'Charlie Brown',
    username: 'charlie.brown',
    email: 'charlie.brown@example.com',
    role: 'user',
    status: 'active',
  },
  {
    id: '7',
    name: 'David Lee',
    username: 'david.lee',
    email: 'david.lee@example.com',
    role: 'admin',
    status: 'active',
  },
  {
    id: '8',
    name: 'Emily White',
    username: 'emily.white',
    email: 'emily.white@example.com',
    role: 'operator',
    status: 'inactive',
  },
  {
    id: '9',
    name: 'Frank Green',
    username: 'frank.green',
    email: 'frank.green@example.com',
    role: 'user',
    status: 'active',
  },
  {
    id: '10',
    name: 'Grace Taylor',
    username: 'grace.taylor',
    email: 'grace.taylor@example.com',
    role: 'admin',
    status: 'inactive',
  },
  {
    id: '11',
    name: 'Henry Wilson',
    username: 'henry.wilson',
    email: 'henry.wilson@example.com',
    role: 'operator',
    status: 'active',
  },
  {
    id: '12',
    name: 'Ivy Moore',
    username: 'ivy.moore',
    email: 'ivy.moore@example.com',
    role: 'user',
    status: 'inactive',
  },
  {
    id: '13',
    name: 'Jack King',
    username: 'jack.king',
    email: 'jack.king@example.com',
    role: 'admin',
    status: 'active',
  },
  {
    id: '14',
    name: 'Karen Hall',
    username: 'karen.hall',
    email: 'karen.hall@example.com',
    role: 'operator',
    status: 'inactive',
  },
  {
    id: '15',
    name: 'Liam Young',
    username: 'liam.young',
    email: 'liam.young@example.com',
    role: 'user',
    status: 'active',
  },
  {
    id: '16',
    name: 'Mia Scott',
    username: 'mia.scott',
    email: 'mia.scott@example.com',
    role: 'user',
    status: 'inactive',
  },
];

// Define una interfaz para tipar capturedMutationOptions
interface MutationOptions {
  onSuccess?: (...args: unknown[]) => unknown;
  onError?: (error: Error, ...args: unknown[]) => unknown;
  // Añadir otras propiedades de useMutation options que se usen si es necesario
}

// --- MOCKS ---
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

jest.mock('@/services/userService', () => ({
  userService: {
    getAll: jest.fn(),
    delete: jest.fn(),
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

describe('UserTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedMutationOptions = {};
    let queryInvalidated = false;
    mockInvalidateQueries.mockClear(); // Clear mock calls from previous tests
    mockInvalidateQueries.mockImplementation(() => {
        queryInvalidated = true;
    });

    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'users' && !queryInvalidated) {
            return { data: MOCK_USERS, isLoading: false, isError: false, error: null };
        }
        if (queryKey[0] === 'users' && queryInvalidated) {
            return { data: MOCK_USERS.filter(user => user.id !== '1'), isLoading: false, isError: false, error: null };
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

  it('renders the table with user data', async () => {
    renderWithClient(<UserTable />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument();
      expect(screen.getAllByText('admin').length).toBeGreaterThan(0);
      const activeElements = screen.getAllByText('active');
      expect(activeElements.length).toBeGreaterThan(0);
    });
  });

  it('filters users by name', async () => {
    renderWithClient(<UserTable />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search by All...'), {
      target: { value: 'Jane' },
    });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });



  it('paginates the user list', async () => {
    renderWithClient(<UserTable />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Mia Scott should not be in the document on the first page
    expect(screen.queryByText('Mia Scott')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    // On the second page, Mia Scott should be visible, and John Doe should not
    expect(await screen.findByText('Mia Scott')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('opens a modal when deleting a user', async () => {
    renderWithClient(<UserTable />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
  });

  it('deletes a user when the delete button is clicked in the modal', async () => {
    (userService.delete as jest.Mock).mockResolvedValueOnce(undefined);
    renderWithClient(<UserTable />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
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

  it('removes the user from the list after deletion', async () => {
    (userService.delete as jest.Mock).mockResolvedValueOnce(undefined);

    (useQuery as jest.Mock).mockReturnValueOnce({
        data: MOCK_USERS,
        isLoading: false,
        isError: false,
        error: null,
    }).mockReturnValueOnce({
        data: MOCK_USERS.filter(user => user.id !== '1'),
        isLoading: false,
        isError: false,
        error: null,
    });

    renderWithClient(<UserTable />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
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
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('shows an error message if deletion fails', async () => {
    (userService.delete as jest.Mock).mockRejectedValueOnce(new ApiServiceError('Failed to delete user.', 500));
    renderWithClient(<UserTable />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
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
        capturedMutationOptions.onError(new ApiServiceError('Failed to delete user.', 500));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error interno del servidor. Por favor, inténtalo de nuevo más tarde.');
    });
  });

  it('navigates to the create user page when "Create New" is clicked', async () => {
    renderWithClient(<UserTable />);
    const createButton = await screen.findByText('Create New User');
    expect(createButton.closest('a')).toHaveAttribute('href', '/users/create');
  });

  it('navigates to the view user page when "View" is clicked', async () => {
    renderWithClient(<UserTable />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
    const viewLinks = screen.getAllByTitle('Ver');
    expect(viewLinks[0]).toHaveAttribute('href', '/users/1');
  });

  it('navigates to the edit user page when "Edit" is clicked', async () => {
    renderWithClient(<UserTable />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
    const editLinks = screen.getAllByTitle('Editar');
    expect(editLinks[0]).toHaveAttribute('href', '/users/edit/1');
  });
});