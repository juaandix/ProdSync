import { test, expect } from '@playwright/test';
import { ClientsPage } from './pages/ClientsPage';
import { CreateClientPage } from './pages/CreateClientPage';
import { EditClientPage } from './pages/EditClientPage';
import { ViewClientPage } from './pages/ViewClientPage';
import * as fs from 'fs';

const MOCK_CLIENT_NAME = 'Tech Solutions Inc.';
const MOCK_CLIENT_ID = '1';
const MOCK_CLIENT_EMAIL = 'contact@techsolutions.com';

const mockClientBackend = {
  id: MOCK_CLIENT_ID,
  nombre: MOCK_CLIENT_NAME,
  identificacion: 'TSI-123',
  email: MOCK_CLIENT_EMAIL,
  contacto: 'Jane Doe',
  localidad: 'Tech City',
  provincia: 'Silicon Valley',
};

test.describe('Client Management', () => {

  test.beforeEach(async ({ page }) => {
    // Mock API calls
    await page.route('**/api/clientes', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockClientBackend]),
      });
    });
    await page.route(`**/api/clientes/${MOCK_CLIENT_ID}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClientBackend),
      });
    });

    // Inyectar el token en localStorage y como cookie para el middleware
    try {
      const token = fs.readFileSync('e2e/token.txt', 'utf-8');
      await page.goto('/');
      await page.evaluate(t => {
        localStorage.setItem('authToken', t);
      }, token);
      await page.context().addCookies([{
        name: 'authToken',
        value: token,
        domain: 'localhost',
        path: '/',
      }]);
    } catch (error) {
      console.error("Could not read token file or set cookie.", error);
    }
    // Navegar a dashboard después de configurar la autenticación
    await page.goto('/dashboard');
    await expect(page.locator('aside')).toBeVisible();
  });

  test('TC-CLIENT-LIST-01: should display mocked client data in the table', async ({ page }) => {
    const clientsPage = new ClientsPage(page);
    await clientsPage.goto();
    await expect(clientsPage.heading).toBeVisible();
    await clientsPage.expectClientToBeVisible(MOCK_CLIENT_NAME);
    await expect(clientsPage.clientTable).toBeVisible();
  });

  test('TC-CLIENT-DETAIL-01: should navigate to client details directly', async ({ page }) => {
    const viewClientPage = new ViewClientPage(page);
    await viewClientPage.goto(MOCK_CLIENT_ID);
    await viewClientPage.expectToBeOnPage(MOCK_CLIENT_ID, MOCK_CLIENT_NAME, MOCK_CLIENT_EMAIL);
  });

  test('TC-CLIENT-EDIT-01: should load client data in the edit form', async ({ page }) => {
    const editClientPage = new EditClientPage(page);
    await editClientPage.goto(MOCK_CLIENT_ID);
    await expect(editClientPage.nameInput).toBeVisible();
    // Use the name from the mocked data for consistency
    await editClientPage.expectFormToBePrefilled(MOCK_CLIENT_NAME, MOCK_CLIENT_EMAIL);
  });

  test('TC-CLIENT-FORM-01: should display the create client form correctly', async ({ page }) => {
    const createClientPage = new CreateClientPage(page);
    await createClientPage.goto();
    await expect(createClientPage.nameInput).toBeVisible();
    await expect(createClientPage.identificationInput).toBeVisible();
    await expect(createClientPage.emailInput).toBeVisible();
    await expect(createClientPage.submitButton).toBeVisible();
  });

  test('TC-CLIENT-FORM-02: should show an error for empty required fields', async ({ page }) => {
    const createClientPage = new CreateClientPage(page);
    await createClientPage.goto();
    await createClientPage.submitButton.click();
    // The schema validation message is "Name must be at least 2 characters"
    await createClientPage.expectErrorMessage("Name must be at least 2 characters");
  });
});
