
import { NextResponse } from "next/server";
import { addUser, getUsers } from "@/components/tables/data/userData";
import { User } from "@/types/models";

export async function GET() {
  const users = getUsers();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { name, email, role } = await request.json();

  // Generar un ID único (para fines de simulación)
  const id = `usr_${Math.random().toString(36).substr(2, 9)}`;

  const newUser: User = {
    id,
    name,
    username: name,
    email,
    role,
    status: "ACTIVE", // Los nuevos usuarios están activos de forma predeterminada
  };

  addUser(newUser);

  console.log("Creating user:", newUser);

  return NextResponse.json({ message: "User created successfully", user: newUser });
}
