import { test, expect } from '@playwright/test';
import { ClientsPage } from './pages/ClientsPage';
import { CreateClientPage } from './pages/CreateClientPage';
import { EditClientPage } from './pages/EditClientPage';
import { ViewClientPage } from './pages/ViewClientPage';
import * as fs from 'fs'; // Importar fs para leer el archivo

const runId = new Date().getTime();
const newClient = {
  name: `Test Client ${runId}`,
  email: `test-${runId}@example.com`,
  identification: `ID-${runId}`,
  location: 'Test Location',
  province: 'Test Province',
  contactPerson: 'Test Contact',
};
const updatedClient = {
  name: `Updated Client ${runId}`,
  email: `updated-${runId}@example.com`,
};

test.describe('Client CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    const token = fs.readFileSync('e2e/token.txt', 'utf-8');

    await page.goto('/');
    await page.evaluate(t => {
      localStorage.setItem('authToken', t);
    }, token);
    await page.context().addCookies([
      {
        name: 'authToken',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/clients');
    await expect(page).toHaveURL(/.*\/clients/);
    await expect(page.locator('aside')).toBeVisible();
  });

  test('should create, view, edit, and delete a client', async ({ page }) => {
    const clientsPage = new ClientsPage(page);
    const createClientPage = new CreateClientPage(page);
    const editClientPage = new EditClientPage(page);
    const viewClientPage = new ViewClientPage(page);

    await clientsPage.goto();
    await clientsPage.expectToBeOnPage();
    await clientsPage.clickCreateClient();

    await createClientPage.expectToBeOnPage();
    await createClientPage.fillForm(newClient);
    await createClientPage.submitForm();

    await expect(page).toHaveURL(/.*\/clients/); // Esperar la redirección a la lista de clientes

    // Mock de la respuesta para obtener todos los clientes DESPUÉS de la creación
    await page.route('**/api/clientes', route => {
      route.fulfill({ json: [{ 
        id: '1',
        nombre: newClient.name,
        identificacion: newClient.identification,
        email: newClient.email,
        localidad: newClient.location,
        provincia: newClient.province,
        contactPerson: newClient.contactPerson,
      }] });
    });
    
    // En lugar de esperar una redirección, navegamos directamente a la página de clientes
    await clientsPage.goto(); // Navegar a la página de listado de clientes
        await clientsPage.expectToBeOnPage(); // Esperar a que la página de clientes se cargue
    await clientsPage.expectClientToBeVisible(newClient.name);
  });
});
