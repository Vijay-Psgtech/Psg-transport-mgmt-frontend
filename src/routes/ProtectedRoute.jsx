import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// <ProtectedRoute>                      -> any signed-in user
// <ProtectedRoute roles={['admin']}>    -> only those roles (RBAC)
export default function ProtectedRoute({ roles, children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500" role="status">
        Checking your session...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  // A temporary password must be replaced before anything else
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children ?? <Outlet />;
}
