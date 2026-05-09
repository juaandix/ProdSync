#!/usr/bin/env node
/**
 * seed-users.mjs
 *
 * Crea los usuarios de prueba (OPERATOR y USER) en el backend si no existen,
 * y les asigna el rol correcto usando la API de admin.
 *
 * El usuario ADMIN lo crea el propio backend al arrancar.
 *
 * Uso:
 *   npm run seed
 *
 * Requiere que el backend esté corriendo en NEXT_PUBLIC_API_URL
 * (por defecto http://localhost:8080/api).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Prioridad: variable de entorno > .env.local > valor por defecto
const __dirname = dirname(fileURLToPath(import.meta.url));
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

if (!process.env.NEXT_PUBLIC_API_URL) {
  try {
    const envPath = resolve(__dirname, '../.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/NEXT_PUBLIC_API_URL=(.+)/);
    if (match) API_URL = match[1].trim();
  } catch {
    // .env.local no existe, se usa el valor por defecto
  }
}

console.log(`\n🌱 Seed de usuarios — API: ${API_URL}\n`);

const ADMIN = {
  username: 'admin@test.com',
  password: 'password123',
  email: 'admin@test.com',
  nombre: 'Admin User',
  estado: 'ACTIVE',
  role: 'ADMIN',
};

const SEED_USERS = [
  {
    username: 'operator@test.com',
    password: 'password123',
    email: 'operator@test.com',
    nombre: 'Operator User',
    estado: 'ACTIVE',
    role: 'OPERATOR',
  },
  {
    username: 'user@test.com',
    password: 'password123',
    email: 'user@test.com',
    nombre: 'Regular User',
    estado: 'ACTIVE',
    role: 'USER',
  },
];

async function loginAsAdmin() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`No se pudo hacer login como admin (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error('La respuesta de login no contiene token');
  console.log('  🔑  Login como admin OK\n');
  return data.token;
}

async function registerUser(user) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });

  if (res.ok) {
    console.log(`  ✅  Registrado: ${user.email}`);
    return true; // nuevo usuario
  } else if (res.status === 409) {
    console.log(`  ⏩  Ya existe:  ${user.email}`);
    return false; // ya existía
  } else {
    const body = await res.text().catch(() => '');
    console.error(`  ❌  Error ${res.status} al registrar ${user.email}: ${body}`);
    return false;
  }
}

async function getAllUsers(token) {
  const res = await fetch(`${API_URL}/usuarios`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`No se pudo obtener la lista de usuarios (${res.status}): ${body}`);
  }

  return res.json();
}

async function updateUserRole(id, role, nombre, email, password, username, token) {
  const res = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role, nombre, email, password, username, estado: 'ACTIVE' }),
  });

  if (res.ok) {
    console.log(`  🔧  Rol actualizado → ${role}  (${email})`);
  } else {
    const body = await res.text().catch(() => '');
    console.error(`  ❌  Error ${res.status} al actualizar rol de ${email}: ${body}`);
  }
}

async function main() {
  // 1. Asegurar que el admin existe (el backend lo crea al arrancar, pero por si acaso)
  const adminReg = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN),
  });
  if (adminReg.ok) {
    console.log('  ✅  Admin registrado\n');
  } else if (adminReg.status === 409) {
    console.log('  ⏩  Admin ya existe\n');
  } else {
    const body = await adminReg.text().catch(() => '');
    console.warn(`  ⚠️   No se pudo registrar admin (${adminReg.status}): ${body}\n`);
  }

  // 2. Login como admin para obtener token
  const adminToken = await loginAsAdmin();

  // 3. Registrar usuarios (el backend los crea con rol USER por defecto)
  for (const user of SEED_USERS) {
    await registerUser(user);
  }

  console.log('');

  // 4. Obtener lista de usuarios con token admin
  const allUsers = await getAllUsers(adminToken);

  // 5. Para cada seed user, buscar su ID y asignar el rol correcto
  for (const seedUser of SEED_USERS) {
    const found = allUsers.find(
      (u) => u.email === seedUser.email || u.username === seedUser.username
    );

    if (!found) {
      console.error(`  ❌  No se encontró el usuario ${seedUser.email} en la lista`);
      continue;
    }

    await updateUserRole(found.id, seedUser.role, seedUser.nombre, seedUser.email, seedUser.password, seedUser.username, adminToken);
  }

  console.log('\n✔  Seed completado.\n');
}

main().catch((err) => {
  console.error('\n❌  No se pudo completar el seed:', err.message);
  console.error('   Asegúrate de que el backend está corriendo antes de ejecutar npm run seed.\n');
  process.exit(1);
});
