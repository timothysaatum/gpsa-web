import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3, BookOpen, Briefcase, CalendarDays, CheckCircle2,
  Image, Newspaper, Plus, RefreshCw, ScrollText, Shield, Upload, Users,
} from 'lucide-react'
import {
  academicsApi, adminApi, eventsApi, galleryApi, leadershipApi, newsApi,
  opportunitiesApi, usersApi, welfareApi,
} from '@/api/services'
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui'
import { formatDate, formatDateTime } from '@/utils'
import type {
  EventType, GalleryCategory, Leader, LeadershipTerm, NewsCategory, OpportunityType,
  ReportStatus, UserRole,
} from '@/types'
import { AdminPageHeader, AdminStatCard } from './AdminLayout'
import { HeroSlidesPage } from './HeroSlidesPage'

const input = 'form-input'
const label = 'form-label'

export function AdminDashboardPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.dashboard })
  const stats = [
    { label: 'Users', value: data?.users ?? 0, icon: Users },
    { label: 'News', value: data?.news_posts ?? 0, icon: Newspaper },
    { label: 'Events', value: data?.events ?? 0, icon: CalendarDays },
    { label: 'Opportunities', value: data?.opportunities ?? 0, icon: Briefcase },
    { label: 'Gallery', value: data?.gallery_images ?? 0, icon: Image },
    { label: 'Resources', value: data?.academic_resources ?? 0, icon: BookOpen },
    { label: 'Welfare', value: data?.welfare_reports ?? 0, icon: Shield },
    { label: 'Pending Welfare', value: data?.pending_welfare_reports ?? 0, icon: BarChart3 },
  ]

  return (
    <>
      <AdminPageHeader
        title="Admin Dashboard"
        description="A practical overview of website content, student services, and recent administrative activity."
        action={<Button variant="outline" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>}
      />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{stats.map((s) => <AdminStatCard key={s.label} {...s} />)}</div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-[0.72fr_1fr] gap-5 mt-6">
        <QuickActions />
        <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-3xl font-bold text-deep">Recent audit activity</h3>
            <Link to="/admin/audit-logs" className="text-sm font-700 text-green-700">View all</Link>
          </div>
          <AuditList items={data?.recent_audit ?? []} compact />
        </div>
      </div>
    </>
  )
}

