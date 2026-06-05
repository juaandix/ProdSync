import { type Page, type Locator, expect } from '@playwright/test';

export class ProjectsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly projectTable: Locator;
  readonly createProjectButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Projects' });
    this.projectTable = page.getByRole('table');
    this.createProjectButton = page.getByRole('button', { name: 'Create New Project' });
  }

  async expectToBeOnPage(expectedRowCount: number = 1) {
    await expect(this.heading).toBeVisible();
    await expect(this.projectTable.locator('tbody tr')).toHaveCount(expectedRowCount, { timeout: 10000 });
  }

  async goto() {
    await this.page.goto('/projects');
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateProject() {
    await this.createProjectButton.click();
  }

  private getProjectRow(projectName: string): Locator {
    // Selector más robusto: busca una fila que contenga el texto del proyecto
    return this.projectTable.locator('tr', { hasText: projectName });
  }

  async expectProjectToBeVisible(projectName: string) {
    await expect(this.getProjectRow(projectName)).toBeVisible();
  }

  async expectProjectToNotExist(projectName: string) {
    await expect(this.getProjectRow(projectName)).not.toBeVisible();
  }

  async getProjectId(projectName: string): Promise<string | null> {
    const row = this.getProjectRow(projectName);
    const link = row.getByTitle('Editar');
    const href = await link.getAttribute('href');
    return href ? href.split('/').pop() || null : null;
  }

  async editProject(projectName: string) {
    const row = this.getProjectRow(projectName);
    await row.getByTitle('Editar').click();
  }

  async deleteProject(projectName: string) {
    const row = this.getProjectRow(projectName);
    await row.getByTitle('Eliminar').click();
  }
  async confirmDeletion() {
    // Esperar a que el título del modal sea visible. Esto confirma que el modal está abierto.
    const modalTitle = this.page.getByRole('heading', { name: 'Confirm Deletion' });
    await expect(modalTitle).toBeVisible({ timeout: 10000 });

    // Localizar el div.p-6 que contiene el título del modal, que es el contenedor del contenido del modal.
    const modalContentDiv = this.page.locator('div.p-6', { has: modalTitle });

    // Localizar el botón "Delete" DENTRO de ese div específico.
    const deleteButton = modalContentDiv.getByRole('button', { name: 'Delete', exact: true });
    await deleteButton.click();
  }
}
