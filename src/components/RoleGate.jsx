import useHasRole from "../hooks/useHasRole";

export default function RoleGate({ roles = [], children, fallback = null }) {
  const ok = useHasRole(roles);
  return ok ? children : fallback;
}
