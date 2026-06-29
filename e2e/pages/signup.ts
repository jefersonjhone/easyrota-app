import type { Locator, Page } from '@playwright/test'

export class SignupPage {
  constructor(readonly page: Page) {}

  async asStudent() {
    await this.page.getByRole('tab', { name: 'Estudante' }).click()
  }

  async asCivilServant() {
    await this.page.getByRole('tab', { name: 'Servidor Público' }).click()
  }

  async goto() {
    await this.page.goto('/signup')
    await this.page.waitForURL('/signup')
    await this.email.waitFor({ state: 'visible' })
  }

  get email(): Locator {
    return this.page.getByLabel('Email Institucional')
  }

  get fullName(): Locator {
    return this.page.getByLabel('Nome Completo')
  }

  get registration(): Locator {
    return this.page.getByLabel('Matrícula')
  }

  get password(): Locator {
    return this.page.getByLabel('Senha', { exact: true })
  }

  get confirmPassword(): Locator {
    return this.page.getByLabel('Confirmar Senha', { exact: true })
  }

  get legalConsent(): Locator {
    return this.page.getByRole('checkbox', { name: /Li e aceito os/ })
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Criar Conta' })
  }
}
