import { GET, PUT, DELETE } from '@/app/api/clients/[id]/route';
import { NextResponse } from 'next/server';
import fetchMock from 'jest-fetch-mock';
import { Client } from '@/types/models';

fetchMock.enableMocks();

jest.mock('next/server', () => {
  const MockNextResponse = jest.fn((body: unknown, init?: ResponseInit) => ({
    status: init?.status || 200,
    json: () => Promise.resolve(body),
    headers: new Headers(),
    ...body,
  })) as unknown as typeof NextResponse;
  MockNextResponse.json = jest.fn((data: unknown, options?: ResponseInit) => ({
    status: options?.status || 200,
    json: () => Promise.resolve(data),
    headers: new Headers(),
    ...data,
  })) as unknown as typeof NextResponse['json'];
  return { NextResponse: MockNextResponse };
});

describe('Single Client API Route', () => {
  const mockClients: Client[] = [
    { id: '1', name: 'Test Client 1', email: 'test1@example.com', identification: '123' },
    { id: '2', name: 'Test Client 2', email: 'test2@example.com', identification: '456' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
  });

  describe('GET', () => {
    it('should return a single client', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockClients[0]));
      await GET(new Request('http://localhost'), { params: Promise.resolve({ id: '1' }) });
      expect(fetchMock).toHaveBeenCalledWith(`${process.env.API_URL}/clients/1`);
      expect(NextResponse.json).toHaveBeenCalledWith(mockClients[0]);
    });

    it('should return 404 for a non-existent client', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ message: 'Client not found' }), { status: 404 });
      await GET(new Request('http://localhost'), { params: Promise.resolve({ id: '999' }) });
      expect(fetchMock).toHaveBeenCalledWith(`${process.env.API_URL}/clients/999`);
      expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Client not found' }, { status: 404 });
    });
  });

  describe('PUT', () => {
    it('should update a client successfully', async () => {
      const updatedData = { name: 'Updated Client Name' };
      const finalClient = { ...mockClients[0], ...updatedData };
      fetchMock.mockResponseOnce(JSON.stringify(finalClient), { status: 200 });

      const request = new Request('http://test.com/1', { method: 'PUT', body: JSON.stringify(updatedData) });
      
      await PUT(request, { params: Promise.resolve({ id: '1' }) });
      
      expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Client updated successfully', client: finalClient });
    });

    it('should return 400 for duplicate email', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ message: 'Email already in use' }), { status: 400 });
        const request = new Request('http://test.com/1', { method: 'PUT', body: JSON.stringify({ email: 'test2@example.com' }) });
        await PUT(request, { params: Promise.resolve({ id: '1' }) });
        expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Email already in use' }, { status: 400 });
    });
  });

  describe('DELETE', () => {
    it('should delete a client successfully', async () => {
      fetchMock.mockResponseOnce('', { status: 204 });
      await DELETE(new Request('http://localhost'), { params: Promise.resolve({ id: '1' }) });
      // Expect NextResponse constructor to be called with null body and 204 status
      expect(NextResponse).toHaveBeenCalledWith(null, { status: 204 });
    });
  });
});