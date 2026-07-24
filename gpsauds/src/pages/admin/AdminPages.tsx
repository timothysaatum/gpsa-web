import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3, BookOpen, Briefcase, CalendarDays, CheckCircle2,
  ChevronDown, Image, Newspaper, Plus, RefreshCw, ScrollText, Settings2, Shield, Trash2, Upload, Users, X,
} from 'lucide-react'
import {
  academicsApi, aboutApi, adminApi, cmsApi, contactApi, eventsApi, galleryApi, governanceApi, impactApi, leadershipApi, legacyApi, newsApi,
  opportunitiesApi, usersApi, welfareApi,
} from '@/api/services'
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui'
import { RichTextEditor } from '@/components/shared/RichText'
import { formatDate, formatDateTime } from '@/utils'
import type {
  ContactStatus, ContactSubmission, EventType, GalleryCategory, GalleryItem, Leader, LeadershipTerm, NewsCategory, Partner,
  OpportunityType, ReportStatus, UserRole,
} from '@/types'
import { AdminPageHeader, AdminStatCard } from './AdminLayout'
import { HeroSlidesPage } from './HeroSlidesPage'
import { useAuthStore } from '@/store/authStore'
import { historyContentTemplate } from '@/pages/HistoryLegacyPage'
import { leadershipPageDefaults } from '@/pages/LeadershipPage'
import {
  academicsPageDefaults, contactPageDefaults, eventsPageDefaults, galleryPageDefaults, homePageDefaults, newsPageDefaults,
  opportunitiesPageDefaults, welfarePageDefaults,
} from '@/config/cmsPageDefaults'

const input = 'form-input'
const label = 'form-label'

export function AdminDashboardPage() {
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
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
      <div className={isAdmin ? 'grid grid-cols-1 xl:grid-cols-[0.72fr_1fr] gap-5 mt-6' : 'mt-6'}>
        <QuickActions />
        {isAdmin && <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-3xl font-bold text-deep">Recent audit activity</h3>
            <Link to="/admin/audit-logs" className="text-sm font-700 text-green-700">View all</Link>
          </div>
          <AuditList items={data?.recent_audit ?? []} compact />
        </div>}
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
  const [filters, setFilters] = useState({ action: '', entity_type: '', role: '', search: '', date_from: '', date_to: '' })
  const [offset, setOffset] = useState(0)
  const limit = 50
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', filters, offset],
    queryFn: () => adminApi.auditLogs({
      ...filters,
      role: filters.role ? filters.role as UserRole : undefined,
      date_from: filters.date_from ? new Date(`${filters.date_from}T00:00:00`).toISOString() : undefined,
      date_to: filters.date_to ? new Date(`${filters.date_to}T23:59:59.999`).toISOString() : undefined,
      offset,
      limit,
    }),
  })
  return (
    <>
      <AdminPageHeader title="Audit Logs" description="Review who changed what, when, and from where." />
      <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Search" value={filters.search} onChange={(v) => { setOffset(0); setFilters((f) => ({ ...f, search: v })) }} placeholder="Actor, action, request id..." />
        <Field label="Action" value={filters.action} onChange={(v) => { setOffset(0); setFilters((f) => ({ ...f, action: v })) }} placeholder="CREATE, UPDATE..." />
        <Field label="Entity" value={filters.entity_type} onChange={(v) => { setOffset(0); setFilters((f) => ({ ...f, entity_type: v })) }} placeholder="news_post, event..." />
        <Select label="Actor role" value={filters.role} onChange={(v) => { setOffset(0); setFilters((f) => ({ ...f, role: v })) }} options={[{ label: 'All roles', value: '' }, 'admin', 'exec', 'student']} />
        <Field label="From" type="date" value={filters.date_from} onChange={(v) => { setOffset(0); setFilters((f) => ({ ...f, date_from: v })) }} />
        <Field label="To" type="date" value={filters.date_to} onChange={(v) => { setOffset(0); setFilters((f) => ({ ...f, date_to: v })) }} />
      </div>
      <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
        {isLoading ? <Skeleton className="h-96 rounded-xl" /> : <AuditList items={data?.items ?? []} />}
        {!!data?.total && <div className="mt-5 pt-4 border-t border-cream-dark flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Showing {offset + 1}–{Math.min(offset + limit, data.total)} of {data.total}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button>
            <Button size="sm" variant="outline" disabled={offset + limit >= data.total} onClick={() => setOffset(offset + limit)}>Next</Button>
          </div>
        </div>}
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
  return <><CmsDocumentEditor slug="home" title="Home Page Settings" initialContent={homePageDefaults} /><HeroSlidesPage /></>
}

function PartnerAdminRow({ partner, onChanged }: { partner: Partner; onChanged: () => void }) {
  const [name, setName] = useState(partner.name)
  const [websiteUrl, setWebsiteUrl] = useState(partner.website_url ?? '')
  const [sortOrder, setSortOrder] = useState(String(partner.sort_order))
  const [published, setPublished] = useState(partner.is_published)
  const [error, setError] = useState('')
  const save = useMutation({
    mutationFn: () => aboutApi.updatePartner(partner.id, {
      name: name.trim(),
      website_url: websiteUrl.trim() || null,
      sort_order: Number(sortOrder) || 0,
      is_published: published,
    }),
    onSuccess: () => { setError(''); onChanged() },
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to update partner.'),
  })
  const upload = useMutation({
    mutationFn: (file: File) => aboutApi.uploadPartnerLogo(partner.id, file),
    onSuccess: () => { setError(''); onChanged() },
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to upload logo.'),
  })
  const remove = useMutation({
    mutationFn: () => aboutApi.deletePartner(partner.id),
    onSuccess: onChanged,
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to delete partner.'),
  })

  return (
    <div className="rounded-xl border border-cream-dark bg-white p-4 shadow-card">
      <div className="grid gap-4 lg:grid-cols-[72px_1.4fr_1.4fr_90px_auto] lg:items-end">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-cream-dark bg-cream p-2">
          {partner.logo_url
            ? <img src={partner.logo_url} alt={`${partner.name} logo`} className="h-full w-full object-contain" />
            : <span className="text-lg font-800 text-green-800">{partner.name.slice(0, 2).toUpperCase()}</span>}
        </div>
        <label>
          <span className={label}>Partner name</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
        </label>
        <label>
          <span className={label}>Website URL</span>
          <input className={input} type="url" placeholder="https://…" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
        </label>
        <label>
          <span className={label}>Order</span>
          <input className={input} type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </label>
        <Check label="Published" checked={published} onChange={setPublished} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        <label className="btn-sm btn-outline cursor-pointer">
          <Upload className="h-4 w-4" />
          {partner.logo_url ? 'Replace logo' : 'Upload logo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload.mutate(file)
              e.target.value = ''
            }}
          />
        </label>
        <Button
          size="sm"
          variant="destructive"
          loading={remove.isPending}
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={() => {
            if (window.confirm(`Delete ${partner.name}? Its uploaded logo will also be removed.`)) remove.mutate()
          }}
        >
          Delete
        </Button>
        {upload.isPending && <span className="text-sm text-muted">Uploading and validating logo…</span>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    </div>
  )
}

