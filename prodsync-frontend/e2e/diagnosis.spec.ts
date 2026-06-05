import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage'; // Importar LoginPage

test.describe('Diagnosis Suite', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'password123');
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('aside')).toBeVisible();
  });

  test('should capture browser logs and errors during navigation to Users Table', async ({ page }) => {
    // Reconfigurar los listeners para la consola del navegador si aún son necesarios
    page.on("console", msg => console.log("BROWSER LOG:", msg.text()));
    page.on("pageerror", err => console.log("BROWSER ERROR:", err.message));

    // Navegar directamente a /users después del login exitoso
    await page.goto('/users');

    // Asegurarse de que el sidebar está visible (ya debería estarlo por el beforeEach)
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Abrir menú Users (si es necesario)
    await sidebar.getByText('Users', { exact: true }).click();

    // Intentar hacer clic en el enlace "Users Table"
    const usersTableLink = sidebar.getByRole('link', { name: 'Users' });
    await expect(usersTableLink).toBeVisible();

    // DEBUG: Imprimir el HTML del enlace para ver si tiene href válido
    const html = await usersTableLink.evaluate(el => el.outerHTML);
    console.log("DEBUG LINK HTML (Users Table):", html);

    await usersTableLink.click();

    // Esperar a que la URL cambie y el heading sea visible
    await expect(page).toHaveURL(/.*\/users/); // Cambiar a la URL correcta si es /users
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();

    // Eliminar la espera de 5 segundos y la captura de pantalla si ya no son necesarias para depuración
    // console.log("DIAGNOSIS: Waiting 5 seconds after click...");
    // await page.waitForTimeout(5000);
    // await page.screenshot({ path: 'diagnosis-screenshot-users-table.png', fullPage: true });
    // console.log("DIAGNOSIS: Screenshot 'diagnosis-screenshot-users-table.png' taken.");
  });
});
