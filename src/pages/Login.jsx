import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import { inputCls } from '../components/Field';

export default function Login() {
  const { user, initializing, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const institution = import.meta.env.VITE_INSTITUTION_NAME || 'Your Institution';

  const [method, setMethod] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && user) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError(`Enter your ${method === 'phone' ? 'phone number' : 'email'} and password.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(identifier.trim(), password, method);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel: asphalt with a painted centre line */}
      <aside className="relative hidden overflow-hidden bg-asphalt text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="road-line absolute right-12 top-0 h-full w-1.5 opacity-90" aria-hidden="true" />
        <p className="font-display text-xl font-bold">{institution}</p>
        <div className="max-w-md pr-16">
          <h1 className="font-display text-5xl font-bold leading-[1.05]">
            Every bus, route and driver in one place.
          </h1>
          <p className="mt-5 text-slate-300">
            Sign in to manage the fleet, keep vehicle documents current and get students home on time.
          </p>
        </div>
        <p className="text-sm text-slate-400">Transport Management Portal</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm" noValidate>
          <h2 className="font-display text-3xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-slate-600">Sign in with your email or phone number and password.</p>

          {error && (
            <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 rounded-md border border-line p-1" role="group" aria-label="Sign-in method">
              <button
                type="button"
                aria-pressed={method === 'email'}
                onClick={() => { setMethod('email'); setIdentifier(''); setError(''); }}
                className={`rounded px-3 py-2 text-sm font-medium ${method === 'email' ? 'bg-asphalt text-white' : 'text-slate-600 hover:bg-canvas'}`}
              >
                Email
              </button>
              <button
                type="button"
                aria-pressed={method === 'phone'}
                onClick={() => { setMethod('phone'); setIdentifier(''); setError(''); }}
                className={`rounded px-3 py-2 text-sm font-medium ${method === 'phone' ? 'bg-asphalt text-white' : 'text-slate-600 hover:bg-canvas'}`}
              >
                Phone number
              </button>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{method === 'phone' ? 'Phone number' : 'Email'}</span>
              <input
                type={method === 'phone' ? 'tel' : 'email'}
                autoComplete="username"
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={inputCls(false)}
                placeholder={method === 'phone' ? '9876543210' : 'name@institute.edu'}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls(false)} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-sm text-slate-600 hover:text-asphalt focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-md bg-signal px-4 py-2.5 text-sm font-semibold text-asphalt hover:bg-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-asphalt disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="mt-6 text-xs text-slate-500">
            Forgot your password or need an account? Contact the transport office.
          </p>
        </form>
      </main>
    </div>
  );
}
