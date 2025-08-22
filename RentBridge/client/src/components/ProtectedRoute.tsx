import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - rendering with user:', user, 'loading:', loading);
  console.log('ProtectedRoute - current location:', window.location.pathname);

  if (loading) {
    console.log('ProtectedRoute - still loading, showing loading state');
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('ProtectedRoute - no user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute - user authenticated, rendering protected content');
  return <>{children}</>;
}