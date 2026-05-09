import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
  }

  async goto() {
    await this.page.goto('/signin');
  }

  async login(email: string, password?: string) {
    await this.emailInput.fill(email);
    if (password) {
      await this.passwordInput.fill(password);
    }
    await this.signInButton.click();
  }

  async expectErrorMessage(message: string | RegExp) {
    const errorMessage = this.page.getByText(message);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  }

  async expectToBeRedirectedTo(url: string | RegExp) {
    await expect(this.page).toHaveURL(url);
  }
}
