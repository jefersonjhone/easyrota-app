import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

async function changePasswordRequest(payload: ChangePasswordPayload) {
  return await apiFetch("/auth/change-password/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: changePasswordRequest,
  });
}
