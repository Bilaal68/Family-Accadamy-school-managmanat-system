import { useAuth } from "./useAuth";

export function useRole(expectedRole) {
  const { user } = useAuth();
  return user?.role === expectedRole;
}
