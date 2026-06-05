import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_URL || 'http://localhost:8080/api';

// GET a single client by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`);
    if (response.status === 404) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }
    if (!response.ok) {
      throw new Error('Failed to fetch client');
    }
    const client = await response.json();
    return NextResponse.json(client);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Error fetching client', error: message }, { status: 500 });
  }
}

// PUT (update) a client by ID
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const clientData = await request.json();

    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const updatedClient = await response.json();
    return NextResponse.json({ message: 'Client updated successfully', client: updatedClient });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Error updating client', error: message }, { status: 500 });
  }
}

// DELETE a client by ID
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE',
    });

    if (response.status === 204 || response.ok) {
      return new NextResponse(null, { status: 204 }); // Sin contenido
    }
    
    if (response.status === 404) {
        return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ message: 'Failed to delete client', error: errorData }, { status: response.status });
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Error deleting client', error: message }, { status: 500 });
  }
}
