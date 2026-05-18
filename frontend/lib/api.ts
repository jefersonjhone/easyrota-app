import { isTokenExpired } from "@/features/auth/services/decode-token"
import { refreshSession } from "@/features/auth/services/refresh-session"
import { useAuthStore } from "@/features/auth/store/auth-store"

type ApiFetchOptions = RequestInit & {
  auth?: boolean,
  _retry?: boolean
}

let refreshPromise: Promise<void> | null = null

async function handleRefresh(): Promise<void> {
  try {
    const data = await refreshSession()

    useAuthStore.getState().setAuth(
      data.tokens?.access,
      data.user,
    )
  } catch (error) {
    useAuthStore.getState().clearAuth()
    throw error
  }
}

export async function refreshTokenIfNeeded(): Promise<void> {
  if (refreshPromise) {
    await refreshPromise;
    return;
  }

  refreshPromise = handleRefresh();
  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}


export async function apiFetch<T>(
  input: RequestInfo | URL,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token && isTokenExpired(token) && !refreshPromise) {
      try {
        await refreshTokenIfNeeded();
      } catch {
        throw { status: 401, data: null };
      }
    }
  }

  const makeRequest = async () => {
    const accessToken = useAuthStore.getState().accessToken;
    return fetch(`/api${input}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(auth && accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
    },
  });
  }

  const response = await makeRequest();
  if (
    response.status === 401 &&
    auth &&
    !options._retry
  ) {
    try {
      await refreshTokenIfNeeded();
  
      return apiFetch<T>(input, {
        ...options,
        _retry: true,
      });
    } catch {
      useAuthStore.getState().clearAuth();
  
      throw {
        status: 401,
        data: null,
      };
    }
  }
  if (!response.ok) {
    const errorData = await safeJson(response);
    throw { status: response.status, data: errorData };
  }

  return safeJson(response);
}

async function safeJson(response: Response){
  try {
    return await response.json();
  } catch {
    return null;
  }
}
