import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Vehicles from './pages/Vehicles';
import VehicleAssignments from './pages/VehicleAssignments';
import DriverTripSheets from './pages/DriverTripSheets';
import VehicleRequests from './pages/VehicleRequests';
import ServiceHistory from './pages/ServiceHistory';
import People from './pages/People';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Unauthorized from './pages/Unauthorized';
import { MANAGER_ROLES, ROLES } from './utils/constants';
import useAutoLogout from './hooks/useAutoLogout';

// The dashboard pulls in the charting library, so load it only when needed
const Dashboard = lazy(() => import('./pages/Dashboard'));

function HomeRoute() {
  const { user } = useAuth();
  if (user.role === ROLES.DRIVER) return <Navigate to="/trip-sheets" replace />;
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-slate-500" role="status">Loading dashboard...</p>}>
      <Dashboard />
    </Suspense>
  );
}

export default function App() {
  useAutoLogout();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomeRoute />} />
        <Route path="trip-sheets" element={<ProtectedRoute roles={[ROLES.DRIVER]}><DriverTripSheets /></ProtectedRoute>} />
        <Route path="profile" element={<Profile />} />
        <Route path="vehicles" element={<ProtectedRoute roles={MANAGER_ROLES}><Vehicles /></ProtectedRoute>} />
        <Route path="vehicle-assignments" element={<ProtectedRoute roles={MANAGER_ROLES}><VehicleAssignments /></ProtectedRoute>} />
        <Route path="vehicle-requests" element={<ProtectedRoute roles={[ROLES.TRANSPORT_USER]}><VehicleRequests /></ProtectedRoute>} />
        <Route path="service-history" element={<ProtectedRoute roles={MANAGER_ROLES}><ServiceHistory /></ProtectedRoute>} />
        <Route path="drivers" element={<ProtectedRoute roles={MANAGER_ROLES}><People driversOnly /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={[ROLES.ADMIN]}><People /></ProtectedRoute>} />
        <Route path="unauthorized" element={<Unauthorized />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
