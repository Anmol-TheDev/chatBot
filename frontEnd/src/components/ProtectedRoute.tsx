import { Navigate } from 'react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const isAuthenticated = !!localStorage.getItem('adminToken');

  if (requireAuth && !isAuthenticated) {
    // User is not authenticated, redirect to login
    return <Navigate to="/admin/login" replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // User is authenticated but trying to access login page, redirect to dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
