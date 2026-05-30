import { API_URL } from "@lib/config";


export async function refreshSession() {
  
  const response = await fetch(
    `${API_URL}/auth/refresh`,
    {
      method: "POST",
      credentials: "include",
    }
  )

  if (!response.ok) {
    throw new Error("Refresh failed")
  }

  return response.json()
}