import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateUserForm from '@/components/form/CreateUserForm';
import { ApiServiceError } from '@/services/errors';
import { renderWithClient } from 'test-utils/QueryWrapper';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

// --- MOCKS ---
interface MutationOptions {
  onSuccess?: (...args: unknown[]) => unknown;
  onError?: (error: Error, ...args: unknown[]) => unknown;
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

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(() => 'loading-toast-id'),
  },
}));

describe('CreateUserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedMutationOptions = {};
    mockMutate.mockClear();
    mockInvalidateQueries.mockClear();

    (useMutation as jest.Mock).mockImplementation((options: MutationOptions) => {
      Object.assign(capturedMutationOptions, options);
      return {
        mutate: mockMutate,
        isPending: false,
      };
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the form correctly', () => {
    renderWithClient(<CreateUserForm />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create User' })).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    renderWithClient(<CreateUserForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }));
    
    expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
    expect(await screen.findByText('Username must be at least 2 characters')).toBeInTheDocument();
    expect((await screen.findAllByText('Password must be at least 6 characters'))[0]).toBeInTheDocument();
    expect(await screen.findByText('Please enter a valid email')).toBeInTheDocument();
  });

  it('submits the form with the correct data', async () => {
    renderWithClient(<CreateUserForm />);

    const userData = {
      name: 'Test User',
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      role: 'ADMIN',
      status: 'ACTIVE',
    };
    
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: userData.name } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: userData.username } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: userData.password } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: userData.password } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: userData.email } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: userData.role } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: userData.status } });

    fireEvent.click(screen.getByRole('button', { name: 'Create User' }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(userData);
    });
  });

  it('shows a success message and redirects on successful submission', async () => {
    renderWithClient(<CreateUserForm />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }));

    await act(async () => {
      if (capturedMutationOptions.onSuccess) {
        capturedMutationOptions.onSuccess();
      }
    });

    expect(toast.success).toHaveBeenCalledWith('User created successfully!');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] });
    
    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/users');
    });
  });

  it('shows an error message on failed submission', async () => {
    const mockError = new ApiServiceError('Failed to create user.', 400);
    renderWithClient(<CreateUserForm />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }));
    
    await act(async () => {
        if (capturedMutationOptions.onError) {
          capturedMutationOptions.onError(mockError);
        }
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Los datos enviados no son válidos. Revisa los campos del formulario.');
    });
  });
});
