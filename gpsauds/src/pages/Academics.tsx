import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search, Download, Eye, Star, ChevronLeft, ChevronRight,
  Upload, BookOpen, Film, FileText, Beaker, Globe, SlidersHorizontal, X, ArrowLeft, AlertCircle, CheckCircle,
} from 'lucide-react'
import { academicsApi } from '@/api/services'
import { extractError } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { cn, TRIMESTER_LABELS, formatFileSize, CONTENT_TYPE_LABELS } from '@/utils'
import type { AcademicResource, ContentType, Trimester, Course } from '@/types'
import { useCmsPageSettings } from '@/hooks/useCmsPageSettings'
import { academicsPageDefaults } from '@/config/cmsPageDefaults'

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTENT_TABS: { value: ContentType | 'all'; label: string; emoji: string }[] = [
  { value: 'all',             label: 'All Resources',   emoji: '📂' },
  { value: 'exam_questions',  label: 'Exam Questions',  emoji: '📄' },
  { value: 'lecture_slides',  label: 'Lecture Slides',  emoji: '📊' },
  { value: 'tutorial_videos', label: 'Tutorial Videos', emoji: '🎥' },
  { value: 'lab_reports',     label: 'Lab Reports',     emoji: '🧪' },
  { value: 'field_materials', label: 'Field Materials', emoji: '🌍' },
]

const VISUAL_TYPE: Record<string, { icon: typeof BookOpen; bg: string }> = {
  exam_questions:  { icon: FileText, bg: 'bg-amber-50' },
  lecture_slides:  { icon: BookOpen, bg: 'bg-sky-50' },
  tutorial_videos: { icon: Film,     bg: 'bg-purple-50' },
  lab_reports:     { icon: Beaker,  bg: 'bg-emerald-50' },
  field_materials: { icon: Globe,   bg: 'bg-orange-50' },
}

const PAGE_SIZE = 10

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest' },
  { value: 'level',      label: 'Level' },
  { value: 'title',      label: 'Title A–Z' },
  { value: 'file_size',  label: 'File Size' },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function ResourceIcon({ content_type, className }: { content_type: string; className?: string }) {
  const entry = VISUAL_TYPE[content_type]
  if (!entry) return <span className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-cream-dark', className)}>📁</span>
  const Icon = entry.icon
  return (
    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', entry.bg, className)}>
      <Icon className="h-5 w-5" style={{ color: 'var(--green-bright-old)' }} />
    </div>
  )
}