function PartnerManager() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [error, setError] = useState('')
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: aboutApi.listPartnersAdmin,
  })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-partners'] })
    qc.invalidateQueries({ queryKey: ['about'] })
  }
  const create = useMutation({
    mutationFn: async () => {
      const partner = await aboutApi.createPartner({
        name: name.trim(),
        website_url: websiteUrl.trim() || null,
        sort_order: data.length,
        is_published: true,
      })
      return logo ? aboutApi.uploadPartnerLogo(partner.id, logo) : partner
    },
    onSuccess: () => {
      setName('')
      setWebsiteUrl('')
      setLogo(null)
      setError('')
      refresh()
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to create partner.'),
  })

  return (
    <section className="mb-6 rounded-xl border border-cream-dark bg-cream p-5 shadow-card">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-bold text-deep">Partners</h2>
        <p className="mt-1 text-sm text-muted">Create, order, publish and upload official partner logos. PNG or WebP with a transparent background works best.</p>
      </div>
      <div className="mb-5 grid gap-4 rounded-xl border border-cream-dark bg-white p-4 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
        <label>
          <span className={label}>Partner name</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Organisation name" maxLength={200} />
        </label>
        <label>
          <span className={label}>Website URL</span>
          <input className={input} type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" />
        </label>
        <label className="btn-sm btn-outline cursor-pointer">
          <Upload className="h-4 w-4" />
          {logo ? logo.name : 'Choose logo'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
        </label>
        <Button
          size="sm"
          loading={create.isPending}
          disabled={name.trim().length < 2}
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => create.mutate()}
        >
          Add partner
        </Button>
        {error && <p role="alert" className="text-sm text-red-700 lg:col-span-4">{error}</p>}
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : data.length ? (
        <div className="space-y-3">{data.map((partner) => <PartnerAdminRow key={partner.id} partner={partner} onChanged={refresh} />)}</div>
      ) : (
        <EmptyState icon="🤝" title="No partners yet" description="Add the first partner and upload its official logo." />
      )}
    </section>
  )
}

export function AdminAboutPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['cms-page', 'history'], queryFn: () => cmsApi.getPage('history'), retry: false })
  const [content, setContent] = useState(() => JSON.stringify(historyContentTemplate, null, 2))
  const [published, setPublished] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (data) {
      setContent(JSON.stringify(data.content, null, 2))
      setPublished(data.is_published)
    }
  }, [data])
  const save = useMutation({
    mutationFn: () => {
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new Error('Content must be valid JSON.')
      }
      return cmsApi.updatePage('history', {
        title: 'History & Legacy',
        content: parsed,
        is_published: published,
        expected_version: data?.version,
      })
    },
    onSuccess: () => {
      setError('')
      qc.invalidateQueries({ queryKey: ['cms-page', 'history'] })
      qc.invalidateQueries({ queryKey: ['history'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to save the page.'),
  })
  return (
    <>
      <AdminPageHeader title="About Content" description="Manage public partners and edit the complete History & Legacy page document." />
      <PartnerManager />
      <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
        <StructuredContentEditor
          value={JSON.parse(content) as Record<string, unknown>}
          onChange={(nextValue) => setContent(JSON.stringify(nextValue, null, 2))}
        />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Check label="Published" checked={published} onChange={setPublished} />
          <Button loading={save.isPending} onClick={() => save.mutate()}>Save History Page</Button>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {save.isSuccess && <p role="status" className="text-sm text-green-700">History page saved.</p>}
        </div>
      </div>
    </>
  )
}

export function AdminNewsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', category: 'general' as NewsCategory, summary: '', body: '', banner_emoji: '📣', image_alt: '', is_featured: false, is_urgent: false, is_strip_announcement: false, publish_immediately: false })
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const { data, isLoading } = useQuery({ queryKey: ['admin-news'], queryFn: () => newsApi.listAdmin({ limit: 100 }) })
  const create = useMutation({
    mutationFn: async () => {
      const post = await newsApi.create({ ...form, image_alt: form.image_alt || null })
      return coverImage ? newsApi.uploadImage(post.id, coverImage) : post
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-news'] })
      setForm((f) => ({ ...f, title: '', summary: '', body: '', image_alt: '' }))
      setCoverImage(null)
    },
  })
  const upload = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => newsApi.uploadImage(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-news'] }),
  })
  const del = useMutation({ mutationFn: newsApi.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-news'] }) })
  const publish = useMutation({ mutationFn: newsApi.publish, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-news'] }) })

  return (
    <>
    <CmsDocumentEditor slug="news" title="News Page Settings" initialContent={newsPageDefaults} />
    <CrudPage title="News" description="Create announcements, updates, urgent posts, and strip announcements.">
      <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="admin-form">
        <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
        <Select label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v as NewsCategory }))} options={['announcement','academic_update','welfare_update','events_recap','opportunities','general']} />
        <Field label="Emoji" value={form.banner_emoji} onChange={(v) => setForm((f) => ({ ...f, banner_emoji: v }))} />
        <label>
          <span className="form-label">Cover image</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="form-input" onChange={(event) => setCoverImage(event.target.files?.[0] ?? null)} />
          <span className="mt-1 block text-xs text-muted">JPEG, PNG, WebP or GIF. Maximum 10 MB. A wide 16:9 image works best.</span>
        </label>
        <Field label="Image description (alt text)" value={form.image_alt} onChange={(v) => setForm((f) => ({ ...f, image_alt: v }))} placeholder="Describe the image for screen-reader users" />
        <Textarea label="Summary" value={form.summary} onChange={(v) => setForm((f) => ({ ...f, summary: v }))} required />
        <Textarea label="Body" value={form.body} onChange={(v) => setForm((f) => ({ ...f, body: v }))} required rows={7} />
        <Check label="Featured" checked={form.is_featured} onChange={(v) => setForm((f) => ({ ...f, is_featured: v }))} />
        <Check label="Urgent" checked={form.is_urgent} onChange={(v) => setForm((f) => ({ ...f, is_urgent: v }))} />
        <Check label="Announcement strip" checked={form.is_strip_announcement} onChange={(v) => setForm((f) => ({ ...f, is_strip_announcement: v }))} />
        <Check label="Publish immediately" checked={form.publish_immediately} onChange={(v) => setForm((f) => ({ ...f, publish_immediately: v }))} />
        <Button type="submit" loading={create.isPending} leftIcon={<Plus className="h-4 w-4" />}>Create News</Button>
      </form>
      <AdminList isLoading={isLoading} items={data?.items ?? []} title={(p) => p.title} meta={(p) => `${p.category} · ${p.published_at ? 'Published' : 'Draft'}`} actions={(p) => <>
        <label className="btn-sm btn-outline cursor-pointer">
          <Upload className="h-4 w-4" />{p.image_url ? 'Replace image' : 'Add image'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) upload.mutate({ id: p.id, file })
            event.currentTarget.value = ''
          }} />
        </label>
        {!p.published_at && <Button size="sm" variant="outline" onClick={() => publish.mutate(p.id)}>Publish</Button>}
        <Button size="sm" variant="destructive" onClick={() => del.mutate(p.id)}>Delete</Button>
      </>} />
    </CrudPage>
    </>
  )
}

