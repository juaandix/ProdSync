import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ViewClientCard from '@/components/client-profile/ViewClientCard';
import { Client } from '@/types/models';
import { clientService } from '@/services/clientService';
import { projectService } from '@/services/projectService';
import { ApiServiceError } from '@/services/errors';

jest.mock('@/services/clientService', () => ({
  clientService: {
    getById: jest.fn(),
  },
}));

jest.mock('@/services/projectService', () => ({
  projectService: {
    getAll: jest.fn(),
  },
}));

const MOCK_CLIENT: Client = {
  id: '1',
  name: 'Test Client',
  email: 'test@example.com',
  identification: 'ID-TEST-001',
  contactPerson: 'John Doe',
  location: 'Test Location',
  province: 'Test Province',
};

const renderWithFreshClient = (ui: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('ViewClientCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (projectService.getAll as jest.Mock).mockResolvedValue([]);
  });

  it('renders the client data correctly', async () => {
    (clientService.getById as jest.Mock).mockResolvedValue(MOCK_CLIENT);

    renderWithFreshClient(<ViewClientCard id="1" />);

    expect(clientService.getById).toHaveBeenCalledWith('1');
    expect(await screen.findByText('Test Client')).toBeInTheDocument();
    const emailElements = await screen.findAllByText('test@example.com');
    expect(emailElements.length).toBeGreaterThan(0);
    const contactElements = await screen.findAllByText('John Doe');
    expect(contactElements.length).toBeGreaterThan(0);
  });

  it('shows a loading indicator while fetching data', () => {
    (clientService.getById as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderWithFreshClient(<ViewClientCard id="1" />);

    expect(screen.queryByText('Test Client')).not.toBeInTheDocument();
  });

  it('shows an error message if fetching fails', async () => {
    (clientService.getById as jest.Mock).mockRejectedValueOnce(
      new ApiServiceError('Failed to fetch client.', 404)
    );

    renderWithFreshClient(<ViewClientCard id="1" />);

    expect(await screen.findByText('El recurso solicitado no se encontró.')).toBeInTheDocument();
  });
});
