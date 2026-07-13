import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle, AlertCircle, Download } from 'lucide-react'
import { usersApi, certificatesApi, authApi } from '@/api/services'
import { useAuthStore } from '@/store/authStore'
import { extractError } from '@/api/client'
import { Button, Badge, EmptyState, Skeleton } from '@/components/ui'
import { cn, formatDate, initials } from '@/utils'

// ── Profile ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  student_id: z.string().optional(),
  level: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? '',
      phone: user?.phone ?? '',
      student_id: user?.student_id ?? '',
      level: user?.level ? String(user.level) : '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      usersApi.updateProfile({
        ...data,
        level: data.level ? parseInt(data.level) : undefined,
      }),
    onSuccess: (updated) => {
      setUser(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  if (!user) return null

  return (
    <div className="section-container py-12 max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-green-700 mb-8">My Profile</h1>

      {/* Avatar */}
      <div className="card p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:"linear-gradient(90deg,#A8D5BA,#00B140)"}}>
          <span className="text-xl font-bold text-white">{initials(user.full_name)}</span>
        </div>
        <div>
          <p className="font-700 text-lg text-[#1B3D22]">{user.full_name}</p>
          <p className="text-sm text-muted">{user.email}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="green" className="capitalize">{user.role}</Badge>
            {user.email_verified
              ? <Badge variant="green">✓ Verified</Badge>
              : <Badge variant="red">Email Unverified</Badge>}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card p-8">
        <h2 className="font-body font-700 text-[#1B3D22] mb-6">Edit Profile</h2>

        {mutation.error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {extractError(mutation.error)}
          </div>
        )}
        {saved && (
          <div className="mb-4 flex items-center gap-2 bg-green-gradient text-white border border-green-700 rounded-xl p-3.5 text-sm font-500">
            <CheckCircle className="h-4 w-4" />
            Profile updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="form-label">Full Name</label>
            <input {...register('full_name')} className={cn('form-input', errors.full_name && 'form-input-error')} />
            {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <input value={user.email} disabled className="form-input opacity-60 cursor-not-allowed" />
            <p className="form-error text-muted">Email cannot be changed.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Phone</label>
              <input {...register('phone')} className="form-input" placeholder="+233 XX XXX XXXX" />
            </div>
            <div>
              <label className="form-label">Student ID</label>
              <input {...register('student_id')} className="form-input" placeholder="UDS/PHARM/…" />
            </div>
          </div>
          <div>
            <label className="form-label">Level</label>
            <select {...register('level')} className="form-select">
              <option value="">Select…</option>
              {[100,200,300,400,500,600].map((l) => <option key={l} value={l}>Level {l}</option>)}
            </select>
          </div>
          <Button type="submit" variant="primary" size="md" loading={mutation.isPending}>
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  )
}

// ── Certificates ──────────────────────────────────────────────────────────────

export function CertificatesPage() {
  const { isAuthenticated } = useAuthStore()
  const { data: certs, isLoading } = useQuery({
    queryKey: ['certificates', 'mine'],
    queryFn: certificatesApi.mine,
    enabled: isAuthenticated,
  })

  if (!isAuthenticated) {
    return (
      <div className="section-container py-20 text-center">
        <EmptyState icon="🏅" title="Sign in to view your certificates" />
      </div>
    )
  }

  return (
    <div className="section-container py-12 max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-green-700 mb-8">My Certificates</h1>

      {isLoading ? (
        <div className="space-y-4">{[1,2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : !certs?.length ? (
        <EmptyState icon="🏅" title="No certificates yet"
          description="Attend events and receive certificates of participation." />
      ) : (
        <div className="space-y-4">
          {certs.map((cert) => (
            <div key={cert.id} className="card p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gold-100 flex items-center justify-center text-2xl flex-shrink-0">🏅</div>
              <div className="flex-1">
                <p className="font-700 text-[#1B3D22]">Certificate of Participation</p>
                <p className="text-sm text-muted">Issued {formatDate(cert.issued_at)}</p>
                <p className="text-xs text-muted font-mono mt-0.5">{cert.verification_code}</p>
              </div>
              {cert.download_url && (
                <a href={cert.download_url} download
                  className="btn-sm btn-outline flex items-center gap-1.5 flex-shrink-0">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Certificate Verify (public) ───────────────────────────────────────────────

export function CertificateVerifyPage() {
  const [code, setCode] = useState('')
  const [queried, setQueried] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['certificate-verify', code],
    queryFn: () => certificatesApi.verify(code),
    enabled: false,
  })

  const handleVerify = () => {
    if (code.trim()) { setQueried(true); refetch() }
  }

  return (
    <div className="section-container py-16 max-w-lg text-center">
      <span className="text-5xl mb-5 block">🏅</span>
      <h1 className="font-display text-3xl font-bold text-green-700 mb-3">Verify Certificate</h1>
      <p className="text-muted mb-8">Enter a certificate verification code to confirm its authenticity.</p>

      <div className="flex gap-3 mb-6">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="GPSA-2025-MYC-X3K9"
          className="form-input font-mono text-center tracking-widest flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
        />
        <Button variant="primary" size="md" loading={isLoading} onClick={handleVerify}>Verify</Button>
      </div>

      {queried && data && (
        <div className={cn('card p-8 text-left', data.is_valid ? 'bg-green-gradient text-white border-green-700' : 'bg-red-50 border-red-200')}>
          {data.is_valid ? (
            <>
              <CheckCircle className="h-8 w-8 text-white mb-4" />
              <h3 className="font-body font-700 text-white text-lg mb-3">✓ Certificate is Valid</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-700">Recipient:</span> {data.recipient_name}</p>
                <p><span className="font-700">Event:</span> {data.event_title}</p>
                <p><span className="font-700">Issued:</span> {formatDate(data.issued_at)}</p>
                <p><span className="font-700">Code:</span> <span className="font-mono">{data.verification_code}</span></p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
              <h3 className="font-body font-700 text-red-700 text-lg">Certificate Not Found</h3>
              <p className="text-sm text-red-600 mt-2">No valid certificate found for that code.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Settings ──────────────────────────────────────────────────────────────────

const pwSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
}).refine((d) => d.current_password !== d.new_password, {
  message: 'New password must be different',
  path: ['new_password'],
})
type PwForm = z.infer<typeof pwSchema>

export function SettingsPage() {
  const [pwDone, setPwDone] = useState(false)
  const { logout } = useAuthStore()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  })

  const pwMutation = useMutation({
    mutationFn: (d: PwForm) => authApi.changePassword(d.current_password, d.new_password),
    onSuccess: () => { setPwDone(true); reset(); setTimeout(() => setPwDone(false), 4000) },
  })

  const logoutAllMutation = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: logout,
  })

  return (
    <div className="section-container py-12 max-w-xl space-y-8">
      <h1 className="font-display text-3xl font-bold text-green-700">Settings</h1>

      {/* Change password */}
      <div className="card p-8">
        <h2 className="font-body font-700 text-[#1B3D22] text-lg mb-5">Change Password</h2>
        {pwDone && (
          <div className="mb-4 flex items-center gap-2 bg-green-gradient text-white border border-green-700 rounded-xl p-3.5 text-sm font-500">
            <CheckCircle className="h-4 w-4" /> Password changed. Please sign in again.
          </div>
        )}
        {pwMutation.error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {extractError(pwMutation.error)}
          </div>
        )}
        <form onSubmit={handleSubmit((d) => pwMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="form-label">Current Password</label>
            <input {...register('current_password')} type="password" className={cn('form-input', errors.current_password && 'form-input-error')} />
          </div>
          <div>
            <label className="form-label">New Password</label>
            <input {...register('new_password')} type="password" className={cn('form-input', errors.new_password && 'form-input-error')} />
            {errors.new_password && <p className="form-error">{errors.new_password.message}</p>}
          </div>
          <Button type="submit" variant="primary" size="md" loading={pwMutation.isPending}>Update Password</Button>
        </form>
      </div>

      {/* Security */}
      <div className="card p-8">
        <h2 className="font-body font-700 text-[#1B3D22] text-lg mb-2">Active Sessions</h2>
        <p className="text-sm text-muted mb-5">Sign out from all other devices for security.</p>
        <Button
          variant="destructive" size="md"
          loading={logoutAllMutation.isPending}
          onClick={() => logoutAllMutation.mutate()}
        >
          Sign Out All Devices
        </Button>
      </div>
    </div>
  )
}