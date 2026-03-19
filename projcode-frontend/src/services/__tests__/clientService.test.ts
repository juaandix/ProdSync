import { clientService } from '../clientService';

// Mock apiClient (axios instance) to avoid real HTTP calls
jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import apiClient from '@/lib/apiClient';

const mockApiClient = apiClient as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('clientService', () => {
  const mockClientBackend = {
    id: '1',
    nombre: 'Test Client',
    identificacion: '12345',
    email: 'test@example.com',
    localidad: 'Test City',
    provincia: 'Test Province',
    contactPerson: 'Test Contact',
  };

  const mockClientFrontend = {
    id: '1',
    name: 'Test Client',
    identification: '12345',
    email: 'test@example.com',
    location: 'Test City',
    province: 'Test Province',
    contactPerson: 'Test Contact',
    phone: '',
    avatar: '',
  };

  describe('getAll', () => {
    it('should fetch all clients successfully', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: [mockClientBackend] });

      const clients = await clientService.getAll();
      expect(mockApiClient.get).toHaveBeenCalledWith('/clientes');
      expect(clients).toEqual([mockClientFrontend]);
    });

    it('should handle 404 error when fetching all clients', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Clients not found'));

      await expect(clientService.getAll()).rejects.toThrow('Clients not found');
    });

    it('should handle 500 error when fetching all clients', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Internal Server Error'));

      await expect(clientService.getAll()).rejects.toThrow('Internal Server Error');
    });

    it('should handle network error when fetching all clients', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(clientService.getAll()).rejects.toThrow('Network Error');
    });
  });

  describe('create', () => {
    const newClientData = {
      name: 'New Client',
      identification: '67890',
      email: 'new@example.com',
      location: 'New City',
      province: 'New Province',
      contactPerson: 'New Contact',
    };
    const newClientBackend = {
      id: '2',
      nombre: 'New Client',
      identificacion: '67890',
      email: 'new@example.com',
      localidad: 'New City',
      provincia: 'New Province',
      contactPerson: 'New Contact',
    };

    it('should create a client successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: newClientBackend });

      const createdClient = await clientService.create(newClientData);
      expect(mockApiClient.post).toHaveBeenCalledWith('/clientes', {
        nombre: 'New Client',
        identificacion: '67890',
        email: 'new@example.com',
        localidad: 'New City',
        provincia: 'New Province',
        contactPerson: 'New Contact',
      });
      expect(createdClient).toEqual({
        id: '2',
        name: 'New Client',
        identification: '67890',
        email: 'new@example.com',
        location: 'New City',
        province: 'New Province',
        contactPerson: 'New Contact',
        phone: '',
        avatar: '',
      });
    });

    it('should handle error when creating a client', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Creation failed'));

      await expect(clientService.create(newClientData)).rejects.toThrow('Creation failed');
    });
  });

  describe('delete', () => {
    it('should delete a client successfully', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ data: {} });

      await clientService.delete('1');
      expect(mockApiClient.delete).toHaveBeenCalledWith('/clientes/1');
    });

    it('should handle error when deleting a client', async () => {
      mockApiClient.delete.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(clientService.delete('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('getById', () => {
    it('should fetch a client by ID successfully', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockClientBackend });

      const client = await clientService.getById('1');
      expect(mockApiClient.get).toHaveBeenCalledWith('/clientes/1');
      expect(client).toEqual(mockClientFrontend);
    });

    it('should handle 404 error when fetching client by ID', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Client not found'));

      await expect(clientService.getById('999')).rejects.toThrow('Client not found');
    });
  });

  describe('update', () => {
    const updatedClientData = {
      name: 'Updated Client',
      identification: '54321',
      email: 'updated@example.com',
      location: 'Updated City',
      province: 'Updated Province',
      contactPerson: 'Updated Contact',
    };
    const updatedClientBackend = {
      id: '1',
      nombre: 'Updated Client',
      identificacion: '54321',
      email: 'updated@example.com',
      localidad: 'Updated City',
      provincia: 'Updated Province',
      contactPerson: 'Updated Contact',
    };

    it('should update a client successfully', async () => {
      mockApiClient.put.mockResolvedValueOnce({ data: updatedClientBackend });

      const updatedClient = await clientService.update('1', updatedClientData);
      expect(mockApiClient.put).toHaveBeenCalledWith('/clientes/1', {
        nombre: 'Updated Client',
        identificacion: '54321',
        email: 'updated@example.com',
        localidad: 'Updated City',
        provincia: 'Updated Province',
        contactPerson: 'Updated Contact',
      });
      expect(updatedClient).toEqual({
        id: '1',
        name: 'Updated Client',
        identification: '54321',
        email: 'updated@example.com',
        location: 'Updated City',
        province: 'Updated Province',
        contactPerson: 'Updated Contact',
        phone: '',
        avatar: '',
      });
    });

    it('should handle error when updating a client', async () => {
      mockApiClient.put.mockRejectedValueOnce(new Error('Update failed'));

      await expect(clientService.update('1', updatedClientData)).rejects.toThrow('Update failed');
    });
  });
});
