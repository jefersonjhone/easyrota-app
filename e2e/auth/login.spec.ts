import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/login'
import { loginCredentials } from '../utils/auth'

test.describe('Login Page', () => {

  test('Can login as servant with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await loginPage.email.fill(loginCredentials.civilServant.email)
    await loginPage.password.fill(loginCredentials.civilServant.password)
    await loginPage.submitButton.click()
  
    await expect(page).toHaveURL('/app')
  })

  test('Can login as student with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await loginPage.email.fill(loginCredentials.student.email)
    await loginPage.password.fill(loginCredentials.student.password)
    await loginPage.submitButton.click()
  
    await expect(page).toHaveURL('/app')
  })

  test('Can go to Signup page', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await expect(loginPage.createAccountButton).toBeVisible()
    await loginPage.createAccountButton.click()
    await expect(page).toHaveURL('/signup')
  })

  test('Has all fields visible', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await expect(loginPage.email).toBeVisible()
    await expect(loginPage.password).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
  })

  test('Can go to Recovery Page', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await expect(loginPage.forgotPasswordButton).toBeVisible()
    await loginPage.forgotPasswordButton.click()
    await expect(page).toHaveURL('/recuperar')
  })

})
