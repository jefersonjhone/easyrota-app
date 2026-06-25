import type { Locator, Page } from '@playwright/test';

export class SignupPage {
  constructor(readonly page: Page) {}

  async asStudent() {
    await this.page.getByRole('tab', { name: 'Estudante' }).click();
  }

  async asCivilServant() {
    await this.page.getByRole('tab', { name: 'Servidor Público' }).click();
  }

  async goto() {
    await this.page.goto('/signup')
    await this.page.waitForURL('/signup')
  }

  get email(): Locator {
    return this.page.getByRole('textbox', { name: 'Email Institucional' })
  }

  get fullName(): Locator {
    return this.page.getByRole('textbox', { name: 'Nome Completo' })
  }

  get registration(): Locator {
    return this.page.getByRole('textbox', { name: 'Matrícula' })
  }

  get password(): Locator {
    return this.page.getByRole('textbox', { name: 'Senha', exact: true })
  }

  get confirmPassword(): Locator {
    return this.page.getByRole('textbox', { name: 'Confirmar Senha' })
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Criar Conta' })
  }
}