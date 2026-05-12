import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

type AuthUser = {
  id: number
  email: string
  full_name: string
  profile_type: string
}

type AuthState = {
  accessToken: string | null
  user: AuthUser | null

  setAuth: (
    accessToken: string,
    user: AuthUser
  ) => void

  clearAuth: () => void
}

export const useAuthStore =
  create<AuthState>()(
    persist(
      (set) => ({
        accessToken: null,
        user: null,

        setAuth: (accessToken, user) =>
          set({
            accessToken,
            user,
          }),

        clearAuth: () =>
          set({
            accessToken: null,
            user: null,
          }),
      }),
      {
        name: "auth-storage",

        storage: createJSONStorage(
          () => sessionStorage
        ),
      }
    )
  )