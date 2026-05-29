
import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { requireAuth } from './require-auth'
import type { AuthUser } from '../types/auth'

type ProfileType = AuthUser['profile_type']

export function requireProfile(allowedProfiles: ProfileType[]) {
  requireAuth()

  const user = useAuthStore.getState().user

  if (!user || !allowedProfiles.includes(user.profile_type)) {
    /*USUARIO ANIQUILADO */
    throw redirect({ to: '/app' })
  }
}