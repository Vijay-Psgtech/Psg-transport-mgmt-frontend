import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';

const Login = lazy(() => import('./pages/Login'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const VehicleAssignments = lazy(() => import('./pages/VehicleAssignments'));
const AssignmentTripSheets = lazy(() => import('./pages/AssignmentTripSheets'));
const DriverTripSheets = lazy(() => import('./pages/DriverTripSheets'));
const DriverTripAdvances = lazy(() => import('./pages/DriverTripAdvances'));
const TripAdvanceApprovals = lazy(() => import('./pages/TripAdvanceApprovals'));
const VehicleRequests = lazy(() => import('./pages/VehicleRequests'));
const ServiceHistory = lazy(() => import('./pages/ServiceHistory'));
const People = lazy(() => import('./pages/People'));
const Profile = lazy(() => import('./pages/Profile'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

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
    <Suspense fallback={<p className="py-10 text-center text-sm text-slate-500" role="status">Loading...</p>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<HomeRoute />} />
          <Route path="trip-sheets" element={<ProtectedRoute roles={[ROLES.DRIVER]}><DriverTripSheets /></ProtectedRoute>} />
          <Route path="trip-advances" element={<ProtectedRoute roles={[ROLES.DRIVER]}><DriverTripAdvances /></ProtectedRoute>} />
          <Route path="trip-advance-approvals" element={<ProtectedRoute roles={[ROLES.TRANSPORT_OFFICER]}><TripAdvanceApprovals /></ProtectedRoute>} />
          <Route path="profile" element={<Profile />} />
          <Route path="vehicles" element={<ProtectedRoute roles={MANAGER_ROLES}><Vehicles /></ProtectedRoute>} />
          <Route path="vehicle-assignments" element={<ProtectedRoute roles={MANAGER_ROLES}><VehicleAssignments /></ProtectedRoute>} />
          <Route path="vehicle-assignments/:id/trip-sheets" element={<ProtectedRoute roles={[...MANAGER_ROLES, ROLES.DRIVER]}><AssignmentTripSheets /></ProtectedRoute>} />
          <Route path="vehicle-requests" element={<ProtectedRoute roles={[ROLES.TRANSPORT_USER]}><VehicleRequests /></ProtectedRoute>} />
          <Route path="service-history" element={<ProtectedRoute roles={MANAGER_ROLES}><ServiceHistory /></ProtectedRoute>} />
          <Route path="drivers" element={<ProtectedRoute roles={MANAGER_ROLES}><People driversOnly /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute roles={[ROLES.ADMIN]}><People /></ProtectedRoute>} />
          <Route path="unauthorized" element={<Unauthorized />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
