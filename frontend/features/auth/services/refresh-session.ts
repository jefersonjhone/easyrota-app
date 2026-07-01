import { API_URL } from "@lib/config";


export async function refreshSession(refreshToken?: string | null) {
  const body: Record<string, unknown> = {}
  if (refreshToken) {
    body.refresh = refreshToken
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error("Refresh failed")
  }

  return response.json()
}