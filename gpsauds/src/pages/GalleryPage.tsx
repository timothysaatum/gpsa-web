import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, ChevronLeft, ChevronRight, ZoomIn, Calendar} from 'lucide-react'
import { galleryApi } from '@/api/services'
import { Button, EmptyState } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { cn } from '@/utils'
import type { GalleryCategory, GalleryItem } from '@/types'

const CATEGORY_LABEL: Record<GalleryCategory, string> = {
  events:   'Events',
  academic: 'Academic',
  health:   'Health',
  outreach: 'Outreach',
  social:   'Social',
  welfare:  'Welfare',
}

const CATEGORIES: { value: GalleryCategory | 'all'; label: string }[] = [
  { value: 'all',      label: 'All' },
  ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value: value as GalleryCategory, label })),
]

const CATEGORY_VISUALS: Record<GalleryCategory, { bg: string; text: string; gradient: string; accent: string }> = {
  events:   { bg: 'bg-emerald-100',        text: 'text-emerald-700',       gradient: 'from-emerald-700 to-green-800', accent: 'text-emerald-400' },
  academic: { bg: 'bg-blue-100',           text: 'text-blue-700',          gradient: 'from-blue-700 to-blue-800',    accent: 'text-blue-400' },
  health:   { bg: 'bg-amber-100',          text: 'text-amber-700',         gradient: 'from-amber-700 to-amber-800',  accent: 'text-amber-400' },
  outreach: { bg: 'bg-green-100',          text: 'text-green-700',         gradient: 'from-green-700 to-green-800',  accent: 'text-green-400' },
  social:   { bg: 'bg-purple-100',         text: 'text-purple-700',        gradient: 'from-purple-700 to-purple-800', accent: 'text-purple-400' },
  welfare:  { bg: 'bg-red-100',            text: 'text-red-700',           gradient: 'from-red-700 to-red-800',      accent: 'text-red-400' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Gallery Card
// ─────────────────────────────────────────────────────────────────────────────

function GalleryCard({
  item,
  onClick,
}: {
  item: GalleryItem
  onClick: () => void
}) {
  const visual = CATEGORY_VISUALS[item.category]
  const hasPhoto = Boolean(item.image_url ?? item.thumbnail_url)

  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer group select-none"
      style={{ paddingBottom: '75%' }}
    >
      <div className="absolute inset-0">
        {hasPhoto ? (
          <img
            src={item.thumbnail_url ?? item.image_url}
            alt={item.title}
            className="w-full h-full object-cover object-center
                       group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div
            className={cn('w-full h-full bg-gradient-to-br', visual.gradient)}
          >
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='1' fill='white'/%3E%3C/svg%3E")`,
              }}
            />
            {!hasPhoto && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl opacity-20">🖼️</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom scrim */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.10) 45%, transparent 100%)',
          }}
        />

        {/* Hover brightness overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Category pill */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              'text-[10px] font-700 uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm',
              visual.bg, visual.text,
            )}
          >
            {CATEGORY_LABEL[item.category]}
          </span>
        </div>

        {/* Zoom icon */}
        <div
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-all duration-200
                     translate-x-2 group-hover:translate-x-0"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
        >
          <ZoomIn className="h-3.5 w-3.5 text-white" />
        </div>

        {/* Title + date */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10">
          <p className="text-white font-700 text-sm leading-snug drop-shadow-sm line-clamp-2">
            {item.title}
          </p>
          {item.event_date && (
            <p className="text-white/55 text-[11px] mt-0.5">
              {new Date(item.event_date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox
// ─────────────────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: GalleryItem[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const item = items[index]
  const visual = CATEGORY_VISUALS[item.category]
  const hasPhoto = Boolean(item.image_url ?? item.thumbnail_url)

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft')   onPrev()
      if (e.key === 'ArrowRight')  onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  // Prevent scroll behind lightbox
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center
                   text-white/70 hover:text-white hover:bg-white/10 transition-all z-20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-700 text-white/40
                   font-mono tabular-nums z-20 select-none"
      >
        {String(index + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(items.length).padStart(2, '0')}
      </div>

      {/* Prev arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev() }}
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20
                   w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                   border border-white/15 bg-white/08 text-white
                   hover:bg-white/20 hover:border-white/30 transition-all duration-200"
        aria-label="Previous photo"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Next arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext() }}
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20
                   w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                   border border-white/15 bg-white/08 text-white
                   hover:bg-white/20 hover:border-white/30 transition-all duration-200"
        aria-label="Next photo"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Main photo / placeholder */}
      <div
        className="relative max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasPhoto ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full object-contain"
            style={{ maxHeight: '80vh' }}
          />
        ) : (
          <div
            className={cn('w-full flex items-center justify-center bg-gradient-to-br', visual.gradient)}
            style={{ height: 'min(60vh, 480px)' }}
          >
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='1.5' fill='white'/%3E%3C/svg%3E")`,
              }}
            />
            <div className="text-center relative z-10 px-8">
              <p
                className="font-display font-bold text-white/80 mb-2"
                style={{ fontSize: 'clamp(1.1rem, 3vw, 1.75rem)' }}
              >
                {item.title}
              </p>
              <p className={cn('text-sm font-500', visual.accent)}>
                Photo coming soon
              </p>
            </div>
          </div>
        )}

        {/* Meta strip */}
        <div
          className="flex flex-wrap items-center gap-4 px-5 py-4"
          style={{ background: 'var(--near-black)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span
            className={cn('text-[11px] font-700 uppercase tracking-widest px-2.5 py-1 rounded-full', visual.bg, visual.text)}
          >
            {CATEGORY_LABEL[item.category]}
          </span>
          <p className="text-white font-700 text-sm flex-1 min-w-0 truncate">
            {item.title}
          </p>
          {item.event_date && (
            <p className="text-white/40 text-xs flex items-center gap-1.5 flex-shrink-0">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(item.event_date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-[11px] select-none hidden md:block">
        ← → to navigate · Esc to close
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const LOAD_MORE_STEP = 12

export function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory | 'all'>('all')
  const [lightboxIndex, setLightboxIndex]   = useState<number | null>(null)
  const [visibleCount, setVisibleCount]     = useState(LOAD_MORE_STEP)

  const { data: countData } = useQuery({
    queryKey: ['gallery', 'counts'],
    queryFn: () => galleryApi.list({ limit: 500 }),
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['gallery', 'list', activeCategory, visibleCount],
    queryFn: () => galleryApi.list({
      category: activeCategory !== 'all' ? activeCategory : undefined,
      limit: visibleCount,
    }),
    staleTime: 2 * 60 * 1000,
  })
  const allItems = Array.isArray(data) ? data : []
  const countItems = Array.isArray(countData) ? countData : []

  const filtered = allItems
  const visible = filtered
  const filteredTotal = activeCategory === 'all'
    ? countItems.length
    : countItems.filter((g) => g.category === activeCategory).length
  const hasMore = visible.length < filteredTotal

  // Reset visible count when filter changes
  const handleCategoryChange = (cat: GalleryCategory | 'all') => {
    setActiveCategory(cat)
    setVisibleCount(LOAD_MORE_STEP)
  }

  // Lightbox navigation operates on the *filtered* list
  const openLightbox = (idx: number) => setLightboxIndex(idx)
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const prevPhoto = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + filtered.length) % filtered.length : null)),
    [filtered.length],
  )
  const nextPhoto = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % filtered.length : null)),
    [filtered.length],
  )

  // Count per category for the filter bar
  const countFor = (cat: GalleryCategory | 'all') =>
    cat === 'all'
      ? countItems.length
      : countItems.filter((g) => g.category === cat).length

  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Moments, memories, and milestones from the GPSA-UDS community."
      />

      <div className="section-container section-padding">

        {/* ── Filter bar ── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(({ value, label }) => {
            const count = countFor(value)
            const active = activeCategory === value
            return (
              <button
                key={value}
                onClick={() => handleCategoryChange(value)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-600 font-body',
                  'border transition-all duration-150',
                  active
                    ? 'bg-green-gradient text-white border-green-700 shadow-card'
                    : 'bg-white text-muted border-cream-dark hover:border-green-300 hover:text-green-700',
                )}
              >
                {label}
                <span
                  className={cn(
                    'text-[11px] font-700 px-1.5 py-0.5 rounded-full tabular-nums',
                    active ? 'bg-white/20 text-white' : 'bg-cream-dark text-muted',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}

          {/* Result count — right-aligned */}
          <p className="ml-auto self-center text-sm text-muted hidden sm:block">
            {filteredTotal} {filteredTotal === 1 ? 'photo' : 'photos'}
          </p>
        </div>

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
          </div>
        ) : isError ? (
          <EmptyState
            icon="⚠️"
            title="Failed to load gallery"
            description="Something went wrong. Please try again."
            action={<Button variant="primary" size="sm" onClick={() => refetch()}>Retry</Button>}
          />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-5">🖼️</span>
            <h3 className="font-display text-xl font-semibold text-green-700 mb-2">No photos yet</h3>
            <p className="text-sm text-muted max-w-sm">
              Photos for this category will appear here once they're uploaded.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visible.map((item, idx) => (
                <GalleryCard key={item.id} item={item} onClick={() => openLightbox(idx)} />
              ))}
            </div>

            {/* ── Load more ── */}
            {hasMore && (
              <div className="flex flex-col items-center mt-10 gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
                >
                  Load More Photos
                </Button>
                <p className="text-xs text-muted">
                  Showing {visible.length} of {filteredTotal}
                </p>
              </div>
            )}
          </>
        )}

      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <Lightbox
          items={filtered}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}
    </>
  )
}
