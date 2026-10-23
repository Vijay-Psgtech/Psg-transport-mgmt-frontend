import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import People from './pages/People';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Unauthorized from './pages/Unauthorized';
import { MANAGER_ROLES, ROLES } from './utils/constants';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="vehicles" element={<ProtectedRoute roles={MANAGER_ROLES}><Vehicles /></ProtectedRoute>} />
        <Route path="drivers" element={<ProtectedRoute roles={MANAGER_ROLES}><People driversOnly /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={[ROLES.ADMIN]}><People /></ProtectedRoute>} />
        <Route path="unauthorized" element={<Unauthorized />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
