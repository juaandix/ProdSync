import React from 'react';
import { waitFor } from '@testing-library/react';
import { renderWithClient } from 'test-utils/QueryWrapper';
import '@testing-library/jest-dom';
import EditProjectForm from '@/components/form/EditProjectForm';
import { useRouter } from 'next/navigation';
import { projectService } from '@/services/projectService';
import { clientService } from '@/services/clientService';
import * as RHF from 'react-hook-form'; // Import react-hook-form as RHF

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useForm: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(() => 'loading-toast-id'),
  },
}));

const mockClients = [
  { id: 'client1', name: 'Client One', identification: '123', contactPerson: 'John Doe', email: 'john @example.com', location: 'NY', province: 'NY' },
  { id: 'client2', name: 'Client Two', identification: '456', contactPerson: 'Jane Doe', email: 'jane @example.com', location: 'LA', province: 'CA' },
];

const mockProject = {
  id: '1',
  name: 'Test Project',
  description: 'Test Description',
  status: 'In Progress',
  type: 'Web Development',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  estimate: 100,
  clientId: 'client1',
  client: { id: 'client1', name: 'Client One' }, // Added client property
};

describe('EditProjectForm', () => {
  const push = jest.fn();
  let mockReset: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(projectService, 'getById').mockResolvedValue(mockProject);
    jest.spyOn(clientService, 'getAll').mockResolvedValue(mockClients);
    (useRouter as jest.Mock).mockReturnValue({ push });

    const mockRegister = jest.fn();
    const mockHandleSubmit = jest.fn((cb) => cb);
    mockReset = jest.fn(); // Assign to the declared variable

    (RHF.useForm as jest.Mock).mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { errors: {} },
      reset: mockReset,
    });
  });

  it('fetches project data and populates the form', async () => {
    renderWithClient(<EditProjectForm id="1" />);

    await waitFor(() => {
        expect(mockReset).toHaveBeenCalledWith(
            expect.objectContaining({
                name: mockProject.name,
                description: mockProject.description,
                clientId: mockProject.clientId,
                startDate: '2024-01-01', // Expected format from formatDateForInput
                endDate: '2024-12-31',   // Expected format from formatDateForInput
                status: mockProject.status,
            })
        );
    });
  });


});
