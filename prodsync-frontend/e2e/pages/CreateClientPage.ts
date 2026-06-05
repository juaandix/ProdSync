import { type Page, type Locator, expect } from '@playwright/test';

export class CreateClientPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly identificationInput: Locator;
  readonly emailInput: Locator;
  readonly locationInput: Locator;
  readonly provinceInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel(/Nombre|Name/i);
    this.identificationInput = page.getByLabel(/Identificación|Identification/i);
    this.emailInput = page.getByLabel(/Email/i);
    this.locationInput = page.getByLabel(/Ubicación|Location/i);
    this.provinceInput = page.getByLabel(/Provincia|Province/i);
    this.submitButton = page.getByRole('button', { name: /Crear Cliente|Create Client/i });
  }

  async goto() {
    await this.page.goto('/clients/create');
  }

  async expectToBeOnPage() {
    await expect(this.page).toHaveURL(/.*\/clients\/create/);
  }

  async fillForm(client: { name: string; email: string; identification: string; location: string; province: string }) {
    await this.nameInput.fill(client.name);
    await this.identificationInput.fill(client.identification);
    await this.emailInput.fill(client.email);
    await this.locationInput.fill(client.location);
    await this.provinceInput.fill(client.province);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
