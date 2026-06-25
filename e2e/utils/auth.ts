import { expect, Page } from '@playwright/test'
import { SignupPage } from '../pages/signup'

export const unique = () => `${Date.now()}.${Math.random().toString(36).slice(2)}`
export const uniqueRegistration = () => `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`.slice(-8)
export const uniqueEmail = () => `john.doe+${unique()}@discente.uefs.br`
export const uniqueStudentEmail = () => `${uniqueRegistration()}@discente.uefs.br`
export const civilServantName = 'Professor da Silva Santos'
export const civilServantRegistration = '87654321'

export const signupAsCivilServant = async (page: Page, password: string) => {
  const email = uniqueEmail()

  const signupPage = new SignupPage(page)
  await signupPage.goto()
  await signupPage.asCivilServant()

  await signupPage.email.fill(email)
  await signupPage.fullName.fill(civilServantName)
  await signupPage.registration.fill(civilServantRegistration)
  await signupPage.password.fill(password)
  await signupPage.confirmPassword.fill(password)
  await signupPage.submitButton.click()
  await expect(page).toHaveURL('/app/login')

  return { email, password }
}

export const signupAsStudent = async (
  page: Page, 
  password: string
): Promise<{ email: string, password: string }> => {
  const email = uniqueStudentEmail()

  const signupPage = new SignupPage(page)
  await signupPage.goto()
  await signupPage.asStudent()

  await signupPage.email.fill(email)
  await signupPage.fullName.fill('Estudante da Silva Santos')
  await signupPage.registration.fill(uniqueRegistration())
  await signupPage.password.fill(password)
  await signupPage.confirmPassword.fill(password)
  await signupPage.submitButton.click()
  await expect(page).toHaveURL('/app/login')

  return { email, password }
}
