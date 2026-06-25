import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { AuthUser } from "../types/auth"


type AuthState = {
  accessToken: string | null
  user: AuthUser | null

  setAuth: (
    accessToken: string,
    user: AuthUser
  ) => void
  setAccessToken: (accessToken:string) => void
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

        setAccessToken: (accessToken: string) =>
          set((state) => ({
            ...state,
             accessToken 
          })
          ),
            
        clearAuth: () =>
          set({
            accessToken: null,
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
