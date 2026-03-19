import { GET, POST } from '@/app/api/clients/route';
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

describe('Clients API Route', () => {
  let mockClients: Client[];

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
    mockClients = [
      { id: '1', name: 'Test Client 1', email: 'test1@example.com', identification: '123' },
      { id: '2', name: 'Test Client 2', email: 'test2@example.com', identification: '456' },
    ];
  });

  it('GET should return all clients', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockClients));
    await GET();
    expect(fetchMock).toHaveBeenCalledWith(`${process.env.NEXT_PUBLIC_API_URL}/clients`);
    expect(NextResponse.json).toHaveBeenCalledWith(mockClients);
  });

  it('POST should create a new client', async () => {
    const newClientData = { name: 'New Client', identification: '789', email: 'new@example.com' };
    fetchMock.mockResponseOnce(JSON.stringify({ id: '3', ...newClientData }), { status: 201 });
    
    const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify(newClientData)
    });

    await POST(request);
    
    expect(fetchMock).toHaveBeenCalledWith(`${process.env.NEXT_PUBLIC_API_URL}/clients`, expect.any(Object));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Client created successfully', client: { id: '3', ...newClientData } },
      { status: 201 }
    );
  });

  it('POST should return 400 for missing fields', async () => {
    const newClientData = { name: 'Incomplete Client' };
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });

    const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify(newClientData)
    });

    await POST(request);
    
    expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Missing required fields' }, { status: 400 });
  });

  it('POST should return 400 for duplicate email', async () => {
    const newClientData = { name: 'Duplicate', identification: '999', email: 'test1@example.com' };
    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Client with this email or identification already exists' }), { status: 400 });
    
    const request = new Request('http://test.com', {
        method: 'POST',
        body: JSON.stringify(newClientData)
    });
    
    await POST(request);

    expect(NextResponse.json).toHaveBeenCalledWith({ message: 'Client with this email or identification already exists' }, { status: 400 });
  });
});