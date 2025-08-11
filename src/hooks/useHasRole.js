import { useAuth } from "../context/AuthContext";

export default function useHasRole(roles) {
  const { user } = useAuth();
  if (!roles || roles.length === 0) return true; // roles berilmasa hamma ko‘radi
  const userRoles = user?.roles ?? [];
  return roles.some((r) => userRoles.includes(r));
}
