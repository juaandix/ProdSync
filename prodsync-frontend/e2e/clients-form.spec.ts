import { test, expect } from '@playwright/test';
import { CreateClientPage } from './pages/CreateClientPage';
import * as fs from 'fs';

test.describe('Client Creation Form', () => {

  test.beforeEach(async ({ page }) => {
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
  });

  test('TC-CLIENT-FORM-01: should display the create client form correctly', async ({ page }) => {
    const createClientPage = new CreateClientPage(page);
    await createClientPage.goto();
    await expect(createClientPage.nameInput).toBeVisible();
    await expect(createClientPage.identificationInput).toBeVisible();
    await expect(createClientPage.emailInput).toBeVisible();
  });

  test('TC-CLIENT-FORM-02: should show an error for empty required fields', async ({ page }) => {
    const createClientPage = new CreateClientPage(page);
    await createClientPage.goto();
    await createClientPage.submitForm();
    await createClientPage.expectErrorMessage("Name must be at least 2 characters");
  });
});
