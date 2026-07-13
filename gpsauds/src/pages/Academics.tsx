import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, Eye, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { academicsApi } from '@/api/services'
import { EmptyState, Badge, Skeleton } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { cn, TRIMESTER_LABELS, formatFileSize } from '@/utils'
import type { ContentType, Trimester } from '@/types'

const CONTENT_TABS: { value: ContentType | 'all'; label: string; emoji: string }[] = [
  { value: 'all',             label: 'All Resources',   emoji: '📂' },
  { value: 'exam_questions',  label: 'Exam Questions',  emoji: '📄' },
  { value: 'lecture_slides',  label: 'Lecture Slides',  emoji: '📊' },
  { value: 'tutorial_videos', label: 'Tutorial Videos', emoji: '🎥' },
  { value: 'lab_reports',     label: 'Lab Reports',     emoji: '🧪' },
  { value: 'field_materials', label: 'Field Materials', emoji: '🌍' },
]

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄', video: '🎥', doc: '📝', image: '🖼️', other: '📁',
}

const PAGE_SIZE = 10

export function AcademicsPage() {
  const [level, setLevel]         = useState<number | 'all'>('all')
  const [trimester, setTrimester] = useState<Trimester | 'all'>('all')
  const [contentType, setContentType] = useState<ContentType | 'all'>('all')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)

  const resetPage = () => setPage(1)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['academic-resources', { level, trimester, contentType, search }],
    queryFn: () =>
      academicsApi.listResources({
        level:        level !== 'all' ? level : undefined,
        trimester:    trimester !== 'all' ? trimester : undefined,
        content_type: contentType !== 'all' ? contentType : undefined,
        search:       search || undefined,
        limit:        200,
      }),
    staleTime: 2 * 60 * 1000,
  })

  const allItems   = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageItems  = allItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <>
      <PageHeader
        title="Academics Hub"
        subtitle="Access structured resources to prepare smarter and perform better."
      />

      <div className="section-container section-padding">

        {/* ── Search + Filters row ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              placeholder='Search resources…'
              className="form-input pl-11"
            />
          </div>

          {/* Level dropdown */}
          <div className="relative">
            <select
              value={String(level)}
              onChange={(e) => { setLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); resetPage() }}
              className="form-select pr-10 min-w-[130px]"
            >
              <option value="all">All Levels</option>
              {[100, 200, 300, 400, 500, 600].map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>

          {/* Trimester dropdown */}
          <div className="relative">
            <select
              value={trimester}
              onChange={(e) => { setTrimester(e.target.value as Trimester | 'all'); resetPage() }}
              className="form-select pr-10 min-w-[150px]"
            >
              <option value="all">All Trimesters</option>
              <option value="first">1st Trimester</option>
              <option value="second">2nd Trimester</option>
              <option value="third">3rd Trimester</option>
            </select>
          </div>

          {/* Content type dropdown */}
          <div className="relative">
            <select
              value={contentType}
              onChange={(e) => { setContentType(e.target.value as ContentType | 'all'); resetPage() }}
              className="form-select pr-10 min-w-[160px]"
            >
              {CONTENT_TABS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Results ── */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : !allItems.length ? (
          <EmptyState
            icon="📭"
            title="No resources found"
            description="Try adjusting your filters or search query."
          />
        ) : (
          <>
            <p className="text-xs text-muted mb-4 font-500">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, allItems.length)} of {allItems.length} resources
            </p>

            <div className={cn('space-y-3 transition-opacity', isFetching && 'opacity-60')}>
              {pageItems.map((resource) => (
                <div
                  key={resource.id}
                  className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-card-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-cream-dark flex items-center justify-center text-xl flex-shrink-0">
                    {FILE_TYPE_ICONS[resource.file_type] ?? '📁'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <Badge variant="green">Level {resource.level}</Badge>
                      <Badge variant="blue">{TRIMESTER_LABELS[resource.trimester]}</Badge>
                      <Badge variant="gray">{resource.file_type.toUpperCase()}</Badge>
                      {resource.is_featured && (
                        <Badge variant="gold">
                          <Star className="h-2.5 w-2.5 fill-current" /> Best Sample
                        </Badge>
                      )}
                    </div>
                    <p className="font-body font-700 text-[#1B3D22] leading-tight">{resource.title}</p>
                    <p className="text-xs text-muted mt-1">
                      {resource.course?.name ?? '—'} · {formatFileSize(resource.file_size_bytes)}
                      {resource.duration_mins && ` · ${resource.duration_mins} min`}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {resource.download_url && (
                      <>
                        <a
                          href={resource.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-sm btn-outline flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </a>
                        <a
                          href={resource.download_url}
                          download
                          className="btn-sm btn-primary flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
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
              <>
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    disabled={safePage === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-600 border border-cream-dark bg-white text-muted hover:border-green-300 hover:text-green-700 disabled:opacity-40 disabled:pointer-events-none transition-all"
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
                              : 'border border-cream-dark bg-white text-muted hover:border-green-300 hover:text-green-700'
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
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-600 border border-cream-dark bg-white text-muted hover:border-green-300 hover:text-green-700 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-center text-xs text-muted mt-3">
                  Page {safePage} of {totalPages}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}