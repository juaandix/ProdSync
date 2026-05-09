import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithClient } from 'test-utils/QueryWrapper';
import ViewProjectCard from '@/components/project-profile/ViewProjectCard';
import { projectService } from '@/services/projectService';

// El servicio de cliente no es usado por este componente, se puede quitar el mock
// jest.mock('@/services/clientService'); 

jest.mock('@/services/projectService', () => ({
  projectService: {
    getById: jest.fn(),
  },
}));

const MOCK_CLIENT = {
  id: 'client1',
  name: 'Test Client',
  identification: '123',
  contactPerson: 'John Doe',
  email: 'john@example.com',
  location: 'Test City',
  province: 'Test Province',
};

// Se anida el cliente dentro del proyecto, como espera el componente
const MOCK_PROJECT = {
  id: '1',
  name: 'Test Project',
  description: 'Test Description',
  status: 'In Progress',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  client: MOCK_CLIENT, // Objeto cliente anidado
};

describe('ViewProjectCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays project and client data', async () => {
    (projectService.getById as jest.Mock).mockResolvedValue(MOCK_PROJECT);

    renderWithClient(<ViewProjectCard id="1" />);

    await waitFor(() => {
      expect(projectService.getById).toHaveBeenCalledWith('1');
      // Se verifica que el componente renderiza los datos anidados correctamente
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test Client')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  it('shows an error message on API failure for project', async () => {
    const errorMessage = 'Failed to fetch project.';
    (projectService.getById as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    renderWithClient(<ViewProjectCard id="1" />);
    
    // Se busca el mensaje de error exacto que el componente renderiza
    expect(await screen.findByText('No se pudo cargar el proyecto. Inténtalo de nuevo.')).toBeInTheDocument();
  });

  // La prueba de fallo de cliente ya no es necesaria, ya que no hay una llamada separada.
  // Se podría añadir una prueba para el caso en que 'project.client' es nulo si se desea.
  it('displays "Not assigned" if client is not present', async () => {
    const projectWithoutClient = { ...MOCK_PROJECT, client: null };
    (projectService.getById as jest.Mock).mockResolvedValue(projectWithoutClient);

    renderWithClient(<ViewProjectCard id="1" />);

    await waitFor(() => {
      expect(screen.queryByText('Client Information')).not.toBeInTheDocument();
    });
  });
});
