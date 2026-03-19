import { type Page, type Locator, expect } from '@playwright/test';

export class UsersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly userTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Users' });
    this.userTable = page.getByRole('table');
  }

  async goto() {
    await this.page.goto('/users-table');
  }

  async expectUserToBeVisible(userName: string) {
    await expect(this.page.getByText(userName)).toBeVisible();
  }
}
