// ─────────────────────────────────────────────────────────────────────────────
// Welfare Page
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Bell, BellOff, BriefcaseBusiness, Calendar, ChevronRight,
  ExternalLink, FileText, Flame, Link2, MapPin, Search, ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { opportunitiesApi, newsApi, notificationsApi } from '@/api/services'

export { WelfarePage } from './WelfarePage'
import { useAuthStore } from '@/store/authStore'
import { Button, Badge, CardSkeleton, EmptyState, Skeleton } from '@/components/ui'
import { FilterBar, PageHeader, NewsCard, OpportunityCard, CATEGORY_STYLE } from '@/components/shared'
import {
  cn, formatDate, deadlineUrgency,
  NEWS_CATEGORY_LABELS, relativeTime,
} from '@/utils'
import type { OpportunityType, NewsCategory, NewsPostSummary } from '@/types'
import { useCmsPageSettings } from '@/hooks/useCmsPageSettings'
import { newsPageDefaults, opportunitiesPageDefaults } from '@/config/cmsPageDefaults'

// ── Opportunities ─────────────────────────────────────────────────────────────

const SEARCH_SUGGESTIONS = ['Ghana', 'MoH', 'NSS', 'Scholarship', 'Remote', 'Accra']

const SORT_OPTIONS = [
  { value: 'deadline', label: 'Deadline ↑' },
  { value: 'newest',   label: 'Newest' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['value']
const OPPORTUNITY_PAGE_SIZE = 12

export function OpportunitiesPage() {
  const navigate = useNavigate()
  const { settings } = useCmsPageSettings('opportunities', opportunitiesPageDefaults)
  const [typeFilter, setTypeFilter] = useState<OpportunityType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('deadline')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [redirectOpp, setRedirectOpp] = useState<{ title: string; url: string } | null>(null)

  const queryParams = {
    opp_type: typeFilter !== 'all' ? typeFilter : undefined,
    search: search || undefined,
    sort_by: sort === 'newest' ? 'created_at' as const : 'deadline' as const,
    sort_order: sort === 'newest' ? 'desc' as const : 'asc' as const,
    offset: (page - 1) * OPPORTUNITY_PAGE_SIZE,
    limit: OPPORTUNITY_PAGE_SIZE,
  }

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['opportunities', queryParams],
    queryFn: () => opportunitiesApi.list(queryParams),
    staleTime: 2 * 60 * 1000,
  })

  const { data: closingData } = useQuery({
    queryKey: ['opportunities', 'closing-soon-summary', typeFilter],
    queryFn: () => opportunitiesApi.list({
      opp_type: typeFilter !== 'all' ? typeFilter : undefined,
      sort_by: 'deadline',
      sort_order: 'asc',
      limit: 6,
    }),
    staleTime: 2 * 60 * 1000,
  })

  const items = data?.items ?? []
  const closingSoon = (closingData?.items ?? []).filter((o) => {
    const u = deadlineUrgency(o.deadline)
    return u === 'closing_today' || u === 'closing_soon'
  })
  const totalResults = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalResults / OPPORTUNITY_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const showSpotlight = safePage === 1 && !search && closingSoon.length > 0

  const typeOptions: { value: OpportunityType | 'all'; label: string }[] = [
    { value: 'all',         label: 'All Types' },
    { value: 'internship',  label: 'Internship' },
    { value: 'scholarship', label: 'Scholarship' },
    { value: 'job',         label: 'Job' },
    { value: 'training',    label: 'Training' },
  ]

  const activeFilterCount = (typeFilter !== 'all' ? 1 : 0) + (search ? 1 : 0)
  const handleTypeChange = (value: OpportunityType | 'all') => { setTypeFilter(value); setPage(1) }
  const handleSearch = (value: string) => { setSearch(value); setPage(1) }

  return (
    <>
      <PageHeader title={settings.page_title} subtitle={settings.page_subtitle} />

      <div className="section-container section-padding">
        {/* ── Mini stats ── */}
        <div className="flex flex-wrap gap-4 mb-8">
          <StatCard icon={FileText} value={totalResults} label="Total" />
          <StatCard icon={Flame} value={closingSoon.length} label="Closing Soon" />
        </div>

        {/* ── Sticky controls ── */}
        <div className="sticky top-[70px] z-30 bg-white/90 backdrop-blur-md rounded-2xl border border-cream-dark shadow-sm -mx-2 px-4 py-4 mb-6 transition-shadow">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={settings.search_placeholder}
                className="form-input pl-10 h-10 text-sm"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-600 whitespace-nowrap">Sort by</span>
              <div className="flex rounded-xl border border-cream-dark overflow-hidden">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setPage(1) }}
                    className={cn(
                      'px-3 py-1.5 text-xs font-600 transition-all',
                      sort === opt.value
                        ? 'bg-green-gradient text-white'
                        : 'bg-white text-muted hover:text-green-700'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters((o) => !o)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-600 border transition-all',
                showFilters || activeFilterCount > 0
                  ? 'bg-green-gradient text-white border-green-700'
                  : 'bg-white text-muted border-cream-dark hover:border-green-300 hover:text-green-700'
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-white/20">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Collapsible filter panel */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-3 animate-fade-in">
              <FilterBar options={typeOptions} value={typeFilter} onChange={handleTypeChange} />

              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setTypeFilter('all'); setSearch(''); setSort('deadline'); setPage(1) }}
                  className="text-xs text-red-600 font-600 hover:text-red-700 transition-colors whitespace-nowrap"
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>
          )}

          {/* Search chips */}
          {!search && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[11px] text-muted font-500 mr-1 self-center">Quick:</span>
              {SEARCH_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-cream-dark bg-white text-muted hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Result count */}
          <div className="mt-3 text-xs text-muted font-500">
            Showing <strong className="text-deep">{items.length}</strong> of <strong className="text-deep">{totalResults}</strong> opportunities
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <EmptyState
            icon="⚠️"
            title="Failed to load opportunities"
            description="Something went wrong. Please try again."
            action={<Button variant="primary" size="sm" onClick={() => refetch()}>Retry</Button>}
          />
        ) : !items.length ? (
          <EmptyState
            icon="💼"
            title={settings.empty_title}
            description={search ? `Nothing matches "${search}". Try different keywords.` : 'Try adjusting your filters.'}
            action={
              activeFilterCount > 0 ? (
                <Button variant="outline" size="sm" onClick={() => { setTypeFilter('all'); setSearch(''); setPage(1) }}>
                  Reset Filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {isFetching && (
              <div className="h-1 rounded-full bg-cream-dark overflow-hidden mb-4">
                <div className="h-full w-1/3 bg-green-gradient rounded-full animate-pulse" />
              </div>
            )}
            {/* Spotlight section: closing soon items at the top */}
            {showSpotlight && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="h-5 w-5 text-amber-700" strokeWidth={1.8} aria-hidden="true" />
                  <h2 className="font-display text-xl font-bold text-deep">{settings.closing_title}</h2>
                  <span className="text-xs text-muted font-500">{settings.closing_subtitle}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {closingSoon.slice(0, 3).map((o) => (
                    <div key={o.id} onClick={() => navigate(`/opportunities/${o.id}`)} className="cursor-pointer">
                      <OpportunityCard
                        opportunity={o}
                        onApply={() => setRedirectOpp({ title: o.title, url: o.external_link })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main results */}
            <div>
              {showSpotlight && items.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <BriefcaseBusiness className="h-5 w-5 text-green-800" strokeWidth={1.8} aria-hidden="true" />
                  <h2 className="font-display text-xl font-bold text-deep">
                    {settings.all_title}
                  </h2>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((o) => (
                  <div key={o.id} onClick={() => navigate(`/opportunities/${o.id}`)} className="cursor-pointer">
                    <OpportunityCard
                      opportunity={o}
                      onApply={() => setRedirectOpp({ title: o.title, url: o.external_link })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                  Prev
                </Button>
                <span className="text-xs text-muted px-2">Page {safePage} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Redirect modal */}
      {redirectOpp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-card-lg w-full max-w-sm p-8 animate-fade-up text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-green-100 bg-green-50 text-green-800">
              <Link2 className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h3 className="font-display text-xl font-bold text-green-700 mb-3">External Redirect</h3>
            <p className="text-sm text-muted mb-6">
              You are being redirected to an external website to complete your application for{' '}
              <strong>{redirectOpp.title}</strong>.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="md" className="flex-1" onClick={() => setRedirectOpp(null)}>Cancel</Button>
              <a
                href={redirectOpp.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => setRedirectOpp(null)}
                className="btn-md btn-primary flex-1 flex items-center justify-center gap-1.5"
              >
                Proceed <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [redirectOpp, setRedirectOpp] = useState<{ title: string; url: string } | null>(null)

  const { data: opportunity, isLoading, isError, refetch } = useQuery({
    queryKey: ['opportunities', id],
    queryFn: () => opportunitiesApi.getById(id!),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return (
      <div className="section-container py-20 max-w-3xl">
        <Skeleton className="h-56 rounded-3xl mb-8" />
        <CardSkeleton />
      </div>
    )
  }

  if (isError || !opportunity) {
    return (
      <EmptyState
        icon="💼"
        title="Opportunity not found"
        description="This opportunity may have expired or been removed."
        action={<Button variant="primary" onClick={() => isError ? refetch() : navigate('/opportunities')}>{isError ? 'Retry' : 'Back to Opportunities'}</Button>}
      />
    )
  }

  return (
    <>
      <PageHeader title={opportunity.title} subtitle={`${opportunity.organization} · ${formatDate(opportunity.deadline)}`}>
        <Button variant="outline-white" size="md" onClick={() => navigate('/opportunities')}>
          Back to Opportunities
        </Button>
      </PageHeader>

      <div className="section-container section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <article className="lg:col-span-2 card p-6 sm:p-8">
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="green">{opportunity.opp_type}</Badge>
              <Badge variant={deadlineUrgency(opportunity.deadline) === 'expired' ? 'gray' : 'gold'}>
                Deadline {formatDate(opportunity.deadline)}
              </Badge>
            </div>
            <h2 className="font-display text-2xl font-bold text-green-700 mb-4">About this opportunity</h2>
            <p className="text-muted leading-relaxed whitespace-pre-wrap">{opportunity.description}</p>
          </article>

          <aside className="card p-6 h-fit space-y-5">
            <div className="space-y-3 text-sm">
              <p className="flex items-start gap-2 text-muted"><Calendar className="h-4 w-4 text-green-700 mt-0.5" />Deadline: {formatDate(opportunity.deadline)}</p>
              {opportunity.location && (
                <p className="flex items-start gap-2 text-muted"><MapPin className="h-4 w-4 text-green-700 mt-0.5" />{opportunity.location}</p>
              )}
            </div>
            {opportunity.is_active ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                rightIcon={<ExternalLink className="h-4 w-4" />}
                onClick={() => setRedirectOpp({ title: opportunity.title, url: opportunity.external_link })}
              >
                Apply Now
              </Button>
            ) : (
              <Badge variant="gray">Expired</Badge>
            )}
          </aside>
        </div>
      </div>

      {redirectOpp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-card-lg w-full max-w-sm p-8 animate-fade-up text-center">
            <span className="text-4xl mb-4 block">🔗</span>
            <h3 className="font-display text-xl font-bold text-green-700 mb-3">External Redirect</h3>
            <p className="text-sm text-muted mb-6">
              You are being redirected to an external website to complete your application for <strong>{redirectOpp.title}</strong>.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="md" className="flex-1" onClick={() => setRedirectOpp(null)}>Cancel</Button>
              <a href={redirectOpp.url} target="_blank" rel="noreferrer" onClick={() => setRedirectOpp(null)} className="btn-md btn-primary flex-1 flex items-center justify-center gap-1.5">
                Proceed <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatCard({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white rounded-xl border border-cream-dark px-4 py-2.5 shadow-sm min-w-[100px]">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-800">
        <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div>
        <p className="text-lg font-bold text-deep leading-none">{value}</p>
        <p className="text-[11px] text-muted font-500 leading-tight">{label}</p>
      </div>
    </div>
  )
}

// ── News ──────────────────────────────────────────────────────────────────────

const NEWS_PAGE_SIZE = 9

export function NewsPage() {
  const navigate = useNavigate()
  const { settings } = useCmsPageSettings('news', newsPageDefaults)
  const [catFilter, setCatFilter] = useState<NewsCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Reset to page 1 when filters change
  const handleCatChange = (v: NewsCategory | 'all') => { setCatFilter(v); setPage(1) }
  const handleSearch    = (v: string)                 => { setSearch(v);   setPage(1) }

  const { data: featured } = useQuery({
    queryKey: ['news', 'featured'],
    queryFn: newsApi.getFeatured,
    staleTime: 5 * 60 * 1000,
  })

  const offset = (page - 1) * NEWS_PAGE_SIZE
  const trimmedSearch = search.trim()
  const isSearching = trimmedSearch.length >= 2

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['news', { category: catFilter, page }],
    queryFn: () => newsApi.list({
      category: catFilter !== 'all' ? catFilter : undefined,
      offset,
      limit: NEWS_PAGE_SIZE,
    }),
    enabled: !isSearching,
    staleTime: 60_000,
  })

  const searchQuery = useQuery({
    queryKey: ['news', 'search', trimmedSearch, page],
    queryFn: () => newsApi.search(trimmedSearch, offset, NEWS_PAGE_SIZE),
    enabled: isSearching,
    staleTime: 60_000,
  })

  const catOptions: { value: NewsCategory | 'all'; label: string }[] = [
    { value: 'all',             label: 'All' },
    { value: 'announcement',    label: 'Announcements' },
    { value: 'academic_update', label: 'Academic' },
    { value: 'welfare_update',  label: 'Welfare' },
    { value: 'events_recap',    label: 'Events Recap' },
    { value: 'opportunities',   label: 'Opportunities' },
    { value: 'general',         label: 'General' },
  ]

  const serverItems: NewsPostSummary[] = isSearching ? (searchQuery.data ?? []) : (data?.items ?? [])
  const totalResults = data?.total ?? 0
  const totalPages  = isSearching ? page + (serverItems.length === NEWS_PAGE_SIZE ? 1 : 0) : Math.max(1, Math.ceil(totalResults / NEWS_PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const paginated   = serverItems

  // Split first page into: 1 hero + 4 latest + rest in grid
  const heroPost      = safePage === 1 ? paginated[0]    : undefined
  const latestPosts   = safePage === 1 ? paginated.slice(1, 5) : []
  const gridPosts     = safePage === 1 ? paginated.slice(5) : paginated

  return (
    <>
      <PageHeader title={settings.page_title} subtitle={settings.page_subtitle} />

      <div className="section-container section-padding">

        {/* Featured pinned post (server-selected) */}
        {featured && safePage === 1 && !search && catFilter === 'all' && (
          <div
            className="relative overflow-hidden rounded-3xl mb-10 cursor-pointer group bg-gradient-to-br from-green-700 to-green-900"
            onClick={() => navigate(`/news/${featured.id}`)}
          >
            <div className="absolute inset-0 bg-hero-pattern opacity-[0.06]" />
            <div className="relative p-8 lg:p-12">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-700 bg-white/20 text-white backdrop-blur-sm">
                    📌 Pinned
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-700 bg-white/20 text-white backdrop-blur-sm">
                    {NEWS_CATEGORY_LABELS[featured.category]}
                  </span>
                  {featured.is_urgent && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-700 bg-red-500/20 text-red-200 backdrop-blur-sm">
                      🔴 Urgent
                    </span>
                  )}
                </div>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                  {featured.title}
                </h2>
                {featured.summary && (
                  <p className="text-white/70 text-base leading-relaxed mb-6 line-clamp-2 max-w-xl">
                    {featured.summary}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  {featured.published_at && (
                    <span className="text-sm text-white/50">{formatDate(featured.published_at)}</span>
                  )}
                  <span className="text-sm font-600 text-white/70 group-hover:text-white transition-colors flex items-center gap-1">
                    Read story <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={settings.search_placeholder}
              className="form-input pl-11"
            />
          </div>
          {!isSearching && totalResults > 0 && (
            <p className="text-sm text-muted self-center flex-shrink-0">
              {totalResults} {totalResults === 1 ? 'post' : 'posts'}
            </p>
          )}
        </div>

        <FilterBar options={catOptions} value={catFilter} onChange={handleCatChange} className="mb-8" />

        {(isSearching ? searchQuery.isLoading : isLoading) ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><CardSkeleton /></div>
              <CardSkeleton />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map((i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        ) : (isSearching ? searchQuery.isError : isError) ? (
          <EmptyState
            icon="⚠️"
            title="Failed to load news"
            description="Something went wrong. Please try again."
            action={
              <Button variant="primary" size="sm" onClick={() => isSearching ? searchQuery.refetch() : refetch()}>
                Retry
              </Button>
            }
          />
        ) : !paginated.length ? (
          <EmptyState icon="📰" title={settings.empty_title} description={settings.empty_description} />
        ) : (
          <>
            {/* ── Hero post ── */}
            {heroPost && (
              <div className="mb-10">
                <div
                  className="card card-hover overflow-hidden flex flex-col lg:flex-row"
                  onClick={() => navigate(`/news/${heroPost.id}`)}
                >
                  <div className="lg:w-72 h-48 lg:h-auto flex items-center justify-center text-6xl lg:text-7xl flex-shrink-0 bg-cream-dark">
                    {heroPost.banner_emoji ?? '📰'}
                  </div>
                  <div className="p-6 lg:p-8 flex flex-col justify-center flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={cn('w-2.5 h-2.5 rounded-full', CATEGORY_STYLE[heroPost.category]?.dot)} />
                      <span className={cn('text-xs font-700 uppercase tracking-wider', CATEGORY_STYLE[heroPost.category]?.text)}>
                        {NEWS_CATEGORY_LABELS[heroPost.category]}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl lg:text-3xl font-bold text-deep mb-3 leading-snug">
                      {heroPost.title}
                    </h2>
                    <p className="text-muted text-sm leading-relaxed line-clamp-3 mb-4">{heroPost.summary}</p>
                    <div className="flex items-center justify-between">
                      {heroPost.published_at && (
                        <span className="text-xs text-muted">{formatDate(heroPost.published_at)}</span>
                      )}
                      <span className="text-sm font-600 text-green-700 hover:text-green-600 transition-colors flex items-center gap-1">
                        Read More <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Latest — compact cards */}
                {latestPosts.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">⚡</span>
                      <h2 className="font-display text-xl font-bold text-deep">{settings.latest_title}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {latestPosts.map((p) => {
                        const s = CATEGORY_STYLE[p.category] ?? CATEGORY_STYLE.general
                        return (
                          <div
                            key={p.id}
                            onClick={() => navigate(`/news/${p.id}`)}
                            className="flex items-start gap-4 bg-white rounded-2xl p-4 border border-cream-dark cursor-pointer hover:shadow-card-md transition-all group"
                          >
                            <div className={cn('w-1 self-stretch rounded-full flex-shrink-0', s.bar)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                                <span className={cn('text-[10px] font-700 uppercase tracking-wider', s.text)}>
                                  {NEWS_CATEGORY_LABELS[p.category]}
                                </span>
                              </div>
                              <h3 className="font-body font-600 text-deep text-sm leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
                                {p.title}
                              </h3>
                              {p.published_at && (
                                <p className="text-xs text-muted mt-1">{formatDate(p.published_at)}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* More News grid */}
            {gridPosts.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📰</span>
                  <h2 className="font-display text-xl font-bold text-deep">{settings.more_title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridPosts.map((p) => (
                    <NewsCard key={p.id} post={p} onClick={() => navigate(`/news/${p.id}`)} />
                  ))}
                </div>
              </>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={safePage === 1}
                  className="px-4 py-2 rounded-xl text-sm font-600 border border-cream-dark bg-white text-secondary hover:border-green-300 hover:text-green-700 disabled:opacity-60 disabled:pointer-events-none transition-all"
                >
                  ← Prev
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                    const isEllipsis = totalPages > 7 && Math.abs(n - safePage) > 2 && n !== 1 && n !== totalPages
                    if (isEllipsis && (n === safePage - 3 || n === safePage + 3)) {
                      return <span key={n} className="px-2 py-2 text-muted text-sm">…</span>
                    }
                    if (isEllipsis) return null
                    return (
                      <button
                        key={n}
                        onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className={cn(
                          'w-9 h-9 rounded-xl text-sm font-600 transition-all',
                          n === safePage
                            ? 'bg-green-gradient text-white shadow-card border-green-700'
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
                  className="px-4 py-2 rounded-xl text-sm font-600 border border-cream-dark bg-white text-secondary hover:border-green-300 hover:text-green-700 disabled:opacity-60 disabled:pointer-events-none transition-all"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Page info */}
            {totalPages > 1 && (
              <p className="text-center text-xs text-muted mt-3">
                {isSearching ? `Page ${safePage}` : `Page ${safePage} of ${totalPages} · ${totalResults} posts`}
              </p>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ── News detail ───────────────────────────────────────────────────────────────

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: post, isLoading, isError, refetch } = useQuery({
    queryKey: ['news', id],
    queryFn: () => newsApi.getById(id!),
    enabled: !!id,
  })

  // Related posts — same category, exclude current
  const { data: related } = useQuery({
    queryKey: ['news', 'related', post?.category],
    queryFn: () => newsApi.list({ category: post!.category, limit: 4 }),
    enabled: !!post?.category,
  })
  const relatedPosts = (related?.items ?? []).filter((p) => p.id !== id).slice(0, 3)

  const newsStyle = post ? CATEGORY_STYLE[post.category] ?? CATEGORY_STYLE.general : null

  if (isLoading) return (
    <div className="section-container py-20 max-w-3xl">
      <Skeleton className="h-6 w-32 mb-8 rounded-xl" />
      <Skeleton className="h-48 rounded-3xl mb-8" />
      <Skeleton className="h-10 w-3/4 mb-3 rounded-xl" />
      <Skeleton className="h-4 w-40 mb-8 rounded-xl" />
      <div className="space-y-3">
        {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-4 rounded" />)}
      </div>
    </div>
  )

  if (isError) return (
    <EmptyState
      icon="⚠️"
      title="Failed to load post"
      description="Something went wrong. Please try again."
      action={<Button variant="primary" onClick={() => refetch()}>Retry</Button>}
    />
  )

  if (!post) return (
    <EmptyState icon="📰" title="Post not found"
      action={<Button variant="primary" onClick={() => navigate('/news')}>Back to News</Button>} />
  )

  return (
    <div className="section-container py-10 md:py-14">
      <article className="max-w-3xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/news')}
          className="text-green-700 hover:text-green-600 text-sm mb-8 flex items-center gap-1.5 font-500 transition-colors"
        >
          ← Back to News
        </button>

        {/* Banner */}
        <div className={cn(
          'h-48 rounded-3xl flex flex-col items-center justify-center mb-8 relative overflow-hidden',
          newsStyle?.bar ?? 'bg-cream-dark'
        )}>
          <div className="absolute inset-0 bg-hero-pattern opacity-[0.06]" />
          <span className="text-5xl mb-2 opacity-30 relative">{post.banner_emoji ?? '📰'}</span>
          <span className="text-xs font-700 uppercase tracking-wider text-white/60 relative">
            {NEWS_CATEGORY_LABELS[post.category]}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="green">{NEWS_CATEGORY_LABELS[post.category]}</Badge>
          {post.is_urgent && <Badge variant="red">🔴 Urgent</Badge>}
        </div>

        <h1 className="font-display text-4xl lg:text-5xl font-bold text-deep mb-4 leading-tight">
          {post.title}
        </h1>

        {post.published_at && (
          <p className="text-sm text-muted mb-8 pb-8 border-b border-cream-dark">
            Published {formatDate(post.published_at)}
          </p>
        )}

        {/* Summary callout */}
        {post.summary && (
          <div className="relative rounded-2xl border border-green-100 bg-green-50/80 p-5 md:p-6 mb-8 overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-green-700" />
            <p className="pl-3 text-base md:text-lg leading-relaxed font-600 text-green-950">
              {post.summary}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="text-secondary leading-8 whitespace-pre-wrap font-body text-base md:text-lg">
          {post.body}
        </div>

        {/* Share / action row */}
        <div className="mt-12 pt-8 border-t border-cream-dark flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => navigate('/news')}
            className="text-green-700 hover:text-green-600 text-sm font-600 flex items-center gap-1.5 transition-colors"
          >
            ← All News
          </button>
          {post.is_urgent && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-600">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Urgent notice
            </div>
          )}
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <div className="mt-16 pt-12 border-t border-cream-dark">
          <div className="max-w-3xl mx-auto mb-6">
            <h2 className="font-display text-2xl font-bold text-green-700">More in {NEWS_CATEGORY_LABELS[post.category]}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {relatedPosts.map((p) => (
              <NewsCard key={p.id} post={p} onClick={() => navigate(`/news/${p.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [unreadOnly, setUnreadOnly] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: () => notificationsApi.list({ unread_only: unreadOnly, limit: 50 }),
    enabled: isAuthenticated,
  })

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (!isAuthenticated) {
    return (
      <div className="section-container py-20 text-center">
        <EmptyState icon="🔔" title="Sign in to view notifications"
          action={<Button variant="primary" onClick={() => navigate('/login')}>Sign In</Button>} />
      </div>
    )
  }

  const unreadCount = data?.total ?? 0

  return (
    <div className="section-container py-12 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-green-700">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted mt-1">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUnreadOnly((o) => !o)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-500 border transition-all',
              unreadOnly
                ? 'bg-green-gradient text-white border-green-700'
                : 'bg-white border-cream-dark text-muted'
            )}
          >
            {unreadOnly ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {unreadOnly ? 'Unread only' : 'All'}
          </button>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : !data?.items?.length ? (
        <EmptyState icon="🔔" title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {data.items.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.is_read) markRead.mutate(n.id); if (n.link) navigate(n.link) }}
              className={cn(
                'card p-5 cursor-pointer hover:shadow-card-md transition-all flex gap-4',
                !n.is_read && 'bg-green-gradient border-green-700'
              )}
            >
              <div className="w-2 h-2 rounded-full bg-green-gradient flex-shrink-0 mt-2 opacity-0 transition-opacity"
                style={{ opacity: n.is_read ? 0 : 1 }} />
              <div className="flex-1">
                <p className={cn('text-sm font-600 text-deep', !n.is_read && 'font-700')}>{n.title}</p>
                <p className="text-sm text-muted mt-0.5">{n.body}</p>
                <p className="text-xs text-secondary mt-1.5">{relativeTime(n.created_at)}</p>
              </div>
              {n.link && <ChevronRight className="h-4 w-4 text-muted flex-shrink-0 mt-1" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
