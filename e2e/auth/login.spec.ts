import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/login'
import { signupAsCivilServant, signupAsStudent } from '../utils/auth'

test.describe('Login Page', () => {

  test('Can login as servant with valid credentials', async ({ page }) => {
    const credentials = await signupAsCivilServant(page, '12345678')
    const loginPage = new LoginPage(page)

    await loginPage.email.fill(credentials.email)
    await loginPage.password.fill(credentials.password)
    await loginPage.submitButton.click()
  
    await expect(page).toHaveURL('/app')
  })

  test('Can login as student with valid credentials', async ({ page }) => {
    const credentials = await signupAsStudent(page, '12345678')
    const loginPage = new LoginPage(page)

    await loginPage.email.fill(credentials.email)
    await loginPage.password.fill(credentials.password)
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