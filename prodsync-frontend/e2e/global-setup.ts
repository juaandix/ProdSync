import { request as apiRequest } from '@playwright/test';
import * as fs from 'fs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

export const adminUser = {
  username: 'admin@test.com',
  password: 'password123',
  email: 'admin@test.com',
  nombre: 'Admin User',
  estado: 'ACTIVE',
  role: 'ADMIN',
};

export const operatorUser = {
  username: 'operator@test.com',
  password: 'password123',
  email: 'operator@test.com',
  nombre: 'Operator User',
  estado: 'ACTIVE',
  role: 'OPERATOR',
};

export const regularUser = {
  username: 'user@test.com',
  password: 'password123',
  email: 'user@test.com',
  nombre: 'Regular User',
  estado: 'ACTIVE',
  role: 'USER',
};

async function globalSetup() {
  console.log('Starting global setup...');
  console.log(`Using API_URL: ${API_URL}`);

  const requestContext = await apiRequest.newContext();

  // Register all seed users (409 = already exists, both are acceptable)
  for (const seedUser of [adminUser, operatorUser, regularUser]) {
    const res = await requestContext.post(`${API_URL}/auth/register`, { data: seedUser });
    if (res.ok()) {
      console.log(`User registered: ${seedUser.email}`);
    } else if (res.status() === 409) {
      console.log(`User already exists: ${seedUser.email}`);
    } else {
      console.warn(`Could not register ${seedUser.email} (status ${res.status()})`);
    }
  }

  // Now try to log in to get the token
  const loginResponse = await requestContext.post(`${API_URL}/auth/login`, {
    data: { username: adminUser.username, password: adminUser.password },
  });

  if (!loginResponse.ok()) {
    console.error(`Global setup failed: Could not log in (status ${loginResponse.status()}).`);
    // Save empty auth state and token file so tests can still run (they'll fail individually)
    fs.writeFileSync('e2e/token.txt', '');
    fs.writeFileSync('e2e/auth.json', JSON.stringify({ cookies: [], origins: [] }));
    console.log('Global setup finished: Empty auth state saved.');
    await requestContext.dispose();
    return;
  }

  // Extract the token from the login response body
  const loginBody = await loginResponse.json();
  const token = loginBody.token;

  if (!token) {
    console.error('Global setup failed: Login response did not contain a token.', loginBody);
    fs.writeFileSync('e2e/token.txt', '');
    fs.writeFileSync('e2e/auth.json', JSON.stringify({ cookies: [], origins: [] }));
    await requestContext.dispose();
    return;
  }

  console.log('Login successful. Token obtained.');

  // Save token to file for tests that read it directly
  fs.writeFileSync('e2e/token.txt', token);
  console.log('Token saved to e2e/token.txt.');

  // Fetch user role from /auth/me endpoint
  let userRole = 'admin';
  const meResponse = await requestContext.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (meResponse.ok()) {
    const meBody = await meResponse.json();
    userRole = (meBody.role || 'admin').toLowerCase();
    console.log(`User role obtained: ${userRole}`);
  } else {
    console.warn(`Could not fetch /auth/me (status ${meResponse.status()}), defaulting role to 'admin'.`);
  }

  // Build auth.json with the authToken + userRole cookies so Playwright can use it
  const authState = {
    cookies: [
      {
        name: 'authToken',
        value: token,
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        httpOnly: false,
        secure: false,
        sameSite: 'Lax' as const,
      },
      {
        name: 'userRole',
        value: userRole,
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 3600,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ],
    origins: [
      {
        origin: BASE_URL,
        localStorage: [
          {
            name: 'authToken',
            value: token,
          },
        ],
      },
    ],
  };

  fs.writeFileSync('e2e/auth.json', JSON.stringify(authState, null, 2));
  console.log('Global setup finished: Auth state saved to e2e/auth.json.');

  await requestContext.dispose();
}

export default globalSetup;
