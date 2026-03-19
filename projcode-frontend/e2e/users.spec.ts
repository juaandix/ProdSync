import { test, expect } from '@playwright/test';
import { CreateUserPage } from './pages/CreateUserPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';
import { adminUser } from './global-setup';

const runId = new Date().getTime();
const mockUserId = 'user-123';

const newUser = {
    id: mockUserId,
    name: `Test User ${runId}`,
    username: `testuser-${runId}`,
    email: `test-e2e-${runId}@example.com`,
    password: 'password123',
    role: 'USER',
    status: 'ACTIVE',
};

const newUserBackend = {
    id: newUser.id,
    nombre: newUser.name,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role.toUpperCase(), 
    estado: newUser.status.toUpperCase(),
};

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(adminUser.username, adminUser.password);
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('aside')).toBeVisible();
  });

    test.describe('Create User Form', () => {
            test('TC-USER-FORM-01: should display the create user form correctly', async ({ page }) => {
              const createUserPage = new CreateUserPage(page);
              await createUserPage.goto(); // Mantener goto para este test ya que se verifica la carga inicial
              await expect(createUserPage.heading).toBeVisible();
              await expect(createUserPage.heading).toHaveText('New User'); 
              await expect(createUserPage.nameInput).toBeVisible();            await expect(createUserPage.emailInput).toBeVisible();
        });

        test('TC-USER-FORM-02: should show an error for empty required fields', async ({ page }) => {
            const createUserPage = new CreateUserPage(page);
            await createUserPage.goto(); // Mantener goto para este test
            await createUserPage.createUserButton.click();
            const nameInput = page.locator('#name');
            const nameError = nameInput.locator('+ p.text-red-500', { hasText: 'Name must be at least 2 characters' });
            await expect(nameError).toBeVisible();
        });
    });

    test.describe('User List', () => {
        test('TC-USER-LIST-01: should create a user and see them in the list', async ({ page }) => {
            const createUserPage = new CreateUserPage(page);
            const usersPage = new UsersPage(page);

            await page.route('**/api/usuarios', route => route.fulfill({ status: 201, json: newUserBackend }));

            await createUserPage.goto(); // Ir a la página de creación para iniciar el proceso

            await page.unroute('**/api/usuarios');
            await page.route('**/api/usuarios', route => route.fulfill({ json: [newUserBackend] }));
            
            await createUserPage.createUser(
                newUser.name,
                newUser.username,
                newUser.email,
                newUser.password,
                newUser.role,
                newUser.status
            );

            await expect(page).toHaveURL(/.*\/users/, { timeout: 10000 }); 
            await usersPage.expectUserToBeVisible(newUser.name);
        });
    });
});