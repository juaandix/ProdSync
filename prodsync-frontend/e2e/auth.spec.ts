import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication Page', () => {

  test('TC-AUTH-00: should display the login form correctly', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.getByRole('heading', { name: 'Sign In', level: 1 })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  });

  test('TC-AUTH-01: should login successfully and redirect', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'password123');

    // Esperar la redirección y verificar la URL y la visibilidad del sidebar
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
    await expect(page.locator('aside')).toBeVisible();
  });

  test('TC-AUTH-02: should show an error toast on invalid credentials', async ({ page }) => {
    await page.goto('/signin');
    const loginPage = new LoginPage(page);
    await loginPage.login('invalid-email@test.com', 'wrongpassword');
    
    // Esperar el mensaje de error amigable que muestra el frontend
    await loginPage.expectErrorMessage('Credenciales incorrectas. Inténtalo de nuevo.');
  });
});
