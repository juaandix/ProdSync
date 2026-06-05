import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Navigation Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Leer el token del archivo guardado por global-setup
    const token = fs.readFileSync('e2e/token.txt', 'utf-8');

    // Navegar a la página base para establecer el contexto del navegador
    await page.goto('/');

    // Inyectar el token en localStorage
    await page.evaluate(t => {
      localStorage.setItem('authToken', t);
    }, token);

    // Inyectar el token como cookie
    await page.context().addCookies([{
      name: 'authToken',
      value: token,
      domain: 'localhost',
      path: '/',
    }]);

    // Ahora, la navegación debería funcionar. Ir a una página de inicio después del login.
    await page.goto('/dashboard');
    await expect(page.locator('aside')).toBeVisible();
  });

  test('should navigate to the users page direct access', async ({ page }) => {
    await page.goto('/users');
    await expect(page.locator('main').getByRole('listitem').filter({ hasText: 'Users' })).toBeVisible();
  });

  test('should navigate to Projects via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page.getByRole('main').getByRole('listitem').filter({ hasText: 'Projects' })).toBeVisible();
  });

  test('should navigate to Clients via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Clients', exact: true }).click({ force: true });
    await expect(page.getByRole('main').getByRole('listitem').filter({ hasText: 'Clients' })).toBeVisible();
  });

  test('should navigate to Users via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Users', exact: true }).click();
    await expect(page.getByRole('main').getByRole('listitem').filter({ hasText: 'Users' })).toBeVisible();
  });

 
});