import { FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight, Award, BookOpen, BriefcaseBusiness, CalendarDays,
  ChevronRight, HeartHandshake, Mail, MessageSquareText, Phone, Plus, Scale,
  ShieldCheck, Upload, UserRound, UsersRound,
} from 'lucide-react'
import { leadershipApi } from '@/api/services'
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { cn, formatDate } from '@/utils'
import type { Leader, LeadershipTerm } from '@/types'

const fallbackTerm: LeadershipTerm = {
  id: 'fallback-current',
  title: 'Current GPSA-UDS Administration',
  academic_year: 'Current',
  start_date: null,
  end_date: null,
  theme: 'Service, accountability, and student-centred leadership',
  summary: 'Leadership records will appear here after executives upload officer names, offices, and photos.',
  is_current: true,
  sort_order: 0,
  created_at: new Date().toISOString(),
  leaders: [
    { id: 'president', term_id: 'fallback-current', full_name: 'President', office: 'President', bio: 'Strategic representation and executive coordination.', email: null, phone: null, photo_url: null, sort_order: 1, is_active: true, created_at: new Date().toISOString() },
    { id: 'vice', term_id: 'fallback-current', full_name: 'Vice President', office: 'Vice President', bio: 'Committee supervision and program follow-up.', email: null, phone: null, photo_url: null, sort_order: 2, is_active: true, created_at: new Date().toISOString() },
    { id: 'secretary', term_id: 'fallback-current', full_name: 'General Secretary', office: 'General Secretary', bio: 'Records, official communication, and administrative continuity.', email: null, phone: null, photo_url: null, sort_order: 3, is_active: true, created_at: new Date().toISOString() },
    { id: 'finance', term_id: 'fallback-current', full_name: 'Financial Secretary', office: 'Financial Secretary', bio: 'Budget tracking, dues, and transparent financial reporting.', email: null, phone: null, photo_url: null, sort_order: 4, is_active: true, created_at: new Date().toISOString() },
  ],
}

const councilUnits = [
  { title: 'Executive Council', description: 'Sets priorities, coordinates portfolios, and represents pharmacy students in official conversations.', icon: ShieldCheck, members: 'Elected executives' },
  { title: 'Portfolio Committees', description: 'Turn executive priorities into practical work across academics, welfare, events, opportunities, and media.', icon: BriefcaseBusiness, members: 'Committee leads' },
  { title: 'Class Representatives', description: 'Bring level-specific concerns into leadership meetings and help students understand decisions quickly.', icon: UsersRound, members: 'Level reps' },
  { title: 'General Assembly', description: 'Keeps leadership accountable through participation, feedback, voting, and collective student voice.', icon: Scale, members: 'All members' },
]

type TermForm = {
  title: string
  academic_year: string
  start_date: string
  end_date: string
  theme: string
  summary: string
  is_current: boolean
}

type LeaderForm = {
  term_id: string
  full_name: string
  office: string
  bio: string
  email: string
  phone: string
  sort_order: number
}