export function AdminEventsPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', description: '', event_type: 'academic' as EventType, start_datetime: '', end_datetime: '', location: '', banner_emoji: '📅', is_featured: false })
  const { data, isLoading } = useQuery({ queryKey: ['admin-events'], queryFn: () => eventsApi.list({ limit: 100 }) })
  const create = useMutation({ mutationFn: () => eventsApi.create({ ...form, end_datetime: form.end_datetime || null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-events'] }); setForm((f) => ({ ...f, title: '', description: '', location: '' })) } })
  const del = useMutation({ mutationFn: eventsApi.deleteEvent, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-events'] }) })
  return (
    <>
    <CmsDocumentEditor slug="events" title="Events Page Settings" initialContent={eventsPageDefaults} />
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
    </>
  )
}

export function AdminOpportunitiesPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', organization: '', opp_type: 'internship' as OpportunityType, description: '', location: '', deadline: '', external_link: '' })
  const { data, isLoading } = useQuery({ queryKey: ['admin-opportunities'], queryFn: () => opportunitiesApi.listAdmin({ limit: 100 }) })
  const create = useMutation({ mutationFn: () => opportunitiesApi.create({ ...form, location: form.location || null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-opportunities'] }); setForm((f) => ({ ...f, title: '', organization: '', description: '', location: '', deadline: '', external_link: '' })) } })
  const del = useMutation({ mutationFn: opportunitiesApi.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-opportunities'] }) })
  return (
    <>
    <CmsDocumentEditor slug="opportunities" title="Opportunities Page Settings" initialContent={opportunitiesPageDefaults} />
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
    </>
  )
}

export function AdminGalleryPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', description: '', category: 'events' as GalleryCategory, event_date: '', sort_order: 0, file: null as File | null })
  const { data, isLoading } = useQuery({ queryKey: ['admin-gallery'], queryFn: () => galleryApi.listAdmin({ limit: 200 }) })
  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      if (form.file) fd.append('file', form.file)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('category', form.category)
      if (form.event_date) fd.append('event_date', form.event_date)
      fd.append('sort_order', String(form.sort_order))
      fd.append('is_published', 'true')
      return galleryApi.create(fd)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gallery'] })
      qc.invalidateQueries({ queryKey: ['gallery'] })
      setForm((f) => ({ ...f, title: '', description: '', file: null }))
    },
  })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-gallery'] })
    qc.invalidateQueries({ queryKey: ['gallery'] })
  }
  return (
    <>
    <CmsDocumentEditor slug="gallery" title="Gallery Page Settings" initialContent={galleryPageDefaults} />
    <CrudPage title="Gallery" description="Upload and organize public website photos.">
      <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="admin-form">
        <Field label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
        <Select label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v as GalleryCategory }))} options={['events','academic','health','outreach','social','welfare']} />
        <Field label="Event date" type="date" value={form.event_date} onChange={(v) => setForm((f) => ({ ...f, event_date: v }))} />
        <Textarea label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
        <label><span className={label}>Image</span><input className={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))} required /></label>
        <Button type="submit" loading={create.isPending} leftIcon={<Upload className="h-4 w-4" />}>Upload Image</Button>
      </form>
      <div className="space-y-4">
        {isLoading ? <Skeleton className="h-96 rounded-xl" /> : (data ?? []).map((item) => (
          <GalleryAdminEditor key={item.id} item={item} onSaved={refresh} />
        ))}
        {!isLoading && !data?.length && <EmptyState title="No gallery images" description="Upload the first image using the form." />}
      </div>
    </CrudPage>
    </>
  )
}

export function AdminContactPage() {
  const [statusFilter, setStatusFilter] = useState<ContactStatus | ''>('')
  const [search, setSearch] = useState('')
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-contact', statusFilter, search],
    queryFn: () => contactApi.listAdmin({
      contact_status: statusFilter || undefined,
      search: search || undefined,
      limit: 100,
    }),
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-contact'] })
  return (
    <>
      <CmsDocumentEditor slug="contact" title="Contact Page Settings" initialContent={contactPageDefaults} />
      <AdminPageHeader title="Contact enquiries" description="Review, assign and resolve messages sent through the public Contact page." />
      <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Search" value={search} onChange={setSearch} placeholder="Reference, name, email or subject" />
        <Select label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as ContactStatus | '')} options={[
          { label: 'All statuses', value: '' }, 'pending', 'in_progress', 'resolved', 'spam',
        ]} />
      </div>
      <div className="space-y-4">
        {isLoading ? <Skeleton className="h-96 rounded-xl" /> : (data?.items ?? []).map((item) => (
          <ContactAdminEditor key={item.id} item={item} onSaved={refresh} />
        ))}
        {!isLoading && !data?.items.length && <EmptyState title="No enquiries found" description="New contact messages will appear here." />}
      </div>
    </>
  )
}

