import { useAuthStore } from "../store/auth-store";

export const useAuthUser = () => {
  const { user } = useAuthStore();
  if (!user) {
    throw new Error("useAuthUser must be used within an AuthUserProvider");
  }
  return user;
};