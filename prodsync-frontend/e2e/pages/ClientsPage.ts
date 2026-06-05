import { Page, expect, Locator } from '@playwright/test';

export class ClientsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly clientTable: Locator;
  readonly createClientButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Clients' });
    this.clientTable = page.getByTestId('client-table');
    this.createClientButton = page.getByRole('button', { name: 'Create New Client' });
  }

  async goto() {
    await this.page.goto('/clients');
    await expect(this.heading).toBeVisible();
  }

  async expectToBeOnPage() {
    await expect(this.page).toHaveURL('/clients');
    await expect(this.heading).toBeVisible();
  }

  async clickCreateClient() {
    await this.createClientButton.click();
  }

  async expectClientToBeVisible(clientName: string) {
    await expect(this.clientTable.getByText(clientName)).toBeVisible();
  }

  async viewClient(clientName: string) {
    const clientRow = this.clientTable.getByText(clientName).locator('..');
    await clientRow.locator('a', { hasText: 'View' }).click({ force: true, timeout: 30000 });
  }
}
