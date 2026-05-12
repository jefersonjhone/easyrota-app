// its must be migrated to zod validation


export type AuthUser = {
  id: number
  email: string
  full_name: string
  profile_type: string
}
  
export type LoginPayload = {
  email: string
  password: string
}

export type LoginSuccessResponse = {
  access_token: string
  user: AuthUser
}

export type LoginMFAResponse = {
  requires_2fa: true
  challenge_token: string
  message: string
}

export type LoginResponse =
  | LoginSuccessResponse
  | LoginMFAResponse