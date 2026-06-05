import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.test
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  timeout: 60 * 1000,
  globalSetup: './e2e/global-setup.ts',
  
  webServer: {
    command: `npm run build && npm run start -- -p ${FRONTEND_PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    },
  },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    headless: false,
    storageState: 'e2e/auth.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
