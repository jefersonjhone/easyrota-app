import { refreshSession } from "@/features/auth/services/refresh-session"
import { useAuthStore } from "@/features/auth/store/auth-store"

type ApiFetchOptions = RequestInit & {
  auth?: boolean
}

let refreshPromise: Promise<void> | null = null

async function handleRefresh(): Promise<void> {
  try {
    const data = await refreshSession()

    useAuthStore.getState().setAuth(
      data.access_token,
      data.user,
    )
  } catch (error) {
    useAuthStore.getState().clearAuth()

    window.location.href = "/login"

    throw error
  }
}

export async function apiFetch<T>(input: RequestInfo | URL, options: ApiFetchOptions = {},): Promise<T> {
  const { auth = true, headers, ...rest } = options
  const accessToken = useAuthStore.getState().accessToken
  const response = await fetch(input, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(auth && accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
    },
  })

  if (response.status !== 401) {
    if (!response.ok) {
      const errorData = await safeJson(response)

      throw {
        status: response.status,
        data: errorData,
      }
    }

    return response.json()
  }

  if (!auth) {
    throw {
      status: 401,
    }
  }

  try {
    if (!refreshPromise) {
      refreshPromise = handleRefresh()
    }

    await refreshPromise
  } finally {
    refreshPromise = null
  }

  const newAccessToken =
    useAuthStore.getState().accessToken

  const retryResponse = await fetch(input, {
    ...rest,

    credentials: "include",

    headers: {
      "Content-Type": "application/json",

      ...headers,

      ...(newAccessToken
        ? {
            Authorization: `Bearer ${newAccessToken}`,
          }
        : {}),
    },
  })

  if (!retryResponse.ok) {
    const errorData = await safeJson(
      retryResponse,
    )

    throw {
      status: retryResponse.status,
      data: errorData,
    }
  }

  return retryResponse.json()
}

async function safeJson(
  response: Response,
) {
  try {
    return await response.json()
  } catch {
    return null
  }
}