import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { session, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null; // avoid a login flash while the boot-time `me` check is in flight
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
