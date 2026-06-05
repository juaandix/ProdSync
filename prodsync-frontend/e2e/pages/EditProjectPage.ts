import { type Page, type Locator, expect } from '@playwright/test';

export class EditProjectPage {
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
    this.heading = page.getByRole('heading', { name: 'Editar Proyecto' });
    this.nameInput = page.getByLabel('Nombre del Proyecto');
    this.clientSelect = page.getByLabel('Cliente');
    this.descriptionInput = page.getByLabel('Descripción');
    this.startDateInput = page.getByLabel('Fecha de Inicio');
    this.endDateInput = page.getByLabel('Fecha de Fin (Opcional)');
    this.statusSelect = page.getByLabel('Estado');
    this.submitButton = page.getByRole('button', { name: 'Actualizar Proyecto' });
  }

  async goto(projectId: string) {
    await this.page.goto(`/projects/edit/${projectId}`);
  }

  async expectToBeOnPage(projectId: string) {
    await expect(this.page).toHaveURL(new RegExp(`.*\\/projects\\/edit\\/${projectId}`));
    await this.page.waitForLoadState('networkidle'); // Esperar a que la red esté inactiva
    await this.page.waitForSelector('form'); // Esperar a que el formulario esté presente
    await expect(this.submitButton).toBeVisible({ timeout: 10000 });
  }

  async updateForm(details: Partial<{
    name: string;
    description: string;
    status: string;
  }>) {
    if (details.name) await this.nameInput.fill(details.name);
    if (details.description) await this.descriptionInput.fill(details.description);
    if (details.status) await this.statusSelect.selectOption({ label: details.status });
  }

  async expectFormToBePrefilled(details: {
    name: string;
    clientId: string;
    description: string;
    status: string;
  }) {
    await expect(this.nameInput).toHaveValue(details.name);
    await expect(this.clientSelect).toHaveValue(details.clientId);
    await expect(this.descriptionInput).toHaveValue(details.description);
    await expect(this.statusSelect).toHaveValue(details.status);
  }

  async submitForm() {
    await this.submitButton.click();
  }
}
