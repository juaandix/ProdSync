import { type Page, type Locator, expect } from '@playwright/test';

export class EditClientPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly identificationInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /Editar Cliente|Edit Client/i });
    this.nameInput = page.getByLabel(/Nombre|Name/i);
    this.emailInput = page.getByLabel(/Email/i);
    this.identificationInput = page.getByLabel(/Identificación|Identification/i);
    this.submitButton = page.getByRole('button', { name: /Guardar Cambios|Save Changes/i });
  }

  async goto(clientId: string) {
    await this.page.goto(`/clients/edit/${clientId}`);
  }

  async expectToBeOnPage(clientId: string) {
    await expect(this.page).toHaveURL(new RegExp(`/clients/edit/${clientId}`));
    await expect(this.heading).toBeVisible();
  }

  async updateForm(client: { name?: string; email?: string }) {
    if (client.name) {
      await this.nameInput.fill(client.name);
    }
    if (client.email) {
      await this.emailInput.fill(client.email);
    }
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async expectFormToBePrefilled(name: string, email: string) {
    await expect(this.nameInput).toHaveValue(name);
    await expect(this.emailInput).toHaveValue(email);
  }
}
