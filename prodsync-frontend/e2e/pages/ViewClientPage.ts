import { type Page, type Locator, expect } from '@playwright/test';

export class ViewClientPage {
  readonly page: Page;
  readonly clientNameHeading: Locator;
  readonly editClientButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.clientNameHeading = page.getByRole('heading', { level: 4 }); // Asumiendo que el nombre del cliente está en un h4
    this.editClientButton = page.getByRole('button', { name: /Editar|Edit/i });
  }

  async goto(id: string) {
    await this.page.goto(`/clients/${id}`);
    await expect(this.page.getByRole('main').getByRole('listitem').filter({ hasText: 'Clients' })).toBeVisible();
    await expect(this.page.getByRole('main').getByRole('listitem').filter({ hasText: 'View' })).toBeVisible();
  }

  async expectToBeOnPage(clientId: string, clientName: string, clientEmail: string) {
    await expect(this.page).toHaveURL(new RegExp(`/clients/${clientId}`));
    await expect(this.page.getByRole('main').getByRole('listitem').filter({ hasText: 'Clients' })).toBeVisible();
    await expect(this.page.getByRole('main').getByRole('listitem').filter({ hasText: 'View' })).toBeVisible();
    
    await expect(this.page.getByText(clientName)).toBeVisible();
    await expect(this.page.locator('div:has-text("Información de contacto")').getByText(clientEmail).nth(1)).toBeVisible();
  }
}