function ContactAdminEditor({ item, onSaved }: { item: ContactSubmission; onSaved: () => void }) {
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
  const [status, setStatus] = useState<ContactStatus>(item.status)
  const [notes, setNotes] = useState(item.admin_notes ?? '')
  const update = useMutation({
    mutationFn: () => contactApi.update(item.id, { status, admin_notes: notes || null }),
    onSuccess: onSaved,
  })
  const remove = useMutation({ mutationFn: () => contactApi.delete(item.id), onSuccess: onSaved })
  return (
    <article className="rounded-xl border border-cream-dark bg-white p-5 shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.status === 'resolved' ? 'green' : item.status === 'spam' ? 'red' : 'gold'}>{item.status.replace('_', ' ')}</Badge>
            <span className="font-mono text-xs text-muted">{item.reference}</span>
            <span className="text-xs text-muted">{formatDateTime(item.created_at)}</span>
          </div>
          <h3 className="font-display text-2xl font-bold text-deep mt-3">{item.subject}</h3>
          <p className="text-sm text-muted mt-1">{item.full_name} · <a className="text-green-700" href={`mailto:${item.email}`}>{item.email}</a>{item.phone ? ` · ${item.phone}` : ''}</p>
          <p className="text-[11px] font-700 uppercase tracking-wider text-muted mt-2">{item.category}</p>
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap rounded-xl bg-cream-dark p-4 text-sm text-deep">{item.message}</p>
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 mt-4">
        <Select label="Status" value={status} onChange={(value) => setStatus(value as ContactStatus)} options={['pending','in_progress','resolved','spam']} />
        <Textarea label="Internal notes" value={notes} onChange={setNotes} rows={3} />
      </div>
      <div className="mt-3 flex gap-3">
        <Button size="sm" loading={update.isPending} onClick={() => update.mutate()}>Save enquiry</Button>
        {isAdmin && <Button size="sm" variant="destructive" loading={remove.isPending} onClick={() => {
          if (window.confirm(`Delete enquiry ${item.reference}?`)) remove.mutate()
        }}>Delete</Button>}
      </div>
    </article>
  )
}

function GalleryAdminEditor({ item, onSaved }: { item: GalleryItem; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: item.title,
    description: item.description ?? '',
    category: item.category,
    event_date: item.event_date ?? '',
    sort_order: item.sort_order,
    is_published: item.is_published,
  })
  const save = useMutation({
    mutationFn: () => galleryApi.update(item.id, {
      ...form,
      description: form.description || null,
      event_date: form.event_date || null,
    }),
    onSuccess: onSaved,
  })
  const replace = useMutation({
    mutationFn: (file: File) => galleryApi.replaceImage(item.id, file),
    onSuccess: onSaved,
  })
  const remove = useMutation({ mutationFn: () => galleryApi.delete(item.id), onSuccess: onSaved })
  return (
    <div className="rounded-xl border border-cream-dark bg-white p-5 shadow-card">
      <div className="flex flex-col sm:flex-row gap-4">
        <img src={item.thumbnail_url ?? item.image_url} alt="" className="h-24 w-full sm:w-32 rounded-xl object-cover bg-cream-dark" />
        <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Title" value={form.title} onChange={(title) => setForm((old) => ({ ...old, title }))} required />
          <Select label="Category" value={form.category} onChange={(category) => setForm((old) => ({ ...old, category: category as GalleryCategory }))} options={['events','academic','health','outreach','social','welfare']} />
          <Field label="Event date" type="date" value={form.event_date} onChange={(event_date) => setForm((old) => ({ ...old, event_date }))} />
          <Field label="Display order" type="number" value={String(form.sort_order)} onChange={(sort_order) => setForm((old) => ({ ...old, sort_order: Number(sort_order) }))} />
          <div className="sm:col-span-2"><Textarea label="Description" value={form.description} onChange={(description) => setForm((old) => ({ ...old, description }))} /></div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Check label="Published" checked={form.is_published} onChange={(is_published) => setForm((old) => ({ ...old, is_published }))} />
        <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}>Save changes</Button>
        <label className="btn-sm btn-outline cursor-pointer">
          <Upload className="h-4 w-4" />Replace image
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) replace.mutate(file) }} />
        </label>
        <Button size="sm" variant="destructive" loading={remove.isPending} onClick={() => {
          if (window.confirm(`Delete “${item.title}”?`)) remove.mutate()
        }}>Delete</Button>
      </div>
    </div>
  )
}