function QuickActions() {
  const actions = [
    { label: 'Create News', to: '/admin/news', icon: Newspaper },
    { label: 'Create Event', to: '/admin/events', icon: CalendarDays },
    { label: 'Upload Gallery', to: '/admin/gallery', icon: Image },
    { label: 'Add Leader', to: '/admin/leadership', icon: Users },
    { label: 'Post Opportunity', to: '/admin/opportunities', icon: Briefcase },
    { label: 'Upload Resource', to: '/admin/academics', icon: BookOpen },
  ]
  return (
    <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
      <h3 className="font-display text-3xl font-bold text-deep mb-4">Quick actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map(({ label, to, icon: Icon }) => (
          <Link key={label} to={to} className="flex items-center gap-3 rounded-xl border border-cream-dark p-4 text-sm font-700 text-deep hover:border-green-300 hover:bg-green-50">
            <Icon className="h-5 w-5 text-green-700" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function AdminAuditLogsPage() {
  const [filters, setFilters] = useState({ action: '', entity_type: '' })
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', filters],
    queryFn: () => adminApi.auditLogs({ ...filters, offset: 0, limit: 80 }),
  })
  return (
    <>
      <AdminPageHeader title="Audit Logs" description="Review who changed what, when, and from where." />
      <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Action" value={filters.action} onChange={(v) => setFilters((f) => ({ ...f, action: v }))} placeholder="CREATE, UPDATE..." />
        <Field label="Entity" value={filters.entity_type} onChange={(v) => setFilters((f) => ({ ...f, entity_type: v }))} placeholder="news_post, event..." />
      </div>
      <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
        {isLoading ? <Skeleton className="h-96 rounded-xl" /> : <AuditList items={data?.items ?? []} />}
      </div>
    </>
  )
}

function AuditList({ items, compact = false }: { items: any[]; compact?: boolean }) {
  if (!items.length) return <EmptyState title="No audit logs yet" description="Administrative activity will appear here." />
  return (
    <div className="divide-y divide-cream-dark">
      {items.map((log) => (
        <div key={log.id} className="py-3 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <ScrollText className="h-4 w-4 text-green-700" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="green">{log.action}</Badge>
              <span className="text-sm font-700 text-deep">{log.entity_type}</span>
              {log.actor && <span className="text-xs text-muted">by {log.actor.full_name}</span>}
            </div>
            {!compact && (
              <p className="text-xs text-muted mt-1 break-all">
                {log.entity_id ?? 'No entity'} · {log.ip_address ?? 'No IP'} · {log.request_id ?? 'No request id'}
              </p>
            )}
          </div>
          <span className="text-xs text-muted whitespace-nowrap">{formatDateTime(log.created_at)}</span>
        </div>
      ))}
    </div>
  )
}

export function AdminHomePage() {
  return <HeroSlidesPage />
}

export function AdminAboutPage() {
  return (
    <>
      <AdminPageHeader title="About Page" description="The public About page is backend-backed. Structured editing for mission, vision, values, pillars, and timeline is the next module." />
      <InfoPanel title="Current capability" items={['Live About API is active', 'Stats, news, events, gallery, and welfare are pulled from backend', 'Next step: editable site_pages content_json form']} />
    </>
  )
}

export function AdminNewsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', category: 'general' as NewsCategory, summary: '', body: '', banner_emoji: '📣', is_featured: false, is_urgent: false, is_strip_announcement: false, publish_immediately: false })
  const { data, isLoading } = useQuery({ queryKey: ['admin-news'], queryFn: () => newsApi.list({ limit: 100 }) })
  const create = useMutation({ mutationFn: () => newsApi.create(form), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-news'] }); setForm((f) => ({ ...f, title: '', summary: '', body: '' })) } })
  const del = useMutation({ mutationFn: newsApi.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-news'] }) })
  const publish = useMutation({ mutationFn: newsApi.publish, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-news'] }) })

  return (
    <CrudPage title="News" description="Create announcements, updates, urgent posts, and strip announcements.">
      <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="admin-form">
        <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
        <Select label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v as NewsCategory }))} options={['announcement','academic_update','welfare_update','events_recap','opportunities','general']} />
        <Field label="Emoji" value={form.banner_emoji} onChange={(v) => setForm((f) => ({ ...f, banner_emoji: v }))} />
        <Textarea label="Summary" value={form.summary} onChange={(v) => setForm((f) => ({ ...f, summary: v }))} required />
        <Textarea label="Body" value={form.body} onChange={(v) => setForm((f) => ({ ...f, body: v }))} required rows={7} />
        <Check label="Featured" checked={form.is_featured} onChange={(v) => setForm((f) => ({ ...f, is_featured: v }))} />
        <Check label="Urgent" checked={form.is_urgent} onChange={(v) => setForm((f) => ({ ...f, is_urgent: v }))} />
        <Check label="Announcement strip" checked={form.is_strip_announcement} onChange={(v) => setForm((f) => ({ ...f, is_strip_announcement: v }))} />
        <Check label="Publish immediately" checked={form.publish_immediately} onChange={(v) => setForm((f) => ({ ...f, publish_immediately: v }))} />
        <Button type="submit" loading={create.isPending} leftIcon={<Plus className="h-4 w-4" />}>Create News</Button>
      </form>
      <AdminList isLoading={isLoading} items={data?.items ?? []} title={(p) => p.title} meta={(p) => `${p.category} · ${p.published_at ? 'Published' : 'Draft'}`} actions={(p) => <>
        {!p.published_at && <Button size="sm" variant="outline" onClick={() => publish.mutate(p.id)}>Publish</Button>}
        <Button size="sm" variant="destructive" onClick={() => del.mutate(p.id)}>Delete</Button>
      </>} />
    </CrudPage>
  )
}

export function AdminEventsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', description: '', event_type: 'academic' as EventType, start_datetime: '', end_datetime: '', location: '', banner_emoji: '📅', is_featured: false })
  const { data, isLoading } = useQuery({ queryKey: ['admin-events'], queryFn: () => eventsApi.list({ limit: 100 }) })
  const create = useMutation({ mutationFn: () => eventsApi.create({ ...form, end_datetime: form.end_datetime || null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-events'] }); setForm((f) => ({ ...f, title: '', description: '', location: '' })) } })
  const del = useMutation({ mutationFn: eventsApi.deleteEvent, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-events'] }) })
  return (
    <CrudPage title="Events" description="Create and manage public events.">
      <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="admin-form">
        <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
        <Select label="Type" value={form.event_type} onChange={(v) => setForm((f) => ({ ...f, event_type: v as EventType }))} options={['academic','welfare','outreach','social','conference']} />
        <Field label="Start date/time" type="datetime-local" value={form.start_datetime} onChange={(v) => setForm((f) => ({ ...f, start_datetime: v }))} required />
        <Field label="End date/time" type="datetime-local" value={form.end_datetime} onChange={(v) => setForm((f) => ({ ...f, end_datetime: v }))} />
        <Field label="Location" value={form.location} onChange={(v) => setForm((f) => ({ ...f, location: v }))} required />
        <Field label="Emoji" value={form.banner_emoji} onChange={(v) => setForm((f) => ({ ...f, banner_emoji: v }))} />
        <Textarea label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} required />
        <Check label="Featured" checked={form.is_featured} onChange={(v) => setForm((f) => ({ ...f, is_featured: v }))} />
        <Button type="submit" loading={create.isPending} leftIcon={<Plus className="h-4 w-4" />}>Create Event</Button>
      </form>
      <AdminList isLoading={isLoading} items={data?.items ?? []} title={(e) => e.title} meta={(e) => `${e.event_type} · ${formatDateTime(e.start_datetime)} · ${e.location}`} actions={(e) => <Button size="sm" variant="destructive" onClick={() => del.mutate(e.id)}>Delete</Button>} />
    </CrudPage>
  )
}

export function AdminOpportunitiesPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', organization: '', opp_type: 'internship' as OpportunityType, description: '', location: '', deadline: '', external_link: '' })
  const { data, isLoading } = useQuery({ queryKey: ['admin-opportunities'], queryFn: () => opportunitiesApi.list({ include_expired: true, limit: 100 }) })
  const create = useMutation({ mutationFn: () => opportunitiesApi.create({ ...form, location: form.location || null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-opportunities'] }); setForm((f) => ({ ...f, title: '', organization: '', description: '', location: '', deadline: '', external_link: '' })) } })
  const del = useMutation({ mutationFn: opportunitiesApi.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-opportunities'] }) })
  return (
    <CrudPage title="Opportunities" description="Publish internships, scholarships, jobs, and training opportunities.">
      <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="admin-form">
        <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
        <Field label="Organization" value={form.organization} onChange={(v) => setForm((f) => ({ ...f, organization: v }))} required />
        <Select label="Type" value={form.opp_type} onChange={(v) => setForm((f) => ({ ...f, opp_type: v as OpportunityType }))} options={['internship','scholarship','job','training']} />
        <Field label="Location" value={form.location} onChange={(v) => setForm((f) => ({ ...f, location: v }))} />
        <Field label="Deadline" type="date" value={form.deadline} onChange={(v) => setForm((f) => ({ ...f, deadline: v }))} required />
        <Field label="External link" type="url" value={form.external_link} onChange={(v) => setForm((f) => ({ ...f, external_link: v }))} required />
        <Textarea label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} required />
        <Button type="submit" loading={create.isPending} leftIcon={<Plus className="h-4 w-4" />}>Create Opportunity</Button>
      </form>
      <AdminList isLoading={isLoading} items={data?.items ?? []} title={(o) => o.title} meta={(o) => `${o.organization} · ${o.opp_type} · deadline ${formatDate(o.deadline)}`} actions={(o) => <Button size="sm" variant="destructive" onClick={() => del.mutate(o.id)}>Delete</Button>} />
    </CrudPage>
  )
}

export function AdminGalleryPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', description: '', category: 'events' as GalleryCategory, event_date: '', sort_order: 0, file: null as File | null })
  const { data, isLoading } = useQuery({ queryKey: ['admin-gallery'], queryFn: () => galleryApi.list({ limit: 100 }) })
  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      if (form.file) fd.append('file', form.file)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('category', form.category)
      if (form.event_date) fd.append('event_date', form.event_date)
      fd.append('sort_order', String(form.sort_order))
      return galleryApi.create(fd)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-gallery'] }); setForm((f) => ({ ...f, title: '', description: '', file: null })) },
  })
  const del = useMutation({ mutationFn: galleryApi.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-gallery'] }) })
  return (
    <CrudPage title="Gallery" description="Upload and organize public website photos.">
      <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="admin-form">
        <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
        <Select label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v as GalleryCategory }))} options={['events','academic','health','outreach','social','welfare']} />
        <Field label="Event date" type="date" value={form.event_date} onChange={(v) => setForm((f) => ({ ...f, event_date: v }))} />
        <Textarea label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
        <label><span className={label}>Image</span><input className={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))} required /></label>
        <Button type="submit" loading={create.isPending} leftIcon={<Upload className="h-4 w-4" />}>Upload Image</Button>
      </form>
      <AdminList isLoading={isLoading} items={data ?? []} title={(g) => g.title} meta={(g) => `${g.category} · ${g.event_date ? formatDate(g.event_date) : 'No date'}`} actions={(g) => <Button size="sm" variant="destructive" onClick={() => del.mutate(g.id)}>Delete</Button>} />
    </CrudPage>
  )
}

export function AdminLeadershipPage() {
  const qc = useQueryClient()
  const { data: terms = [], isLoading } = useQuery({ queryKey: ['admin-leadership'], queryFn: () => leadershipApi.list({ include_inactive: true, limit: 100 }) })
  const [term, setTerm] = useState({ title: '', academic_year: '', theme: '', summary: '', is_current: false })
  const [leader, setLeader] = useState({ term_id: '', full_name: '', office: '', bio: '', email: '', phone: '', sort_order: 0 })
  const createTerm = useMutation({ mutationFn: () => leadershipApi.createTerm({ ...term, theme: term.theme || null, summary: term.summary || null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-leadership'] }); setTerm({ title: '', academic_year: '', theme: '', summary: '', is_current: false }) } })
  const createLeader = useMutation({ mutationFn: () => leadershipApi.createLeader({ ...leader, term_id: leader.term_id || terms[0]?.id, bio: leader.bio || null, email: leader.email || null, phone: leader.phone || null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-leadership'] }); setLeader((l) => ({ ...l, full_name: '', office: '', bio: '', email: '', phone: '' })) } })
  const uploadPhoto = useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => { const fd = new FormData(); fd.append('file', file); return leadershipApi.uploadLeaderPhoto(id, fd) }, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leadership'] }) })
  const flatLeaders = terms.flatMap((t) => t.leaders.map((l) => ({ ...l, term: t })))
  return (
    <CrudPage title="Leadership" description="Maintain every administration, officer, office, contact, and real leader photo.">
      <form onSubmit={(e) => { e.preventDefault(); createTerm.mutate() }} className="admin-form">
        <h3 className="font-display text-2xl font-bold text-deep">Administration</h3>
        <Field label="Title" value={term.title} onChange={(v) => setTerm((f) => ({ ...f, title: v }))} required />
        <Field label="Academic year" value={term.academic_year} onChange={(v) => setTerm((f) => ({ ...f, academic_year: v }))} required />
        <Field label="Theme" value={term.theme} onChange={(v) => setTerm((f) => ({ ...f, theme: v }))} />
        <Textarea label="Summary" value={term.summary} onChange={(v) => setTerm((f) => ({ ...f, summary: v }))} />
        <Check label="Current administration" checked={term.is_current} onChange={(v) => setTerm((f) => ({ ...f, is_current: v }))} />
        <Button type="submit" loading={createTerm.isPending}>Save Term</Button>
        <h3 className="font-display text-2xl font-bold text-deep pt-5 border-t border-cream-dark">Officer</h3>
        <Select label="Term" value={leader.term_id || terms[0]?.id || ''} onChange={(v) => setLeader((f) => ({ ...f, term_id: v }))} options={terms.map((t) => ({ label: `${t.academic_year} - ${t.title}`, value: t.id }))} />
        <Field label="Full name" value={leader.full_name} onChange={(v) => setLeader((f) => ({ ...f, full_name: v }))} required />
        <Field label="Office" value={leader.office} onChange={(v) => setLeader((f) => ({ ...f, office: v }))} required />
        <Field label="Email" value={leader.email} onChange={(v) => setLeader((f) => ({ ...f, email: v }))} />
        <Field label="Phone" value={leader.phone} onChange={(v) => setLeader((f) => ({ ...f, phone: v }))} />
        <Textarea label="Bio" value={leader.bio} onChange={(v) => setLeader((f) => ({ ...f, bio: v }))} />
        <Button type="button" onClick={() => createLeader.mutate()} disabled={!terms.length} loading={createLeader.isPending}>Save Officer</Button>
      </form>
      <AdminList isLoading={isLoading} items={flatLeaders} title={(l: Leader & { term: LeadershipTerm }) => l.full_name} meta={(l) => `${l.office} · ${l.term.academic_year}`} actions={(l) => <label className="btn-sm btn-outline cursor-pointer"><Upload className="h-4 w-4" />Photo<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadPhoto.mutate({ id: l.id, file }) }} /></label>} />
    </CrudPage>
  )
}

export function AdminAcademicsPage() {
  const qc = useQueryClient()
  const { data: courses = [] } = useQuery({ queryKey: ['admin-courses'], queryFn: () => academicsApi.listCourses() })
  const { data, isLoading } = useQuery({ queryKey: ['admin-resources'], queryFn: () => academicsApi.listResources({ limit: 100 }) })
  return <CrudPage title="Academics" description="Review resources and use the public upload flow for new resources."><InfoPanel title="Resource workflow" items={['Exec/admin uploads are supported', 'Admin can publish reviewed resources', 'Course management exists through API']} /><AdminList isLoading={isLoading} items={data?.items ?? []} title={(r) => r.title} meta={(r) => `${r.content_type} · Level ${r.level} · ${r.is_published ? 'Published' : 'Pending'}`} actions={(r) => !r.is_published ? <Button size="sm" variant="outline" onClick={() => academicsApi.publishResource(r.id).then(() => qc.invalidateQueries({ queryKey: ['admin-resources'] }))}>Publish</Button> : <CheckCircle2 className="h-5 w-5 text-green-700" />} /><p className="text-sm text-muted mt-4">{courses.length} courses configured.</p></CrudPage>
}

export function AdminWelfarePage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-welfare'], queryFn: () => welfareApi.listReports({ limit: 100 }) })
  const resolve = useMutation({ mutationFn: ({ id, status }: { id: string; status: ReportStatus }) => welfareApi.resolveReport(id, { status, admin_notes: 'Updated from admin dashboard.' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-welfare'] }) })
  return <CrudPage title="Welfare" description="Review welfare reports and move them through the resolution workflow."><AdminList isLoading={isLoading} items={data?.items ?? []} title={(r) => r.is_anonymous ? 'Anonymous report' : r.name ?? 'Student report'} meta={(r) => `${r.category} · ${r.report_type} · ${r.status}`} actions={(r) => <><Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: r.id, status: 'in_review' })}>Review</Button><Button size="sm" onClick={() => resolve.mutate({ id: r.id, status: 'resolved' })}>Resolve</Button></>} /></CrudPage>
}

export function AdminUsersPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => usersApi.listUsers({ limit: 100 }) })
  const update = useMutation({ mutationFn: ({ id, role }: { id: string; role: UserRole }) => usersApi.adminUpdateUser(id, { role }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }) })
  return <CrudPage title="Users" description="Admin-only user and role management."><AdminList isLoading={isLoading} items={data?.items ?? []} title={(u) => u.full_name} meta={(u) => `${u.email} · ${u.role}`} actions={(u) => <Select compact label="Role" value={u.role} onChange={(role) => update.mutate({ id: u.id, role: role as UserRole })} options={['student','exec','admin']} />} /></CrudPage>
}

export function AdminSettingsPage() {
  return <><AdminPageHeader title="Settings" description="Site-wide settings and editable page content will be implemented here after the settings tables are added." /><InfoPanel title="Planned settings" items={['Site contact details', 'Welfare emergency contact', 'Social links', 'Homepage curation defaults', 'About page content blocks']} /></>
}

function CrudPage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const childArray = Array.isArray(children) ? children : [children]
  return (
    <>
      <AdminPageHeader title={title} description={description} />
      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">{childArray}</div>
    </>
  )
}

function AdminList<T>({ isLoading, items, title, meta, actions }: { isLoading?: boolean; items: T[]; title: (item: T) => string; meta: (item: T) => string; actions?: (item: T) => React.ReactNode }) {
  if (isLoading) return <Skeleton className="h-96 rounded-xl" />
  if (!items.length) return <div className="rounded-xl border border-cream-dark bg-white p-5 shadow-card"><EmptyState title="No records yet" description="Create the first record using the form." /></div>
  return (
    <div className="rounded-xl border border-cream-dark bg-white p-5 shadow-card divide-y divide-cream-dark">
      {items.map((item, index) => (
        <div key={(item as any).id ?? index} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="font-700 text-deep truncate">{title(item)}</p>
            <p className="text-sm text-muted truncate">{meta(item)}</p>
          </div>
          {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions(item)}</div>}
        </div>
      ))}
    </div>
  )
}

function Field({ label: text, value, onChange, type = 'text', required, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return <label><span className={label}>{text}</span><input className={input} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} /></label>
}

function Textarea({ label: text, value, onChange, required, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; rows?: number }) {
  return <label><span className={label}>{text}</span><textarea className={input} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} required={required} /></label>
}

function Select({ label: text, value, onChange, options, compact = false }: { label: string; value: string; onChange: (value: string) => void; options: (string | { label: string; value: string })[]; compact?: boolean }) {
  return <label className={compact ? 'min-w-[130px]' : ''}><span className={compact ? 'sr-only' : label}>{text}</span><select className={compact ? 'form-select py-2 text-xs' : 'form-select'} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
}

function Check({ label: text, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-3 text-sm font-700 text-deep"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{text}</label>
}

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-xl border border-cream-dark bg-white p-5 shadow-card"><h3 className="font-display text-3xl font-bold text-deep mb-4">{title}</h3><div className="space-y-3">{items.map((item) => <div key={item} className="flex items-center gap-3 text-sm text-secondary"><CheckCircle2 className="h-4 w-4 text-green-700" />{item}</div>)}</div></div>
}
