import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm, Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/services'
import { useAuthStore } from '@/store/authStore'
import { extractError, tokenStorage } from '@/api/client'
import { Button } from '@/components/ui'
import { cn } from '@/utils'

// ── Shared ────────────────────────────────────────────────────────────────────

import gpsaLogo from '@/assets/gpsa-logo.jpg'

function AuthCard({ children, title, subtitle }: {
  children: React.ReactNode; title: string; subtitle?: string
}) {
  return (
    <div className="w-full max-w-md animate-fade-up">
      {/* Logo */}
      <Link to="/" className="flex items-center justify-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-gold-400 shadow-lg">
          <img src={gpsaLogo} alt="GPSA-UDS Logo" className="w-full h-full object-cover" />
        </div>
        <div className="text-white">
          <p className="font-display text-xl font-700 leading-none">GPSA-UDS</p>
          <p className="text-[11px] text-white/70 tracking-widest uppercase">Student Portal</p>
        </div>
      </Link>

      <div className="bg-white rounded-3xl shadow-card-lg p-6">
        <div className="mb-5">
          <h1 className="font-display text-2xl font-bold text-green-700">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

function PasswordInput<T extends Record<string, any>>({
  register, name, placeholder, error, label
}: {
  register: ReturnType<typeof useForm<T>>['register']
  name: Path<T>
  placeholder?: string
  error?: string
  label: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative">
        <input
          {...register(name)}
          type={show ? 'text' : 'password'}
          placeholder={placeholder ?? '••••••••'}
          className={cn('form-input pr-10', error && 'form-input-error')}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-green-700 transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'
  const sessionExpired = (location.state as { sessionExpired?: boolean })?.sessionExpired

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (tokens) => {
      tokenStorage.setAccess(tokens.access_token)
      tokenStorage.setRefresh(tokens.refresh_token)
      const user = await authApi.me()
      login(tokens.access_token, tokens.refresh_token, user)
      navigate(from, { replace: true })
    },
  })

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your GPSA-UDS account">
      {sessionExpired && (
        <div className="mb-4 flex items-center gap-2.5 bg-gold-50 border border-gold-200 rounded-xl p-3 text-sm text-gold-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Your session has expired. Please sign in again.
        </div>
      )}

      {mutation.error && (
        <div className="mb-4 flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {extractError(mutation.error)}
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
        <div>
          <label className="form-label">Email Address</label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@student.uds.edu.gh"
            className={cn('form-input', errors.email && 'form-input-error')}
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <PasswordInput
          register={register}
          name="password"
          label="Password"
          error={errors.password?.message}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-green-700 hover:text-green-600 font-500">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={mutation.isPending}
          className="w-full"
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-green-700 font-600 hover:text-green-600">
          Join GPSA →
        </Link>
      </p>
    </AuthCard>
  )
}

// ── Register ──────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a digit'),
  confirm_password: z.string(),
  phone: z
    .string()
    .regex(/^(?:\+233|0)[2-9]\d{8}$/, 'Enter a valid Ghanaian phone number (e.g. +233 XX XXX XXXX)'),
  student_id: z.string().min(1, 'Student ID is required'),
  level: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ required_error: 'Level is required' }).min(100, 'Level is required').max(600),
  ),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: RegisterForm) =>
      authApi.register({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        student_id: data.student_id,
        level: data.level,
      }),
    onSuccess: () => setSuccess(true),
  })

  if (success) {
    return (
      <AuthCard title="Check your inbox" subtitle="One more step to activate your account">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-gradient rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-green-700" />
          </div>
          <p className="text-sm text-muted leading-relaxed mb-5">
            We've sent a verification link to your email. Click it to activate your account and log in.
          </p>
          <Button variant="primary" size="md" onClick={() => navigate('/login')} className="w-full">
            Back to Sign In
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Join GPSA-UDS" subtitle="Create your student portal account">
      {mutation.error && (
        <div className="mb-4 flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {extractError(mutation.error)}
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
        <div>
          <label className="form-label">Full Name</label>
          <input {...register('full_name')} placeholder="Kwame Asante" className={cn('form-input', errors.full_name && 'form-input-error')} />
          {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="form-label">Email Address</label>
          <input {...register('email')} type="email" placeholder="you@student.uds.edu.gh" className={cn('form-input', errors.email && 'form-input-error')} />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <PasswordInput register={register} name="password" label="Password" error={errors.password?.message} />
        <p className="-mt-1.5 text-[11px] text-muted leading-relaxed">
          At least 8 characters · one uppercase letter · one digit
        </p>

        <PasswordInput register={register} name="confirm_password" label="Confirm Password" error={errors.confirm_password?.message} />

        <div className="grid grid-cols-2 gap-2">
          <div>
          <label className="form-label">Student ID</label>
            <input {...register('student_id')} placeholder="UDS/PHARM/…" className={cn('form-input', errors.student_id && 'form-input-error')} />
            {errors.student_id && <p className="form-error">{errors.student_id.message}</p>}
          </div>
          <div>
          <label className="form-label">Level</label>
            <select {...register('level')} className={cn('form-select', errors.level && 'form-input-error')}>
              <option value="">Select…</option>
              {[100, 200, 300, 400, 500, 600].map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
            {errors.level && <p className="form-error">{errors.level.message}</p>}
          </div>
        </div>

        <div>
          <label className="form-label">Phone</label>
          <input {...register('phone')} placeholder="+233 XX XXX XXXX" className={cn('form-input', errors.phone && 'form-input-error')} />
          {errors.phone && <p className="form-error">{errors.phone.message}</p>}
        </div>

        <Button type="submit" variant="primary" size="lg" loading={mutation.isPending} className="w-full">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-green-700 font-600 hover:text-green-600">
          Sign in →
        </Link>
      </p>
    </AuthCard>
  )
}

// ── Forgot Password ───────────────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().email() })),
  })
  const mutation = useMutation({
    mutationFn: ({ email }: { email: string }) => authApi.forgotPassword(email),
    onSuccess: () => setSent(true),
  })

  return (
    <AuthCard title="Reset password" subtitle="We'll send a reset link to your email">
      {sent ? (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-green-700 mx-auto mb-4" />
          <p className="text-sm text-muted mb-5">
            If that email is registered, a reset link has been sent. Check your inbox.
          </p>
          <Link to="/login" className="text-green-700 font-600 text-sm">Back to Sign In →</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
          <div>
            <label className="form-label">Email Address</label>
            <input {...register('email')} type="email" placeholder="you@student.uds.edu.gh"
              className={cn('form-input', errors.email && 'form-input-error')} />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <Button type="submit" variant="primary" size="lg" loading={mutation.isPending} className="w-full">
            Send Reset Link
          </Button>
          <p className="text-center text-sm">
            <Link to="/login" className="text-green-700 font-500">Back to Sign In</Link>
          </p>
        </form>
      )}
    </AuthCard>
  )
}

// ── Verify Email ──────────────────────────────────────────────────────────────

export function VerifyEmailPage() {
  const searchParams = new URLSearchParams(window.location.search)
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => authApi.verifyEmail(token),
  })

  useEffect(() => {
    if (token) mutation.mutate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthCard title="Verifying email…" subtitle="">
      <div className="text-center py-6">
        {mutation.isPending && <div className="text-4xl animate-pulse-slow mb-4">✉️</div>}
        {mutation.isSuccess && (
          <>
            <CheckCircle className="h-12 w-12 text-green-700 mx-auto mb-4" />
            <p className="text-sm text-muted mb-5">Email verified! You can now sign in.</p>
            <Button variant="primary" size="md" onClick={() => navigate('/login')} className="w-full">
              Sign In
            </Button>
          </>
        )}
        {mutation.isError && (
          <>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-red-600 mb-5">{extractError(mutation.error)}</p>
            <Link to="/login" className="text-green-700 font-600 text-sm">Back to Sign In</Link>
          </>
        )}
      </div>
    </AuthCard>
  )
}