function ResourceCardSkeleton() {
  return (
    <div className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  )
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbs = [
  { label: 'Home', path: '/' },
  { label: 'Academics', path: '/academics' },
]

function Breadcrumbs() {
  const navigate = useNavigate()
  return (
    <nav className="section-container pt-6 pb-0">
      <ol className="flex items-center gap-2 text-xs text-muted font-500">
        {breadcrumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-2">
            {i > 0 && <span className="text-cream-darker">/</span>}
            <button
              onClick={() => navigate(crumb.path)}
              className={cn(
                'hover:text-green-700 transition-colors',
                i === breadcrumbs.length - 1 && 'text-green-700 font-700',
              )}
            >
              {crumb.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// ── Featured banner ───────────────────────────────────────────────────────────

function FeaturedBanner() {
  const navigate = useNavigate()
  const { settings } = useCmsPageSettings('academics', academicsPageDefaults)
  const { data, isLoading } = useQuery({
    queryKey: ['academic-resources', 'featured'],
    queryFn: () => academicsApi.listResources({ is_featured: true, limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
    staleTime: 5 * 60 * 1000,
  })

  const items = data?.items ?? []
  if (isLoading) return null
  if (!items.length) return null

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
        <h2 className="font-display text-xl font-bold text-green-800">{settings.featured_title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.slice(0, 5).map((r) => {
          const entry = VISUAL_TYPE[r.content_type] ?? VISUAL_TYPE.exam_questions
          const Icon = entry.icon
          return (
            <button
              key={r.id}
              onClick={() => navigate(`/academics/${r.id}`)}
              className={cn(
                'group relative rounded-2xl p-5 text-left overflow-hidden transition-all duration-300',
                'border border-cream-dark bg-white hover:-translate-y-1 hover:shadow-lg',
              )}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', entry.bg)}>
                <Icon className="h-5 w-5" style={{ color: 'var(--green-bright-old)' }} />
              </div>
              <h3 className="font-body font-700 text-sm text-deep leading-snug line-clamp-2 mb-1.5 group-hover:text-green-700 transition-colors">
                {r.title}
              </h3>
              <p className="text-[11px] text-muted">{r.course?.name ?? `Level ${r.level}`}</p>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="gold" className="text-[10px] px-2 py-0.5">
                  <Star className="h-2.5 w-2.5 fill-current" />
                </Badge>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function AcademicsPage() {
  const navigate = useNavigate()
  const { settings } = useCmsPageSettings('academics', academicsPageDefaults)
  const { user } = useAuthStore()
  const canUpload = user && (user.role === 'exec' || user.role === 'admin')

  const [level, setLevel]         = useState<number | 'all'>('all')
  const [trimester, setTrimester] = useState<Trimester | 'all'>('all')
  const [contentType, setContentType] = useState<ContentType | 'all'>('all')
  const [courseId, setCourseId]    = useState<string | 'all'>('all')
  const [search, setSearch]       = useState('')
  const [sortBy, setSortBy]       = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<string>('desc')
  const [page, setPage]           = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const resetPage = () => setPage(1)

  const queryParams = {
    level:        level !== 'all' ? level : undefined,
    trimester:    trimester !== 'all' ? trimester : undefined,
    content_type: contentType !== 'all' ? contentType : undefined,
    course_id:    courseId !== 'all' ? courseId : undefined,
    search:       search || undefined,
    sort_by:      sortBy as 'title' | 'level' | 'created_at' | 'file_size' | undefined,
    sort_order:   sortOrder as 'asc' | 'desc' | undefined,
    offset:       (page - 1) * PAGE_SIZE,
    limit:        PAGE_SIZE,
  }

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['academic-resources', queryParams],
    queryFn: () => academicsApi.listResources(queryParams),
    staleTime: 2 * 60 * 1000,
  })

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => academicsApi.listCourses(level !== 'all' ? level : undefined),
    staleTime: 10 * 60 * 1000,
  })

  const courses: Course[] = Array.isArray(coursesData) ? coursesData : []
  const totalResults = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const items = data?.items ?? []

  function handleSortChange(value: string) {
    const option = SORT_OPTIONS.find((o) => o.value === value)
    if (!option) return
    setSortBy(value)
    setSortOrder('desc')
    resetPage()
  }

  return (
    <>
      <Breadcrumbs />
      <PageHeader
        title={settings.page_title}
        subtitle={settings.page_subtitle}
      >
        {canUpload && (
          <Button
            variant="gold"
            size="md"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => navigate('/academics/upload')}
          >
            {settings.upload_button_label}
          </Button>
        )}
      </PageHeader>

      <div className="section-container section-padding">

        {/* ── Featured ── */}
        <FeaturedBanner />

        {/* ── Filters row ── */}
        <div className="mb-8 space-y-3">

          {/* Always-visible row: Search + Resource type + toggle */}
          <div className="flex flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage() }}
                placeholder={settings.search_placeholder}
                className="form-input pl-11"
              />
            </div>

            <div className="relative hidden sm:block">
              <select
                value={contentType}
                onChange={(e) => { setContentType(e.target.value as ContentType | 'all'); resetPage() }}
                className="form-select pr-10 min-w-[180px]"
              >
                {CONTENT_TABS.map(({ value, label, emoji }) => (
                  <option key={value} value={value}>{emoji} {label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-600 border border-cream-dark bg-white text-muted hover:border-green-300 hover:text-green-700 transition-all"
            >
              {showFilters ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
              Filters
            </button>
          </div>

          {/* Collapsible extra filters — always visible on sm+, toggle on mobile */}
          <div className={cn('flex flex-col sm:flex-row gap-3', showFilters ? 'block' : 'hidden sm:flex')}>

            {/* Resource type (mobile only — hidden on sm+ since it's in the top row) */}
            <div className="relative sm:hidden">
              <select
                value={contentType}
                onChange={(e) => { setContentType(e.target.value as ContentType | 'all'); resetPage() }}
                className="form-select pr-10 w-full"
              >
                {CONTENT_TABS.map(({ value, label, emoji }) => (
                  <option key={value} value={value}>{emoji} {label}</option>
                ))}
              </select>
            </div>

            {/* Course dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={courseId}
                onChange={(e) => { setCourseId(e.target.value as string | 'all'); resetPage() }}
                className="form-select pr-10 w-full sm:min-w-[180px]"
              >
                <option value="all">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.code ? `(${c.code})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Level dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={String(level)}
                onChange={(e) => { setLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setCourseId('all'); resetPage() }}
                className="form-select pr-10 w-full sm:min-w-[130px]"
              >
                <option value="all">All Levels</option>
                {[100, 200, 300, 400, 500, 600].map((l) => (
                  <option key={l} value={l}>Level {l}</option>
                ))}
              </select>
            </div>

            {/* Trimester dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={trimester}
                onChange={(e) => { setTrimester(e.target.value as Trimester | 'all'); resetPage() }}
                className="form-select pr-10 w-full sm:min-w-[150px]"
              >
                <option value="all">All Trimesters</option>
                <option value="first">1st Trimester</option>
                <option value="second">2nd Trimester</option>
                <option value="third">3rd Trimester</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="form-select pr-10 w-full sm:min-w-[140px]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Loading state ── */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <ResourceCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <EmptyState
            icon="⚠️"
            title="Failed to load resources"
            description="Something went wrong. Please try again."
            action={
              <Button variant="primary" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        ) : !items.length ? (
          <EmptyState
            icon="📭"
            title={settings.empty_title}
            description={settings.empty_description}
          />
        ) : (
          <>
            {/* ── Top loading bar during background refetch ── */}
            {isFetching && (
              <div className="h-1 rounded-full bg-cream-dark overflow-hidden mb-4">
                <div className="h-full w-1/3 bg-green-gradient rounded-full animate-pulse" />
              </div>
            )}

            {/* ── Results summary ── */}
            <p className="text-xs text-muted mb-4 font-500">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, totalResults)} of {totalResults} resources
            </p>

            {/* ── Resource cards ── */}
            <div className="space-y-3">
              {items.map((resource) => (
                <div
                  key={resource.id}
                  className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-card-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => navigate(`/academics/${resource.id}`)}
                >
                  {resource.thumbnail_url ? (
                    <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl bg-cream-dark sm:w-28">
                      <img src={resource.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                    </div>
                  ) : <ResourceIcon content_type={resource.content_type} />}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <Badge variant="green">Level {resource.level}</Badge>
                      <Badge variant="blue">{TRIMESTER_LABELS[resource.trimester]}</Badge>
                      <Badge variant="gray">{resource.file_type.toUpperCase()}</Badge>
                      <Badge variant="green" className="bg-green-100 text-green-800 border-green-200">
                        {CONTENT_TYPE_LABELS[resource.content_type] ?? resource.content_type}
                      </Badge>
                      {resource.is_featured && (
                        <Badge variant="gold">
                          <Star className="h-2.5 w-2.5 fill-current" /> Best Sample
                        </Badge>
                      )}
                    </div>
                    <p className="font-body font-700 text-deep leading-tight">{resource.title}</p>
                    <p className="text-xs text-muted mt-1">
                      {resource.course?.name ?? '—'} · {formatFileSize(resource.file_size_bytes)}
                      {resource.duration_mins && ` · ${resource.duration_mins} min`}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {resource.download_url && (
                      <>
                        <a
                          href={resource.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-sm btn-outline flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </a>
                        <a
                          href={resource.download_url}
                          download
                          className="btn-sm btn-primary flex items-center gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="mt-10">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    disabled={safePage === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-600 border border-cream-dark bg-white text-secondary hover:border-green-300 hover:text-green-700 disabled:opacity-60 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                      const show = n === 1 || n === totalPages || Math.abs(n - safePage) <= 1
                      const ellipsisBefore = n === safePage - 2 && safePage > 4
                      const ellipsisAfter  = n === safePage + 2 && safePage < totalPages - 3
                      if (ellipsisBefore || ellipsisAfter) {
                        return <span key={n} className="px-1 py-2 text-muted text-sm self-end">…</span>
                      }
                      if (!show) return null
                      return (
                        <button
                          key={n}
                          onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                          className={cn(
                            'w-9 h-9 rounded-xl text-sm font-600 transition-all',
                            n === safePage
                              ? 'bg-green-gradient text-white'
                              : 'border border-cream-dark bg-white text-muted hover:border-green-300 hover:text-green-700',
                          )}
                        >
                          {n}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    disabled={safePage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-600 border border-cream-dark bg-white text-secondary hover:border-green-300 hover:text-green-700 disabled:opacity-60 disabled:pointer-events-none transition-all"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-center text-xs text-muted mt-3">
                  Page {safePage} of {totalPages}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ── Resource detail ───────────────────────────────────────────────────────────

export function AcademicResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: resource, isLoading, isError, refetch } = useQuery({
    queryKey: ['academic-resources', id],
    queryFn: () => academicsApi.getResource(id!),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return (
      <>
        <Breadcrumbs />
        <div className="section-container section-padding">
          <ResourceCardSkeleton />
        </div>
      </>
    )
  }

  if (isError || !resource) {
    return (
      <>
        <Breadcrumbs />
        <EmptyState
          icon="📚"
          title="Resource not found"
          description="The resource may have been removed or is no longer published."
          action={<Button variant="primary" size="sm" onClick={() => refetch()}>Retry</Button>}
        />
      </>
    )
  }

  return (
    <>
      <Breadcrumbs />
      <PageHeader title={resource.title} subtitle={resource.course?.name ?? `Level ${resource.level} resource`}>
        <Button variant="outline-white" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/academics')}>
          Back to Resources
        </Button>
      </PageHeader>

      <div className="section-container section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-6">
              <ResourceIcon content_type={resource.content_type} className="w-14 h-14" />
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="green">Level {resource.level}</Badge>
                  <Badge variant="blue">{TRIMESTER_LABELS[resource.trimester]}</Badge>
                  <Badge variant="gray">{resource.file_type.toUpperCase()}</Badge>
                  {resource.is_featured && <Badge variant="gold">Best Sample</Badge>}
                </div>
                <h2 className="font-display text-2xl font-bold text-deep leading-tight">{resource.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <DetailItem label="Course" value={resource.course?.name ?? 'Unassigned'} />
              <DetailItem label="Resource Type" value={CONTENT_TYPE_LABELS[resource.content_type] ?? resource.content_type} />
              <DetailItem label="Trimester" value={TRIMESTER_LABELS[resource.trimester]} />
              <DetailItem label="File Size" value={formatFileSize(resource.file_size_bytes)} />
              {resource.duration_mins && <DetailItem label="Duration" value={`${resource.duration_mins} min`} />}
            </div>
          </div>

          <div className="card p-6 h-fit">
            <h3 className="font-display text-xl font-bold text-green-700 mb-4">Access Resource</h3>
            {resource.download_url ? (
              <div className="space-y-3">
                <a href={resource.download_url} target="_blank" rel="noreferrer" className="btn-lg btn-outline w-full flex items-center justify-center gap-2">
                  <Eye className="h-4 w-4" /> View
                </a>
                <a href={resource.download_url} download className="btn-lg btn-primary w-full flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" /> Download
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted">This resource is not available for download yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-cream-dark p-4">
      <p className="text-[11px] font-700 uppercase tracking-wide text-muted mb-1">{label}</p>
      <p className="font-600 text-deep">{value}</p>
    </div>
  )
}

// ── Upload page ───────────────────────────────────────────────────────────────

const uploadSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  content_type: z.enum(['exam_questions', 'lecture_slides', 'tutorial_videos', 'lab_reports', 'field_materials']),
  course_id: z.string().min(1, 'Course is required'),
  level: z.string().min(1, 'Level is required'),
  trimester: z.enum(['first', 'second', 'third']),
  duration_mins: z.string().optional(),
  is_featured: z.boolean().default(false),
  file: z.instanceof(FileList).refine((files) => files.length > 0, 'File is required'),
})
type UploadForm = z.infer<typeof uploadSchema>

export function AcademicUploadPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canUpload = user && (user.role === 'exec' || user.role === 'admin')
  const [done, setDone] = useState<AcademicResource | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { content_type: 'lecture_slides', trimester: 'first', is_featured: false },
  })

  const selectedLevel = watch('level')
  const { data: coursesData } = useQuery({
    queryKey: ['courses', selectedLevel || 'all'],
    queryFn: () => academicsApi.listCourses(selectedLevel ? parseInt(selectedLevel) : undefined),
    staleTime: 10 * 60 * 1000,
  })
  const courses = coursesData ?? []

  const mutation = useMutation({
    mutationFn: (values: UploadForm) => {
      const formData = new FormData()
      formData.append('file', values.file[0])
      formData.append('title', values.title)
      formData.append('content_type', values.content_type)
      formData.append('course_id', values.course_id)
      formData.append('level', values.level)
      formData.append('trimester', values.trimester)
      if (values.duration_mins) formData.append('duration_mins', values.duration_mins)
      formData.append('is_featured', String(values.is_featured))
      return academicsApi.uploadResource(formData)
    },
    onSuccess: (resource) => {
      setDone(resource)
      qc.invalidateQueries({ queryKey: ['academic-resources'] })
    },
  })

  if (!canUpload) {
    return (
      <EmptyState
        icon="🔒"
        title="Upload access required"
        description="Only GPSA-UDS executives and admins can upload academic resources."
        action={<Button variant="primary" onClick={() => navigate('/academics')}>Back to Academics</Button>}
      />
    )
  }

  return (
    <>
      <Breadcrumbs />
      <PageHeader title="Upload Resource" subtitle="Share vetted academic material with GPSA-UDS students." />
      <div className="section-container section-padding max-w-3xl">
        <div className="card p-6 sm:p-8">
          {done ? (
            <div className="text-center py-8">
              <CheckCircle className="h-14 w-14 text-green-700 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-green-700 mb-2">Resource uploaded</h2>
              <p className="text-sm text-muted mb-6">
                {done.is_published ? 'It is now published.' : 'It is pending admin review before publication.'}
              </p>
              <Button variant="primary" onClick={() => navigate('/academics')}>Back to Academics</Button>
            </div>
          ) : (
            <>
              {mutation.error && (
                <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {extractError(mutation.error)}
                </div>
              )}
              <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5">
                <div>
                  <label className="form-label">Title *</label>
                  <input {...register('title')} className={cn('form-input', errors.title && 'form-input-error')} />
                  {errors.title && <p className="form-error">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect label="Type *" error={errors.content_type?.message}>
                    <select {...register('content_type')} className={cn('form-select', errors.content_type && 'form-input-error')}>
                      {CONTENT_TABS.filter((t) => t.value !== 'all').map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </FormSelect>
                  <FormSelect label="Level *" error={errors.level?.message}>
                    <select {...register('level')} className={cn('form-select', errors.level && 'form-input-error')}>
                      <option value="">Select level</option>
                      {[100, 200, 300, 400, 500, 600].map((l) => <option key={l} value={l}>Level {l}</option>)}
                    </select>
                  </FormSelect>
                  <FormSelect label="Course *" error={errors.course_id?.message}>
                    <select {...register('course_id')} className={cn('form-select', errors.course_id && 'form-input-error')}>
                      <option value="">Select course</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>)}
                    </select>
                  </FormSelect>
                  <FormSelect label="Trimester *" error={errors.trimester?.message}>
                    <select {...register('trimester')} className={cn('form-select', errors.trimester && 'form-input-error')}>
                      <option value="first">1st Trimester</option>
                      <option value="second">2nd Trimester</option>
                      <option value="third">3rd Trimester</option>
                    </select>
                  </FormSelect>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Duration Minutes</label>
                    <input {...register('duration_mins')} type="number" min="1" className="form-input" placeholder="For videos" />
                  </div>
                  <label className="flex items-end gap-3 pb-3 cursor-pointer">
                    <input {...register('is_featured')} type="checkbox" className="h-4 w-4" />
                    <span className="text-sm font-600 text-deep">Mark as best sample</span>
                  </label>
                </div>

                <div>
                  <label className="form-label">File *</label>
                  <input {...register('file')} type="file" className={cn('form-input', errors.file && 'form-input-error')} />
                  {errors.file && <p className="form-error">{errors.file.message as string}</p>}
                </div>

                <Button type="submit" variant="primary" size="lg" loading={mutation.isPending} className="w-full">
                  Upload Resource
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function FormSelect({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
