import type { Locator, Page } from '@playwright/test';

export class AdminHomePage {
  readonly saudacao: Locator;

  constructor(private readonly page: Page) {
    this.saudacao = page.getByRole('heading', { name: /Bem Vindo/ });
  }

  async abrir(): Promise<void> {
    await this.page.goto('/admin/home');
  }
}
