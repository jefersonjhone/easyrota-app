import type { Locator, Page } from '@playwright/test'

export class LoginPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/login')
    await this.page.waitForURL('/login')
  }

  get email(): Locator {
    return this.page.getByRole('textbox', { name: 'Email Institucional' })
  }

  get password(): Locator {
    return this.page.getByRole('textbox', { name: 'Senha' })
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Entrar' })
  }

  get forgotPasswordButton(): Locator {
    return this.page.getByRole('button', { name: 'Esqueceu sua senha?' })
  }

  get createAccountButton(): Locator {
    return this.page.getByRole('button', { name: 'Criar Conta' })
  }
}