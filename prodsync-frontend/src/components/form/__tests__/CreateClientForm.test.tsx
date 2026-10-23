import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateClientForm from '@/components/form/CreateClientForm';
import { ApiServiceError } from '@/services/errors';
import { renderWithClient } from 'test-utils/QueryWrapper';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

interface MutationOptions {
  onSuccess?: (...args: unknown[]) => unknown;
  onError?: (error: Error, ...args: unknown[]) => unknown;
}
let capturedMutationOptions: MutationOptions;
let mockMutate: jest.Mock;
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

jest.mock('@/services/clientService', () => ({
  clientService: {
    create: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

describe('CreateClientForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedMutationOptions = {};
    mockMutate = jest.fn(); // Ensure mockMutate is reset
    mockInvalidateQueries.mockClear();

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
    renderWithClient(<CreateClientForm />);

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('NIF/CIF')).toBeInTheDocument();
    expect(screen.getByLabelText('Persona de contacto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear cliente' })).toBeInTheDocument();
  });

  it('shows an error message if name or email are not provided', async () => {
    renderWithClient(<CreateClientForm />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Crear cliente' }));
    });

    expect(await screen.findByText('El nombre debe tener al menos 2 caracteres')).toBeInTheDocument();
    expect(await screen.findByText('Introduce un email válido')).toBeInTheDocument();
    expect(await screen.findByText('El NIF/CIF debe tener al menos 2 caracteres')).toBeInTheDocument();
    expect(await screen.findByText('La persona de contacto debe tener al menos 2 caracteres')).toBeInTheDocument();
  });

  it('submits the form with the correct data', async () => {
    renderWithClient(<CreateClientForm />);

    const clientData = {
      name: 'Test Client',
      email: 'test@example.com',
      identification: 'ID-123',
      location: 'Location One',
      province: 'Province One',
      contactPerson: '123456789',
    };

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: clientData.name } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: clientData.email } });
    fireEvent.change(screen.getByLabelText('NIF/CIF'), { target: { value: clientData.identification } });
    fireEvent.change(screen.getByLabelText('Localidad'), { target: { value: clientData.location } });
    fireEvent.change(screen.getByLabelText('Provincia'), { target: { value: clientData.province } });
    fireEvent.change(screen.getByLabelText('Persona de contacto'), { target: { value: clientData.contactPerson } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Crear cliente' }));
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(clientData);
    });
  });

    it('shows a success message and redirects on successful submission', async () =>{

      renderWithClient(<CreateClientForm />);

  

      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Test Client' } });

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });

      fireEvent.change(screen.getByLabelText('NIF/CIF'), { target: { value: 'ID-123' } });

      fireEvent.change(screen.getByLabelText('Persona de contacto'), { target: { value: '123456789' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Crear cliente' }));
    });

    await act(async () => {
      capturedMutationOptions.onSuccess();
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Cliente creado');
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['clients'] });

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/clients');
    });
  });

  it('shows an error message on failed submission', async () => {
    const mockError = new ApiServiceError('Failed to create client.', 400);
    renderWithClient(<CreateClientForm />);

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Test Client' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('NIF/CIF'), { target: { value: 'ID-123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Crear cliente' }));
    });

    await act(async () => {
        capturedMutationOptions.onError(mockError);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Los datos enviados no son válidos. Revisa los campos del formulario.');
    });
  });
});