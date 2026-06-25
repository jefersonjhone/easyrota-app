import { test, expect } from '@playwright/test'
import {
  civilServantName,
  civilServantRegistration,
  uniqueEmail,
  uniqueStudentEmail,
  uniqueRegistration,
} from '../utils/auth'
import { SignupPage } from '../pages/signup'

test.describe('Signup Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/signup')
  })

  test('Can create a new account as Professor', async ({ page }) => {
    const signupPage = new SignupPage(page)

    await signupPage.asCivilServant()

    await signupPage.email.fill(uniqueStudentEmail())
    await signupPage.fullName.fill(civilServantName)
    await signupPage.registration.fill(civilServantRegistration)
    await signupPage.password.fill('12345678')
    await signupPage.confirmPassword.fill('12345678')
    await signupPage.submitButton.click()

    await expect(page).toHaveURL('/app/login')
  })

  test('Can create a new account as Student', async ({ page }) => {
    const signupPage = new SignupPage(page)

    await signupPage.asStudent()

    await signupPage.email.fill(uniqueEmail())
    await signupPage.fullName.fill('Estudante da Silva Santos')
    await signupPage.registration.fill(uniqueRegistration())
    await signupPage.password.fill('12345678')
    await signupPage.confirmPassword.fill('12345678')
    await signupPage.submitButton.click()

    await expect(page).toHaveURL('/app/login')
  })

  test('Can go to Login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: 'Entrar' })
    
    await expect(loginLink).toBeVisible()
    await loginLink.click()

    await expect(page).toHaveURL('/app/login')
  })

  test('Has all fields visible for Civil Servant', async ({ page }) => {
    const signupPage = new SignupPage(page)

    await signupPage.asCivilServant()

    await expect(signupPage.email).toBeVisible()
    await expect(signupPage.fullName).toBeVisible()
    await expect(signupPage.registration).toBeVisible()
    await expect(signupPage.password).toBeVisible()
    await expect(signupPage.confirmPassword).toBeVisible()
    await expect(signupPage.submitButton).toBeVisible()
  })

  test('Has all fields visible for Student', async ({ page }) => {
    const signupPage = new SignupPage(page)

    await signupPage.asStudent()

    await expect(signupPage.email).toBeVisible()
    await expect(signupPage.fullName).toBeVisible()
    await expect(signupPage.registration).toBeVisible()
    await expect(signupPage.password).toBeVisible()
    await expect(signupPage.confirmPassword).toBeVisible()
    await expect(signupPage.submitButton).toBeVisible()
  })

  test('Default tab is Civil Servant', async ({ page }) => {
    const civilServantTab = page.getByRole('tab', { name: 'Servidor Público' })
    const studentTab = page.getByRole('tab', { name: 'Estudante' })

    await expect(civilServantTab).toHaveAttribute('aria-selected', 'true')
    await expect(studentTab).toHaveAttribute('aria-selected', 'false')
  })

})
