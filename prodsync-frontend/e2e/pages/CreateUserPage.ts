import { type Page, type Locator, expect } from '@playwright/test';

export class CreateUserPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly statusSelect: Locator;
  readonly createUserButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'New User' });
    this.nameInput = page.getByLabel('Name', { exact: true });
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirmPassword');
    this.emailInput = page.getByLabel('Email');
    this.roleSelect = page.getByLabel('Role');
    this.statusSelect = page.getByLabel('Status');
    this.createUserButton = page.getByRole('button', { name: 'Create User' });
  }

  async goto() {
    await this.page.goto('/users/create');
  }

  async createUser(name: string, username: string, email: string, password: string, role: string, status: string) {
    await this.nameInput.fill(name);
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.roleSelect.selectOption(role);
    await this.statusSelect.selectOption(status);
    await Promise.all([
      this.page.waitForURL('/users'), 
      this.createUserButton.click(),
    ]);
  }

  async expectErrorMessage(message: string) {
    await this.page.screenshot({ path: 'e2e/test-results/create-user-form-error-diagnosis.png' }); 
    await expect(this.page.getByText(message)).toBeVisible();
  }
}