export function LeadershipPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canManage = user?.role === 'admin' || user?.role === 'exec'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leadership', 'terms'],
    queryFn: () => leadershipApi.list({ include_inactive: canManage, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  const terms = data?.length ? data : [fallbackTerm]
  const currentTerm = useMemo(() => terms.find((term) => term.is_current) ?? terms[0], [terms])
  const pastTerms = terms.filter((term) => term.id !== currentTerm.id)
  const totalLeaders = terms.reduce((sum, term) => sum + term.leaders.length, 0)

  return (
    <>
      <HeroSection currentTerm={currentTerm} totalTerms={terms.length} totalLeaders={totalLeaders} isLoading={isLoading} />
      <CurrentLeadership term={currentTerm} isLoading={isLoading} isError={isError} />
      <HistorySection terms={pastTerms} />
      {canManage && <LeadershipManager terms={data ?? []} />}
      <ContactCta onWelfare={() => navigate('/welfare')} onAcademics={() => navigate('/academics')} />
    </>
  )
}

function HeroSection({
  currentTerm,
  totalTerms,
  totalLeaders,
  isLoading,
}: {
  currentTerm: LeadershipTerm
  totalTerms: number
  totalLeaders: number
  isLoading: boolean
}) {
  return (
    <section className="bg-white">
      <div className="section-container py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-center">
          <div>
            <nav className="flex items-center gap-2 text-xs font-700 uppercase tracking-wide text-muted mb-6">
              <Link to="/" className="hover:text-green-700">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-green-700">Leadership</span>
            </nav>
            <Badge variant="gold" className="mb-5">GPSA-UDS Leadership</Badge>
            <h1 className="font-display font-bold text-deep leading-[1.03] text-balance mb-5" style={{ fontSize: 'clamp(3rem, 6vw, 5.7rem)' }}>
              Clear leadership, preserved across every administration.
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mb-8">
              View current executives, understand the leadership structure, and browse the historical record of officers who have served the association.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="primary" size="lg" onClick={() => document.getElementById('current-leadership')?.scrollIntoView({ behavior: 'smooth' })} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Meet Current Leaders
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('leadership-history')?.scrollIntoView({ behavior: 'smooth' })}>
                View History
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-cream-dark bg-cream-dark p-4 sm:p-5">
            <div className="rounded-xl bg-white border border-cream-dark p-5 sm:p-6 shadow-card">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-700 uppercase tracking-widest text-muted mb-1">Current term</p>
                  {isLoading ? <Skeleton className="h-9 w-52" /> : <h2 className="font-display text-3xl font-bold text-deep">{currentTerm.academic_year}</h2>}
                </div>
                <div className="h-12 w-12 rounded-xl bg-brand flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-5">{currentTerm.theme ?? currentTerm.summary ?? 'A living record of GPSA-UDS leadership service.'}</p>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Terms" value={totalTerms} />
                <Metric label="Leaders" value={totalLeaders} />
                <Metric label="Current" value={currentTerm.leaders.length} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-cream-dark p-3 text-center">
      <p className="font-display text-3xl font-bold text-deep leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-700 uppercase tracking-widest text-muted">{label}</p>
    </div>
  )
}

function CurrentLeadership({ term, isLoading, isError }: { term: LeadershipTerm; isLoading: boolean; isError: boolean }) {
  return (
    <section id="current-leadership" className="section-padding">
      <div className="section-container">
        <div className="max-w-3xl mb-9">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <p className="text-xs font-700 uppercase tracking-widest text-green-700">Current Executive Council</p>
            {isError && <Badge variant="orange">Showing saved fallback</Badge>}
          </div>
          <h2 className="section-title">{term.title}</h2>
          <p className="section-sub">
            {term.summary || 'Officers are grouped by administration so students can see both the current leadership and the association history.'}
          </p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-xl" />)}
          </div>
        ) : term.leaders.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {term.leaders.map((leader) => <LeaderCard key={leader.id} leader={leader} primary />)}
          </div>
        ) : (
          <EmptyState title="No leaders uploaded yet" description="Executive officers can add names, offices, and photos from the management panel." />
        )}
      </div>
    </section>
  )
}

