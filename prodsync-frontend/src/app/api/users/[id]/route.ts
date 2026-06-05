import { NextRequest, NextResponse } from "next/server"; // Import NextRequest
import { MOCK_USERS } from "@/lib/data/mock-db";


export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const user = MOCK_USERS.find((user) => user.id === id);

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const { name, email, role } = await request.json();

  const userIndex = MOCK_USERS.findIndex((user) => user.id === id);

  if (userIndex === -1) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // Comprobar si hay un correo electrónico duplicado
  const duplicateEmail = MOCK_USERS.find((user) => user.email === email && user.id !== id);
  if (duplicateEmail) {
    return NextResponse.json({ message: "Email already in use" }, { status: 400 });
  }

  MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], name, email, role };

  return NextResponse.json({ message: "User updated successfully", user: MOCK_USERS[userIndex] });
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const userIndex = MOCK_USERS.findIndex((user) => user.id === id);

  if (userIndex === -1) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  MOCK_USERS.splice(userIndex, 1);

  return NextResponse.json({ message: "User deleted successfully" });
}
