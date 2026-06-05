import { type Page, type Locator, expect } from '@playwright/test';

export class CreateProjectPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly clientSelect: Locator;
  readonly descriptionInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly statusSelect: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'New Project' });
    this.nameInput = page.getByLabel('Nombre del Proyecto');
    this.clientSelect = page.getByLabel('Cliente');
    this.descriptionInput = page.getByLabel('Descripción');
    this.startDateInput = page.getByLabel('Fecha de Inicio');
    this.endDateInput = page.getByLabel('Fecha de Fin');
    this.statusSelect = page.getByLabel('Estado');
    this.submitButton = page.getByRole('button', { name: 'Crear Proyecto' });
  }

  async goto() {
    await this.page.goto('/projects/create');
  }

  async expectToBeOnPage() {
    await expect(this.heading).toBeVisible();
  }

  async fillForm(details: {
    name: string;
    clientId: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
  }) {
    await this.nameInput.fill(details.name);

    // Esperar a que el select de cliente esté habilitado
    await expect(this.clientSelect).toBeEnabled();
    await this.clientSelect.selectOption({ value: details.clientId });

    await this.descriptionInput.fill(details.description);
    await this.startDateInput.fill(details.startDate);
    await this.endDateInput.fill(details.endDate);
    await this.statusSelect.selectOption({ label: details.status });
  }

  async submitForm() {
    await this.submitButton.click();
  }
}
