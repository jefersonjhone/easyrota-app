import type { Locator, Page } from '@playwright/test'

export class LoginPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/login')
    await this.page.waitForURL('/login')
    await this.email.waitFor({ state: 'visible' })
  }

  get email(): Locator {
    return this.page.getByLabel('Email Institucional')
  }

  get password(): Locator {
    return this.page.getByLabel('Senha', { exact: true })
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
