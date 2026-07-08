import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/auth/SessionContext";

/** Zweite Verteidigungslinie analog app/(app)/layout.tsx: ohne Session → /login. */
export function RequireAuth() {
  const { profile, loading } = useSession();
  const location = useLocation();

  if (loading) return null;
  if (!profile) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}
