export async function refreshSession() {

  const response = await fetch(
    `/api/auth/refresh`,
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