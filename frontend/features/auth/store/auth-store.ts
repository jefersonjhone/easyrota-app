import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { AuthUser } from "../types/auth"


type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null

  setAuth: (
    accessToken: string,
    refreshToken: string | null,
    user: AuthUser
  ) => void
  setAccessToken: (accessToken: string) => void
  setTokens: (accessToken: string, refreshToken?: string) => void
  clearAuth: () => void
}

export const useAuthStore =
  create<AuthState>()(
    persist(
      (set) => ({
        accessToken: null,
        refreshToken: null,
        user: null,

        setAuth: (accessToken, refreshToken, user) =>
          set({
            accessToken,
            refreshToken,
            user,
          }),

        setAccessToken: (accessToken: string) =>
          set((state) => ({
            ...state,
            accessToken,
          })),

        setTokens: (accessToken: string, refreshToken?: string) =>
          set((state) => ({
            ...state,
            accessToken,
            ...(refreshToken ? { refreshToken } : {}),
          })),

        clearAuth: () =>
          set({
            accessToken: null,
            refreshToken: null,
            user: null,
          }),
      }),
      {
        name: "auth-storage",

        storage: createJSONStorage(
          () => localStorage
        ),
      }
    )
  )
