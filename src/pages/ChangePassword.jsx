import { useNavigate } from 'react-router-dom';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { useAuth } from '../context/AuthContext';

// Shown full-screen when an account still has a temporary password
export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-bold">Choose a new password</h1>
        <p className="mt-1 mb-6 text-sm text-slate-600">
          {user.name}, your account uses a temporary password. Set your own to continue.
        </p>
        <ChangePasswordForm onDone={() => navigate('/', { replace: true })} />
        <button onClick={logout} className="mt-6 text-sm text-slate-600 underline underline-offset-4 hover:text-asphalt">Sign out instead</button>
      </div>
    </div>
  );
}