function LeaderCard({ leader, primary = false }: { leader: Leader; primary?: boolean }) {
  return (
    <article className={cn('rounded-xl border border-cream-dark bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-md', !leader.is_active && 'opacity-70')}>
      <div className="aspect-[4/5] rounded-xl overflow-hidden bg-cream-dark mb-5">
        {leader.photo_url ? (
          <img src={leader.photo_url} alt={leader.full_name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-6">
            <UserRound className="h-12 w-12 text-green-700/45 mb-3" />
            <p className="text-sm font-700 text-green-800">{leader.office}</p>
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 mb-3">
        <Badge variant={primary ? 'green' : 'gray'}>{leader.office}</Badge>
        {!leader.is_active && <Badge variant="orange">Inactive</Badge>}
      </div>
      <h3 className="font-display text-2xl font-bold text-deep leading-tight mb-2">{leader.full_name}</h3>
      {leader.bio && <p className="text-sm text-muted leading-relaxed mb-4">{leader.bio}</p>}
      <div className="space-y-2">
        {leader.email && <ContactLink icon={Mail} href={`mailto:${leader.email}`} label={leader.email} />}
        {leader.phone && <ContactLink icon={Phone} href={`tel:${leader.phone}`} label={leader.phone} />}
      </div>
    </article>
  )
}

function ContactLink({ icon: Icon, href, label }: { icon: typeof Mail; href: string; label: string }) {
  return (
    <a href={href} className="flex items-center gap-2 text-sm font-600 text-green-800 hover:text-green-600 break-all">
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </a>
  )
}

function HistorySection({ terms }: { terms: LeadershipTerm[] }) {
  const archivedLeaders = terms.reduce((sum, term) => sum + term.leaders.length, 0)

  return (
    <section id="leadership-history" className="section-padding bg-cream-dark">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-[0.72fr_1fr] gap-10 lg:gap-14 items-start">
          <div>
            <p className="text-xs font-700 uppercase tracking-widest text-green-700 mb-3">Leadership archive</p>
            <h2 className="section-title">A living record of service</h2>
            <p className="section-sub">
              Preserve each administration with officers, offices, dates, photos, and responsibilities so students can understand the association's continuity.
            </p>

            <div className="mt-8 rounded-xl border border-cream-dark bg-white p-5 shadow-card">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <ArchiveMetric label="Archived terms" value={terms.length} />
                <ArchiveMetric label="Archived leaders" value={archivedLeaders} />
              </div>
              <div className="space-y-3">
                {councilUnits.map((unit) => {
                const Icon = unit.icon
                return (
                  <div key={unit.title} className="flex gap-3 rounded-xl border border-cream-dark bg-cream-dark p-4">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-700 text-deep">{unit.title}</h3>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-800 uppercase tracking-wide text-muted">{unit.members}</span>
                      </div>
                      <p className="text-sm text-muted leading-relaxed">{unit.description}</p>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-cream-dark bg-white p-4 sm:p-5 shadow-card">
            <div className="flex items-center justify-between gap-4 border-b border-cream-dark pb-4 mb-4">
              <div>
                <h3 className="font-display text-3xl font-bold text-deep">Administration timeline</h3>
                <p className="text-sm text-muted mt-1">Past terms appear in chronological archive order.</p>
              </div>
              <CalendarDays className="h-6 w-6 text-green-700 shrink-0" />
            </div>
            {terms.length ? (
              <div className="space-y-3">
                {terms.map((term) => <TermArchiveCard key={term.id} term={term} />)}
              </div>
            ) : (
              <div className="rounded-xl bg-cream-dark p-8 text-center">
                <div className="h-14 w-14 rounded-xl bg-white flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="h-7 w-7 text-green-700" />
                </div>
                <h3 className="font-display text-3xl font-bold text-deep mb-2">No past administrations yet</h3>
                <p className="text-sm text-muted max-w-md mx-auto">
                  Once older terms are uploaded, this area will become the association's permanent leadership archive.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function ArchiveMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-cream-dark p-4">
      <p className="font-display text-4xl font-bold text-deep leading-none">{value}</p>
      <p className="mt-2 text-[10px] font-800 uppercase tracking-widest text-muted">{label}</p>
    </div>
  )
}

function TermArchiveCard({ term }: { term: LeadershipTerm }) {
  const preview = term.leaders.slice(0, 5)
  return (
    <article className="rounded-xl border border-cream-dark bg-white p-4 transition-all hover:border-green-200 hover:shadow-card">
      <div className="flex gap-4">
        <div className="hidden sm:flex h-11 w-11 rounded-xl bg-green-100 items-center justify-center shrink-0">
          <Award className="h-5 w-5 text-green-700" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div>
              <Badge variant={term.is_current ? 'green' : 'gold'} className="mb-3">{term.academic_year}</Badge>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-deep leading-tight">{term.title}</h3>
            </div>
            <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-800 uppercase tracking-wide text-green-800 whitespace-nowrap">
              {term.leaders.length} leaders
            </span>
          </div>
          {(term.start_date || term.end_date) && (
            <p className="text-xs font-700 text-muted mb-3">
              {term.start_date ? formatDate(term.start_date) : 'Start not set'} - {term.end_date ? formatDate(term.end_date) : 'Present'}
            </p>
          )}
          {term.summary && <p className="text-sm text-muted leading-relaxed mb-4">{term.summary}</p>}
          <div className="flex flex-wrap gap-2">
            {preview.map((leader) => <Badge key={leader.id} variant="gray">{leader.office}: {leader.full_name}</Badge>)}
            {term.leaders.length > preview.length && <Badge variant="gray">+{term.leaders.length - preview.length} more</Badge>}
          </div>
        </div>
      </div>
    </article>
  )
}

function LeadershipManager({ terms }: { terms: LeadershipTerm[] }) {
  const qc = useQueryClient()
  const [termForm, setTermForm] = useState<TermForm>({
    title: '',
    academic_year: '',
    start_date: '',
    end_date: '',
    theme: '',
    summary: '',
    is_current: false,
  })
  const [leaderForm, setLeaderForm] = useState<LeaderForm>({
    term_id: terms[0]?.id ?? '',
    full_name: '',
    office: '',
    bio: '',
    email: '',
    phone: '',
    sort_order: 0,
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['leadership'] })

  const createTerm = useMutation({
    mutationFn: () => leadershipApi.createTerm({
      ...termForm,
      start_date: termForm.start_date || null,
      end_date: termForm.end_date || null,
      theme: termForm.theme || null,
      summary: termForm.summary || null,
    }),
    onSuccess: () => {
      setTermForm({ title: '', academic_year: '', start_date: '', end_date: '', theme: '', summary: '', is_current: false })
      refresh()
    },
  })

  const createLeader = useMutation({
    mutationFn: () => leadershipApi.createLeader({
      ...leaderForm,
      bio: leaderForm.bio || null,
      email: leaderForm.email || null,
      phone: leaderForm.phone || null,
    }),
    onSuccess: () => {
      setLeaderForm((form) => ({ ...form, full_name: '', office: '', bio: '', email: '', phone: '', sort_order: form.sort_order + 1 }))
      refresh()
    },
  })

  const uploadPhoto = useMutation({
    mutationFn: ({ leaderId, file }: { leaderId: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return leadershipApi.uploadLeaderPhoto(leaderId, form)
    },
    onSuccess: refresh,
  })

  const deleteLeader = useMutation({
    mutationFn: leadershipApi.deleteLeader,
    onSuccess: refresh,
  })

  const submitTerm = (event: FormEvent) => {
    event.preventDefault()
    createTerm.mutate()
  }

  const submitLeader = (event: FormEvent) => {
    event.preventDefault()
    createLeader.mutate()
  }

  return (
    <section className="section-padding bg-white">
      <div className="section-container">
        <div className="mb-8">
          <Badge variant="purple" className="mb-3">Executive tools</Badge>
          <h2 className="section-title">Manage leadership history</h2>
          <p className="section-sub">Add each administration once, then attach officers with names, offices, contacts, bios, and real photos.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={submitTerm} className="rounded-xl border border-cream-dark bg-cream-dark p-5">
            <h3 className="font-display text-3xl font-bold text-deep mb-5">Add administration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Title" value={termForm.title} onChange={(value) => setTermForm((f) => ({ ...f, title: value }))} required placeholder="2026/2027 Executive Council" />
              <Field label="Academic year" value={termForm.academic_year} onChange={(value) => setTermForm((f) => ({ ...f, academic_year: value }))} required placeholder="2026/2027" />
              <Field label="Start date" type="date" value={termForm.start_date} onChange={(value) => setTermForm((f) => ({ ...f, start_date: value }))} />
              <Field label="End date" type="date" value={termForm.end_date} onChange={(value) => setTermForm((f) => ({ ...f, end_date: value }))} />
              <div className="sm:col-span-2">
                <Field label="Theme" value={termForm.theme} onChange={(value) => setTermForm((f) => ({ ...f, theme: value }))} placeholder="Service and accountability" />
              </div>
              <label className="sm:col-span-2">
                <span className="form-label">Summary</span>
                <textarea className="form-input min-h-[110px]" value={termForm.summary} onChange={(e) => setTermForm((f) => ({ ...f, summary: e.target.value }))} />
              </label>
              <label className="sm:col-span-2 flex items-center gap-3 text-sm font-600 text-deep">
                <input type="checkbox" checked={termForm.is_current} onChange={(e) => setTermForm((f) => ({ ...f, is_current: e.target.checked }))} />
                Mark as current administration
              </label>
            </div>
            <Button type="submit" variant="primary" className="mt-5" loading={createTerm.isPending} leftIcon={<Plus className="h-4 w-4" />}>
              Save Administration
            </Button>
          </form>

          <form onSubmit={submitLeader} className="rounded-xl border border-cream-dark bg-cream-dark p-5">
            <h3 className="font-display text-3xl font-bold text-deep mb-5">Add officer</h3>
            {!terms.length ? (
              <EmptyState title="Create an administration first" description="Officers must belong to a leadership term." />
            ) : (
              <>
                <label className="block mb-4">
                  <span className="form-label">Administration</span>
                  <select className="form-select" value={leaderForm.term_id || terms[0]?.id} onChange={(e) => setLeaderForm((f) => ({ ...f, term_id: e.target.value }))}>
                    {terms.map((term) => <option key={term.id} value={term.id}>{term.academic_year} - {term.title}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full name" value={leaderForm.full_name} onChange={(value) => setLeaderForm((f) => ({ ...f, full_name: value }))} required placeholder="Jane Doe" />
                  <Field label="Office" value={leaderForm.office} onChange={(value) => setLeaderForm((f) => ({ ...f, office: value }))} required placeholder="President" />
                  <Field label="Email" type="email" value={leaderForm.email} onChange={(value) => setLeaderForm((f) => ({ ...f, email: value }))} />
                  <Field label="Phone" value={leaderForm.phone} onChange={(value) => setLeaderForm((f) => ({ ...f, phone: value }))} />
                  <Field label="Sort order" type="number" value={String(leaderForm.sort_order)} onChange={(value) => setLeaderForm((f) => ({ ...f, sort_order: Number(value) }))} />
                  <label className="sm:col-span-2">
                    <span className="form-label">Bio / responsibility</span>
                    <textarea className="form-input min-h-[110px]" value={leaderForm.bio} onChange={(e) => setLeaderForm((f) => ({ ...f, bio: e.target.value }))} />
                  </label>
                </div>
                <Button type="submit" variant="primary" className="mt-5" loading={createLeader.isPending} leftIcon={<Plus className="h-4 w-4" />}>
                  Save Officer
                </Button>
              </>
            )}
          </form>
        </div>

        {terms.length > 0 && (
          <div className="mt-8 rounded-xl border border-cream-dark bg-white p-5">
            <h3 className="font-display text-3xl font-bold text-deep mb-5">Uploaded officers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {terms.flatMap((term) => term.leaders.map((leader) => ({ term, leader }))).map(({ term, leader }) => (
                <div key={leader.id} className="rounded-xl border border-cream-dark p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-cream-dark shrink-0">
                      {leader.photo_url ? <img src={leader.photo_url} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-full w-full p-3 text-green-700/45" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-700 text-deep truncate">{leader.full_name}</p>
                      <p className="text-xs text-muted truncate">{leader.office} · {term.academic_year}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="btn-sm btn-outline cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) uploadPhoto.mutate({ leaderId: leader.id, file })
                          e.currentTarget.value = ''
                        }}
                      />
                    </label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => deleteLeader.mutate(leader.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <input className="form-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} />
    </label>
  )
}

function ContactCta({ onWelfare, onAcademics }: { onWelfare: () => void; onAcademics: () => void }) {
  return (
    <section className="section-padding bg-white">
      <div className="section-container">
        <div className="rounded-2xl overflow-hidden bg-brand text-white">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.78fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <Badge variant="gold" className="mb-5">Need the right office?</Badge>
              <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight mb-4">Start with the correct channel.</h2>
              <p className="text-white/70 leading-relaxed max-w-2xl mb-8">
                Use welfare for confidential support, academics for resources and course concerns, and events for program or registration questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="gold" size="lg" onClick={onWelfare} leftIcon={<HeartHandshake className="h-4 w-4" />}>Welfare Support</Button>
                <Button variant="outline-white" size="lg" onClick={onAcademics} leftIcon={<BookOpen className="h-4 w-4" />}>Academic Support</Button>
              </div>
            </div>
            <div className="border-t lg:border-t-0 lg:border-l border-white/10 p-7 sm:p-10 lg:p-12">
              <div className="space-y-4">
                <CtaRow icon={Mail} title="General leadership email" body="leadership@gpsauds.org" />
                <CtaRow icon={MessageSquareText} title="Student feedback" body="Share concerns through your class representative or portfolio lead." />
                <CtaRow icon={CalendarDays} title="Meetings and programs" body="Watch the Events page for official leadership engagements." />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CtaRow({ icon: Icon, title, body }: { icon: typeof Mail; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-white/7 border border-white/10 p-4">
      <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h3 className="font-700 text-white mb-1">{title}</h3>
        <p className="text-sm text-white/60 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}
