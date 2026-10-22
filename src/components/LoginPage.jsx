import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BusFront, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#101d39] px-14 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-40 -top-32 h-[540px] w-[540px] rounded-full border border-white/10" />
        <div className="absolute -right-20 -top-12 h-[300px] w-[300px] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600">
            <BusFront size={23} />
          </span>
          <span className="text-sm font-bold tracking-[0.16em]">PSG TRANSPORT</span>
        </div>
        <div className="relative max-w-xl pb-8">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Fleet operations, in one place</p>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.12] tracking-tight xl:text-6xl">
            Keep your fleet moving.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            A clear view of your vehicles, your people, and the day ahead.
          </p>
          <div className="mt-12 flex gap-2">
            <span className="h-1.5 w-8 rounded-full bg-blue-500" />
            <span className="h-1.5 w-2 rounded-full bg-white/30" />
            <span className="h-1.5 w-2 rounded-full bg-white/30" />
          </div>
        </div>
        <p className="relative text-xs text-slate-400">PSG Transport Management · Secure staff access</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white">
              <BusFront size={21} />
            </span>
            <span className="text-sm font-bold tracking-[0.14em] text-slate-800">PSG TRANSPORT</span>
          </div>
          <p className="text-sm font-semibold text-blue-700">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Sign in to your account</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Enter your work credentials to access the fleet dashboard.</p>

          <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Work email</span>
              <span className="relative block">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <span className="relative block">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            Need access? Contact your transport administrator.
          </p>
        </div>
      </section>
    </main>
  )
}
