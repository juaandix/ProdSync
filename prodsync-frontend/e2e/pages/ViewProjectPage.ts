import { type Page, type Locator, expect } from '@playwright/test';

export class ViewProjectPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectToBeOnPage(projectId: string, projectName: string, projectStatus: string, clientName: string) {
    await expect(this.page).toHaveURL(new RegExp(`.*\\/projects\\/${projectId}`));
    await expect(this.page.getByRole('heading', { name: projectName })).toBeVisible();
    await expect(this.page.getByText(projectStatus)).toBeVisible();
    await expect(this.page.getByText(clientName)).toBeVisible();
  }

  async clickEditProject() {
    await this.page.getByRole('link', { name: 'Edit Project' }).click();
  }
}