export function AdminLeadershipPage() {
  const qc = useQueryClient()
  const { data: terms = [], isLoading } = useQuery({ queryKey: ['admin-leadership'], queryFn: leadershipApi.listAdmin })
  const [term, setTerm] = useState({ title: '', academic_year: '', theme: '', summary: '', is_current: false })
  const [leader, setLeader] = useState({ term_id: '', full_name: '', office: '', bio: '', email: '', phone: '', sort_order: 0 })
  const createTerm = useMutation({ mutationFn: () => leadershipApi.createTerm({ ...term, theme: term.theme || null, summary: term.summary || null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-leadership'] }); setTerm({ title: '', academic_year: '', theme: '', summary: '', is_current: false }) } })
  const createLeader = useMutation({ mutationFn: () => leadershipApi.createLeader({ ...leader, term_id: leader.term_id || terms[0]?.id, bio: leader.bio || null, email: leader.email || null, phone: leader.phone || null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-leadership'] }); setLeader((l) => ({ ...l, full_name: '', office: '', bio: '', email: '', phone: '' })) } })
  const uploadPhoto = useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => { const fd = new FormData(); fd.append('file', file); return leadershipApi.uploadLeaderPhoto(id, fd) }, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leadership'] }) })
  const deleteLeader = useMutation({ mutationFn: leadershipApi.deleteLeader, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leadership'] }) })
  const updateLeader = useMutation({ mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => leadershipApi.updateLeader(id, { is_active }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leadership'] }) })
  const deleteTerm = useMutation({ mutationFn: leadershipApi.deleteTerm, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leadership'] }) })
  const flatLeaders = terms.flatMap((t) => t.leaders.map((l) => ({ ...l, term: t })))
  return (
    <CrudPage title="Leadership" description="Maintain every administration, officer, office, contact, and real leader photo.">
      <CmsDocumentEditor slug="leadership" title="Leadership Page Settings" initialContent={leadershipPageDefaults} />
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
      <div className="mt-6 rounded-xl bg-white border border-cream-dark p-5 shadow-card">
        <h3 className="font-display text-2xl font-bold text-deep mb-3">Administration terms</h3>
        <AdminList isLoading={isLoading} items={terms} title={(t) => t.title} meta={(t) => `${t.academic_year} · ${t.is_current ? 'Current' : 'Archive'}`} actions={(t) => <Button size="sm" variant="destructive" disabled={t.is_current} onClick={() => deleteTerm.mutate(t.id)}>Delete</Button>} />
      </div>
      <AdminList isLoading={isLoading} items={flatLeaders} title={(l: Leader & { term: LeadershipTerm }) => l.full_name} meta={(l) => `${l.office} · ${l.term.academic_year} · ${l.is_active ? 'Active' : 'Hidden'}`} actions={(l) => <>
        <Button size="sm" variant="outline" onClick={() => updateLeader.mutate({ id: l.id, is_active: !l.is_active })}>{l.is_active ? 'Hide' : 'Activate'}</Button>
        <label className="btn-sm btn-outline cursor-pointer"><Upload className="h-4 w-4" />Photo<input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadPhoto.mutate({ id: l.id, file }) }} /></label>
        <Button size="sm" variant="destructive" onClick={() => deleteLeader.mutate(l.id)}>Delete</Button>
      </>} />
    </CrudPage>
  )
}

const legacyResources = ['administrations', 'achievements', 'timeline', 'categories', 'honourees', 'awards']

export function AdminLegacyPage() {
  const qc = useQueryClient()
  const [resource, setResource] = useState('administrations')
  const [draft, setDraft] = useState('{}')
  const [error, setError] = useState('')
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-legacy', resource],
    queryFn: () => legacyApi.listContent(resource),
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-legacy', resource] })
  const create = useMutation({
    mutationFn: () => legacyApi.createContent(resource, JSON.parse(draft)),
    onSuccess: () => { setDraft('{}'); setError(''); refresh() },
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to create content.'),
  })
  const del = useMutation({
    mutationFn: (id: string) => legacyApi.deleteContent(resource, id),
    onSuccess: refresh,
  })
  return (
    <>
      <AdminPageHeader title="Past Leadership CMS" description="Manage administrations, achievements, milestones, recognition and awards." />
      <CmsDocumentEditor
        slug="past-leadership"
        title="Past Leadership Page Settings"
        initialContent={{
          hero_eyebrow: 'PAST LEADERSHIP & RECOGNITION',
          hero_headline_primary: 'Leadership remembered.',
          hero_headline_secondary: 'Excellence recognised.',
          hero_supporting_text: 'Honouring the leaders, champions and achievers who have shaped GPSA-UDS.',
          hero_quote_text: "Good leadership isn't about position. It's about purpose, service and impact.",
          hero_quote_citation: 'Once Pharmily, Always Pharmily.',
          statistics: [],
        }}
      />
      <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card mb-5">
        <Select label="Collection" value={resource} onChange={setResource} options={legacyResources} />
        <div className="mt-4">
          <span className="form-label">New record</span>
          <StructuredContentEditor value={JSON.parse(draft)} onChange={(next) => setDraft(JSON.stringify(next, null, 2))} allowNewFields />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button loading={create.isPending} onClick={() => { try { JSON.parse(draft); create.mutate() } catch { setError('Record must be valid JSON.') } }}>Create record</Button>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      </div>
      <div className="space-y-4">
        {isLoading ? <Skeleton className="h-60 rounded-xl" /> : data.map((item) => (
          <LegacyItemEditor
            key={String(item.id)}
            resource={resource}
            item={item}
            onSaved={refresh}
            onDelete={() => del.mutate(String(item.id))}
          />
        ))}
        {!isLoading && !data.length && <EmptyState title="No records" description={`Create the first ${resource} record above.`} />}
      </div>
      <LegacyReviewQueues />
    </>
  )
}

function LegacyReviewQueues() {
  const qc = useQueryClient()
  const { data: submissions = [] } = useQuery({ queryKey: ['legacy-submissions'], queryFn: legacyApi.listSubmissions })
  const { data: nominations = [] } = useQuery({ queryKey: ['legacy-nominations'], queryFn: legacyApi.listNominations })
  const reviewSubmission = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => legacyApi.reviewSubmission(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legacy-submissions'] }),
  })
  const reviewNomination = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' | 'under_review' }) => legacyApi.reviewNomination(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legacy-nominations'] }),
  })
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-7">
      <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
        <h3 className="font-display text-2xl font-bold text-deep mb-3">Historical submissions</h3>
        <div className="space-y-3">
          {submissions.map((item) => <div key={String(item.id)} className="rounded-xl border border-cream-dark p-3">
            <p className="font-700 text-sm">{String(item.title)}</p>
            <p className="text-xs text-muted">{String(item.submitter_name)} · {String(item.status)}</p>
            {Boolean(item.file_url) && <a className="text-xs text-green-700 underline" href={String(item.file_url)} target="_blank" rel="noreferrer">Review attachment</a>}
            <div className="flex gap-2 mt-2"><Button size="sm" onClick={() => reviewSubmission.mutate({ id: String(item.id), status: 'accepted' })}>Accept</Button><Button size="sm" variant="destructive" onClick={() => reviewSubmission.mutate({ id: String(item.id), status: 'rejected' })}>Reject</Button></div>
          </div>)}
          {!submissions.length && <p className="text-sm text-muted">No submissions awaiting review.</p>}
        </div>
      </div>
      <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
        <h3 className="font-display text-2xl font-bold text-deep mb-3">Leader nominations</h3>
        <div className="space-y-3">
          {nominations.map((item) => <div key={String(item.id)} className="rounded-xl border border-cream-dark p-3">
            <p className="font-700 text-sm">{String(item.nominee_name)}</p>
            <p className="text-xs text-muted">{String(item.nominator_name)} · {String(item.status)}</p>
            <div className="flex gap-2 mt-2"><Button size="sm" onClick={() => reviewNomination.mutate({ id: String(item.id), status: 'approved' })}>Approve</Button><Button size="sm" variant="outline" onClick={() => reviewNomination.mutate({ id: String(item.id), status: 'under_review' })}>Review</Button><Button size="sm" variant="destructive" onClick={() => reviewNomination.mutate({ id: String(item.id), status: 'rejected' })}>Reject</Button></div>
          </div>)}
          {!nominations.length && <p className="text-sm text-muted">No nominations awaiting review.</p>}
        </div>
      </div>
    </div>
  )
}

function CmsDocumentEditor({ slug, title, initialContent }: {
  slug: string
  title: string
  initialContent: Record<string, unknown>
}) {
  const qc = useQueryClient()
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
  const { data } = useQuery({ queryKey: ['cms-page', slug], queryFn: () => cmsApi.getPage(slug), retry: false })
  const [value, setValue] = useState(JSON.stringify(initialContent, null, 2))
  const [published, setPublished] = useState(true)
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const parsedSettings = (() => {
    try { return JSON.parse(value) as Record<string, unknown> }
    catch { return initialContent }
  })()
  useEffect(() => {
    if (data) {
      // A newly provisioned page has empty content so the public endpoint is
      // immediately available. Keep the reviewed defaults in the editor until
      // an administrator has saved custom content.
      if (Object.keys(data.content).length > 0) {
        setValue(JSON.stringify(data.content, null, 2))
      }
      setPublished(data.is_published)
    }
  }, [data])
  const save = useMutation({
    mutationFn: () => cmsApi.updatePage(slug, {
      title,
      content: JSON.parse(value),
      is_published: published,
      expected_version: data?.version,
    }),
    onSuccess: () => {
      setError('')
      qc.invalidateQueries({ queryKey: ['cms-page', slug] })
      qc.invalidateQueries({ queryKey: ['cms-page-public', slug] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to save settings.'),
  })
  const remove = useMutation({
    mutationFn: () => cmsApi.deletePage(slug),
    onSuccess: () => {
      setValue(JSON.stringify(initialContent, null, 2))
      setPublished(false)
      qc.invalidateQueries({ queryKey: ['cms-page', slug] })
      qc.invalidateQueries({ queryKey: ['cms-page-public', slug] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to delete settings.'),
  })
  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-cream-dark bg-white shadow-card">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-cream/50"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <Settings2 className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-800 text-deep">{title}</span>
          <span className="block text-xs text-muted">Page copy, labels and publishing controls</span>
        </span>
        <Badge variant={published ? 'green' : 'gray'}>{published ? 'Published' : 'Hidden'}</Badge>
        <ChevronDown className={`h-5 w-5 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="border-t border-cream-dark bg-cream/20 p-5">
          <StructuredContentEditor
            value={parsedSettings}
            onChange={(nextValue) => setValue(JSON.stringify(nextValue, null, 2))}
          />
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-cream-dark pt-4">
            <Check label="Published" checked={published} onChange={setPublished} />
            <Button size="sm" loading={save.isPending} onClick={() => { try { JSON.parse(value); save.mutate() } catch { setError('Settings must be valid JSON.') } }}>Save changes</Button>
            {isAdmin && data && (
              <Button
                size="sm"
                variant="destructive"
                loading={remove.isPending}
                onClick={() => {
                  if (window.confirm(`Delete ${title}? The public page will use its safe defaults until settings are saved again.`)) {
                    remove.mutate()
                  }
                }}
              >
                Reset settings
              </Button>
            )}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function LegacyItemEditor({ resource, item, onSaved, onDelete }: {
  resource: string
  item: Record<string, unknown>
  onSaved: () => void
  onDelete: () => void
}) {
  const editable = Object.fromEntries(Object.entries(item).filter(([key]) => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(key)))
  const [value, setValue] = useState(JSON.stringify(editable, null, 2))
  const [error, setError] = useState('')
  const update = useMutation({
    mutationFn: () => legacyApi.updateContent(resource, String(item.id), JSON.parse(value)),
    onSuccess: () => { setError(''); onSaved() },
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to update record.'),
  })
  return (
    <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
      <StructuredContentEditor value={JSON.parse(value)} onChange={(next) => setValue(JSON.stringify(next, null, 2))} />
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" loading={update.isPending} onClick={() => { try { JSON.parse(value); update.mutate() } catch { setError('Record must be valid JSON.') } }}>Save</Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    </div>
  )
}

const impactResources = ['periods', 'priorities', 'metrics', 'focus-areas', 'initiatives', 'sdg-goals', 'sdg-alignments', 'reports']

export function AdminImpactPage() {
  const qc = useQueryClient()
  const [resource, setResource] = useState('periods')
  const [draft, setDraft] = useState('{}')
  const [error, setError] = useState('')
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-impact', resource], queryFn: () => impactApi.listAdmin(resource) })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-impact', resource] })
  const create = useMutation({
    mutationFn: () => impactApi.create(resource, JSON.parse(draft)),
    onSuccess: () => { setDraft('{}'); setError(''); refresh(); qc.invalidateQueries({ queryKey: ['impact-page'] }) },
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to create impact content.'),
  })
  const del = useMutation({ mutationFn: (id: string) => impactApi.delete(resource, id), onSuccess: refresh })
  return (
    <>
      <AdminPageHeader title="Impact & Strategic Priorities" description="Manage verified reporting periods, priorities, metrics, initiatives, SDG evidence and reports." />
      <CmsDocumentEditor slug="impact" title="Impact Page Settings" initialContent={{
        hero_eyebrow: 'IMPACT & STRATEGIC PRIORITIES',
        hero_title_primary: 'Creating impact.',
        hero_title_secondary: 'Shaping the future.',
        hero_intro: 'GPSA-UDS advances pharmacy education, student welfare, leadership, research, professional development, community health and responsible partnerships.',
        commitment_title: 'Our Commitment',
        commitment_description: 'To develop competent pharmacists, foster leadership, promote research and serve our communities.',
        vision_quote: 'Our vision is a future where every pharmacist is a leader, every community is healthier, and pharmacy practice continues to transform lives.',
        vision_signature: 'Once Pharmily, Always Pharmily.',
        cta_title: 'Be part of the change.',
        cta_description: 'Together, we can build a healthier future.',
      }} />
      <div className="mb-5 rounded-xl border border-cream-dark bg-white p-5 shadow-card">
        <h3 className="font-display text-2xl font-bold text-deep">Hero media</h3>
        <p className="mt-1 text-sm text-muted">Save page settings first, then upload a verified institutional image.</p>
        <label className="btn-sm btn-outline mt-3 cursor-pointer"><Upload className="h-4 w-4" />Upload hero image<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) impactApi.uploadHeroImage(file).then(() => qc.invalidateQueries({ queryKey: ['cms-page', 'impact'] })) }} /></label>
      </div>
      <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card mb-5">
        <Select label="Impact collection" value={resource} onChange={setResource} options={impactResources} />
        <div className="mt-4"><span className="form-label">New record</span><StructuredContentEditor value={JSON.parse(draft)} onChange={(next) => setDraft(JSON.stringify(next, null, 2))} allowNewFields /></div>
        <div className="mt-3 flex items-center gap-3"><Button loading={create.isPending} onClick={() => { try { JSON.parse(draft); create.mutate() } catch { setError('Record must be valid JSON.') } }}>Create record</Button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div>
      </div>
      <div className="space-y-4">
        {isLoading ? <Skeleton className="h-60 rounded-xl" /> : data.map((item) => <ImpactItemEditor key={String(item.id)} resource={resource} item={item} onSaved={refresh} onDelete={() => del.mutate(String(item.id))} />)}
        {!isLoading && !data.length && <EmptyState title="No impact records" description={`Create the first ${resource} record when verified information is available.`} />}
      </div>
    </>
  )
}

function ImpactItemEditor({ resource, item, onSaved, onDelete }: { resource: string; item: Record<string, unknown>; onSaved: () => void; onDelete: () => void }) {
  const editable = Object.fromEntries(Object.entries(item).filter(([key]) => !['id', 'created_at', 'updated_at', 'deleted_at', 'file_key', 'image_key'].includes(key)))
  const [value, setValue] = useState(JSON.stringify(editable, null, 2))
  const [error, setError] = useState('')
  const update = useMutation({ mutationFn: () => impactApi.update(resource, String(item.id), JSON.parse(value)), onSuccess: () => { setError(''); onSaved() }, onError: (err) => setError(err instanceof Error ? err.message : 'Unable to save record.') })
  return <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
    <StructuredContentEditor value={JSON.parse(value)} onChange={(next) => setValue(JSON.stringify(next, null, 2))} />
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Button size="sm" loading={update.isPending} onClick={() => { try { JSON.parse(value); update.mutate() } catch { setError('Record must be valid JSON.') } }}>Save</Button>
      {resource === 'focus-areas' && <label className="btn-sm btn-outline cursor-pointer"><Upload className="h-4 w-4" />Image<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) impactApi.uploadFocusImage(String(item.id), file).then(onSaved) }} /></label>}
      {resource === 'initiatives' && <label className="btn-sm btn-outline cursor-pointer"><Upload className="h-4 w-4" />Image<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) impactApi.uploadInitiativeImage(String(item.id), file).then(onSaved) }} /></label>}
      {resource === 'reports' && <label className="btn-sm btn-outline cursor-pointer"><Upload className="h-4 w-4" />Report<input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) impactApi.uploadReport(String(item.id), file).then(onSaved) }} /></label>}
      <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  </div>
}

const governanceResources = ['categories', 'documents', 'faq-categories', 'faqs', 'versions']

export function AdminGovernancePage() {
  const qc = useQueryClient()
  const [resource, setResource] = useState('categories')
  const [draft, setDraft] = useState('{}')
  const [error, setError] = useState('')
  const { data = [], isLoading } = useQuery({ queryKey: ['admin-governance', resource], queryFn: () => governanceApi.listAdmin(resource) })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-governance', resource] })
    qc.invalidateQueries({ queryKey: ['governance-page'] })
  }
  const create = useMutation({
    mutationFn: () => governanceApi.create(resource, JSON.parse(draft)),
    onSuccess: () => { setDraft('{}'); setError(''); refresh() },
    onError: (err) => setError(err instanceof Error ? err.message : 'Unable to create governance content.'),
  })
  const del = useMutation({ mutationFn: (id: string) => governanceApi.delete(resource, id), onSuccess: refresh })
  return <>
    <AdminPageHeader title="Documents & FAQs" description="Manage page copy, dynamic categories, secure document records and versions, publishing controls, and verified FAQ answers." />
    <CmsDocumentEditor slug="governance" title="Documents & FAQs Page Settings" initialContent={{
      hero_eyebrow: 'DOCUMENTS & FAQS',
      hero_title_primary: 'Knowledge today.',
      hero_title_secondary: 'Stronger legacy tomorrow.',
      hero_intro: 'Access approved GPSA-UDS documents, policies, reports, plans, forms and answers to common questions.',
      resource_card_title: 'Essential Resources',
      resource_card_subtitle: 'All in One Place',
      resource_card_description: 'Transparent. Organised. Accessible.',
      faq_quote: 'Information empowers. Guidelines guide. Legacy endures.',
      cta_title: 'Be part of the legacy.',
      cta_description: 'Access resources. Stay informed. Make an impact.',
    }} />
    <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card mb-5">
      <Select label="Content collection" value={resource} onChange={setResource} options={governanceResources} />
      {resource !== 'versions' && <><div className="mt-4"><span className="form-label">New record</span><StructuredContentEditor value={JSON.parse(draft)} onChange={(next) => setDraft(JSON.stringify(next, null, 2))} allowNewFields /></div>
      <div className="mt-3 flex items-center gap-3"><Button loading={create.isPending} onClick={() => { try { JSON.parse(draft); create.mutate() } catch { setError('Record must be valid JSON.') } }}>Create draft</Button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div></>}
      {resource === 'versions' && <p className="mt-4 text-sm text-muted">Versions are created from a document record using its secure upload control.</p>}
    </div>
    <div className="space-y-4">
      {isLoading ? <Skeleton className="h-60 rounded-xl" /> : data.map((item) => <GovernanceItemEditor key={String(item.id)} resource={resource} item={item} onSaved={refresh} onDelete={() => del.mutate(String(item.id))} />)}
      {!isLoading && !data.length && <EmptyState title="No records yet" description="Create verified content when official information is available." />}
    </div>
  </>
}

function GovernanceItemEditor({ resource, item, onSaved, onDelete }: { resource: string; item: Record<string, unknown>; onSaved: () => void; onDelete: () => void }) {
  const editable = Object.fromEntries(Object.entries(item).filter(([key]) => !['id', 'created_at', 'updated_at', 'deleted_at', 'file_key', 'checksum', 'file_name', 'mime_type', 'file_extension', 'file_size_bytes'].includes(key)))
  const [value, setValue] = useState(JSON.stringify(editable, null, 2))
  const [version, setVersion] = useState(String(item.version || '1.0'))
  const [error, setError] = useState('')
  const update = useMutation({ mutationFn: () => governanceApi.update(resource, String(item.id), JSON.parse(value)), onSuccess: () => { setError(''); onSaved() }, onError: (err) => setError(err instanceof Error ? err.message : 'Unable to save record.') })
  if (resource === 'versions') return <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card"><p className="font-bold text-deep">{String(item.file_name)}</p><p className="text-sm text-muted">Version {String(item.version)} · {String(item.status)} {item.is_current ? '· Current' : ''}</p></div>
  return <div className="rounded-xl bg-white border border-cream-dark p-5 shadow-card">
    <StructuredContentEditor value={JSON.parse(value)} onChange={(next) => setValue(JSON.stringify(next, null, 2))} />
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <Button size="sm" loading={update.isPending} onClick={() => { try { JSON.parse(value); update.mutate() } catch { setError('Record must be valid JSON.') } }}>Save</Button>
      {resource === 'documents' && <><label><span className="form-label">Upload version</span><input className="form-input w-28" value={version} onChange={(e) => setVersion(e.target.value)} /></label><label className="btn-sm btn-outline cursor-pointer"><Upload className="h-4 w-4" />Upload file<input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file && version.trim()) governanceApi.uploadDocument(String(item.id), version.trim(), file).then(onSaved).catch((err) => setError(err instanceof Error ? err.message : 'Upload failed.')) }} /></label></>}
      <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  </div>
}

export function AdminAcademicsPage() {
  const qc = useQueryClient()
  const { data: courses = [] } = useQuery({ queryKey: ['admin-courses'], queryFn: () => academicsApi.listCourses() })
  const { data, isLoading } = useQuery({ queryKey: ['admin-resources'], queryFn: () => academicsApi.listAllResources({ limit: 100 }) })
  return <><CmsDocumentEditor slug="academics" title="Academics Page Settings" initialContent={academicsPageDefaults} /><CrudPage title="Academics" description="Review resources and use the public upload flow for new resources."><InfoPanel title="Resource workflow" items={['Exec/admin uploads are supported', 'Admin can publish reviewed resources', 'Course management exists through API']} /><AdminList isLoading={isLoading} items={data?.items ?? []} title={(r) => r.title} meta={(r) => `${r.content_type} · Level ${r.level} · ${r.is_published ? 'Published' : 'Pending'}`} actions={(r) => !r.is_published ? <Button size="sm" variant="outline" onClick={() => academicsApi.publishResource(r.id).then(() => qc.invalidateQueries({ queryKey: ['admin-resources'] }))}>Publish</Button> : <CheckCircle2 className="h-5 w-5 text-green-700" />} /><p className="text-sm text-muted mt-4">{courses.length} courses configured.</p></CrudPage></>
}

export function AdminWelfarePage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-welfare'], queryFn: () => welfareApi.listReports({ limit: 100 }) })
  const resolve = useMutation({ mutationFn: ({ id, status }: { id: string; status: ReportStatus }) => welfareApi.resolveReport(id, { status, admin_notes: 'Updated from admin dashboard.' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-welfare'] }) })
  return <><CmsDocumentEditor slug="welfare" title="Welfare Page Settings" initialContent={welfarePageDefaults} /><CrudPage title="Welfare" description="Review welfare reports and move them through the resolution workflow."><AdminList isLoading={isLoading} items={data?.items ?? []} title={(r) => r.is_anonymous ? 'Anonymous report' : r.name ?? 'Student report'} meta={(r) => `${r.category} · ${r.report_type} · ${r.status}`} actions={(r) => <><Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: r.id, status: 'in_review' })}>Review</Button><Button size="sm" onClick={() => resolve.mutate({ id: r.id, status: 'resolved' })}>Resolve</Button></>} /></CrudPage></>
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

const longTextKey = /(body|bio|content|description|detail|intro|message|notes|quote|summary|text|answer)/i

function humanizeField(key: string) {
  return key.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function StructuredContentEditor({
  value,
  onChange,
  allowNewFields = false,
}: {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
  allowNewFields?: boolean
}) {
  const [newField, setNewField] = useState('')
  const entries = Object.entries(value)
  return (
    <div className="rounded-xl border border-cream-dark bg-cream/30 p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {entries.map(([key, fieldValue]) => (
          <StructuredField
            key={key}
            fieldKey={key}
            value={fieldValue}
            onChange={(next) => onChange({ ...value, [key]: next })}
            onRemove={allowNewFields ? () => {
              const next = { ...value }
              delete next[key]
              onChange(next)
            } : undefined}
          />
        ))}
      </div>
      {!entries.length && <p className="text-sm text-muted">Add the first field to build this record.</p>}
      {allowNewFields && (
        <div className="mt-4 flex flex-col gap-2 border-t border-cream-dark pt-4 sm:flex-row">
          <input
            className="form-input"
            aria-label="New field name"
            placeholder="Field name, for example title"
            value={newField}
            onChange={(event) => setNewField(event.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!newField.trim()}
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              const key = newField.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
              if (key && !(key in value)) onChange({ ...value, [key]: '' })
              setNewField('')
            }}
          >
            Add field
          </Button>
        </div>
      )}
    </div>
  )
}

function StructuredField({
  fieldKey,
  value,
  onChange,
  onRemove,
}: {
  fieldKey: string
  value: unknown
  onChange: (value: unknown) => void
  onRemove?: () => void
}) {
  const heading = (
    <span className="flex items-center justify-between gap-2">
      <span className="form-label mb-0">{humanizeField(fieldKey)}</span>
      {onRemove && <button type="button" className="text-xs font-700 text-red-700 hover:underline" onClick={onRemove}>Remove</button>}
    </span>
  )
  if (Array.isArray(value)) {
    return (
      <div className="md:col-span-2 rounded-xl border border-cream-dark bg-white p-4">
        {heading}
        <div className="mt-3 space-y-3">
          {value.map((item, index) => (
            <div key={index} className="rounded-lg border border-cream-dark bg-cream/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-700 text-muted">Item {index + 1}</span>
                <button type="button" className="text-xs font-700 text-red-700 hover:underline" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
              </div>
              {item !== null && typeof item === 'object' && !Array.isArray(item)
                ? <StructuredContentEditor value={item as Record<string, unknown>} onChange={(next) => onChange(value.map((old, itemIndex) => itemIndex === index ? next : old))} allowNewFields />
                : <input className="form-input" value={String(item ?? '')} onChange={(event) => onChange(value.map((old, itemIndex) => itemIndex === index ? event.target.value : old))} />}
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onChange([...value, value[0] && typeof value[0] === 'object' ? {} : ''])}>Add item</Button>
        </div>
      </div>
    )
  }
  if (value !== null && typeof value === 'object') {
    return <div className="md:col-span-2">{heading}<StructuredContentEditor value={value as Record<string, unknown>} onChange={onChange} allowNewFields /></div>
  }
  if (typeof value === 'boolean') {
    return <div>{heading}<label className="mt-2 flex items-center gap-3 text-sm text-deep"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} /> Enabled</label></div>
  }
  if (typeof value === 'number') {
    return <label>{heading}<input className="form-input" type="number" value={value} onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))} /></label>
  }
  const isLong = longTextKey.test(fieldKey) || String(value ?? '').length > 100
  if (isLong) {
    return <RichTextEditor label={humanizeField(fieldKey)} value={String(value ?? '')} onChange={onChange} />
  }
  return (
    <label>
      {heading}
      <input className="form-input" value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function CrudPage({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const childArray = Array.isArray(children) ? children : [children]
  const hasCreateView = childArray.length === 2
  const [view, setView] = useState<'content' | 'create'>('content')
  return (
    <>
      <AdminPageHeader
        title={title}
        description={description}
        action={hasCreateView ? (
          view === 'content'
            ? <Button onClick={() => setView('create')} leftIcon={<Plus className="h-4 w-4" />}>Add new</Button>
            : <Button variant="outline" onClick={() => setView('content')} leftIcon={<X className="h-4 w-4" />}>Close form</Button>
        ) : undefined}
      />
      {hasCreateView ? (
        view === 'create' ? (
          <section className="mx-auto w-full max-w-3xl">
            <div className="mb-4 px-1">
              <p className="text-xs font-800 uppercase tracking-[0.16em] text-green-700">Create</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-deep">Add new {title.toLowerCase().replace(/s$/, '')}</h2>
              <p className="mt-1 text-sm text-muted">Complete the details below, then save when ready.</p>
            </div>
            {childArray[0]}
          </section>
        ) : <div className="min-w-0">{childArray[1]}</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr] xl:items-start">{childArray}</div>
      )}
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
  return <RichTextEditor label={text} value={value} onChange={onChange} required={required} minHeight={`${Math.max(rows, 4) * 1.5}rem`} />
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
