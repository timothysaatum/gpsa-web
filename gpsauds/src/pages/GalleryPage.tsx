/**
 *
 * ── Backend integration checklist ──────────────────────────────────────────
 * 1. API FETCH:    Replace the GALLERY_ITEMS static array with a useQuery()
 *                 call to your gallery API. Suggested shape:
 *                   { id, title, category, photo_url, thumbnail_url,
 *                     event_date, description? }
 *
 * 2. PHOTO SWAP:  Each GalleryCard renders a photo <img> when `photo_url`
 *                 is truthy; otherwise it shows a gradient placeholder.
 *                 No code changes needed — just populate the field.
 *
 * 3. UPLOAD:      Add an admin-gated upload button that calls your
 *                 galleryApi.upload() endpoint. Hook in at the top of
 *                 the page next to the filter bar.
 *
 * 4. PAGINATION:  Replace `slice(0, visibleCount)` with cursor / page-based
 *                 API pagination when you have enough photos.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, Calendar} from 'lucide-react'
import { Button } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { cn } from '@/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GalleryCategory = 'events' | 'academic' | 'health' | 'outreach' | 'social' | 'welfare'

interface GalleryItem {
  id: number
  title: string
  category: GalleryCategory
  /**
   * When populated from the API, set this to the full-resolution URL.
   * The component automatically switches from the gradient placeholder
   * to the real photo — no other changes required.
   */
  photo_url?: string
  thumbnail_url?: string
  event_date?: string        // ISO date string, e.g. "2024-11-03"
  description?: string
  /** Used for the placeholder gradient when photo_url is absent */
  _gradient?: string
  _accent?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Static data — replace with useQuery(() => galleryApi.list()) when ready
// ─────────────────────────────────────────────────────────────────────────────

const GALLERY_ITEMS: GalleryItem[] = [
  { id: 1,  title: 'Graduation Ceremony 2024',      category: 'events',   event_date: '2024-11-03', _gradient: 'linear-gradient(90deg,#A8D5BA 0%,#00B140 100%)', _accent: '#A8D5BA' },
  { id: 2,  title: 'Health Week 2024',              category: 'health',   event_date: '2024-09-15', _gradient: 'linear-gradient(145deg,#7a4a00 0%,#C8991A 100%)',             _accent: '#F2C12E' },
  { id: 3,  title: 'Academic Symposium',            category: 'academic', event_date: '2024-07-20', _gradient: 'linear-gradient(145deg,#0c3347 0%,#185FA5 100%)',             _accent: '#85B7EB' },
  { id: 4,  title: 'Community Outreach Drive',      category: 'outreach', event_date: '2024-06-08', _gradient: 'linear-gradient(90deg,#A8D5BA 0%,#00B140 100%)',             _accent: '#A8D5BA' },
  { id: 5,  title: 'Public Speaking Contest',       category: 'events',   event_date: '2024-05-12', _gradient: 'linear-gradient(145deg,#4a1600 0%,#993c1d 100%)',             _accent: '#F09575' },
  { id: 6,  title: 'Field Trip — Herbarium',        category: 'academic', event_date: '2024-04-03', _gradient: 'linear-gradient(145deg,#0c3347 0%,#0F6E56 100%)',             _accent: '#5DCAA5' },
  { id: 7,  title: 'Inter-Level Sports Day',        category: 'social',   event_date: '2024-03-22', _gradient: 'linear-gradient(145deg,#3a1a6e 0%,#7c3aed 100%)',             _accent: '#c4b5fd' },
  { id: 8,  title: 'End-of-Year Dinner 2023',       category: 'social',   event_date: '2023-12-14', _gradient: 'linear-gradient(145deg,#1a0a2e 0%,#6b21a8 100%)',             _accent: '#d8b4fe' },
  { id: 9,  title: 'Lab Skills Workshop',           category: 'academic', event_date: '2023-11-18', _gradient: 'linear-gradient(145deg,#052e16 0%,#065f46 100%)',             _accent: '#6ee7b7' },
  { id: 10, title: 'GPSA Induction Ceremony',       category: 'events',   event_date: '2023-09-02', _gradient: 'linear-gradient(90deg,#A8D5BA 0%,#00B140 100%)',             _accent: '#A8D5BA' },
  { id: 11, title: 'Drug Awareness Campaign',       category: 'health',   event_date: '2023-08-25', _gradient: 'linear-gradient(145deg,#7a4a00 0%,#92400e 100%)',             _accent: '#fcd34d' },
  { id: 12, title: 'Blood Donation Drive',          category: 'outreach', event_date: '2023-07-14', _gradient: 'linear-gradient(145deg,#7f1d1d 0%,#dc2626 100%)',             _accent: '#fca5a5' },
  { id: 13, title: 'Welfare Sensitisation Week',    category: 'welfare',  event_date: '2023-06-05', _gradient: 'linear-gradient(90deg,#A8D5BA 0%,#00B140 100%)',             _accent: '#A8D5BA' },
  { id: 14, title: 'MYC 2024 — Opening Ceremony',  category: 'events',   event_date: '2024-02-10', _gradient: 'linear-gradient(145deg,#0c2340 0%,#1e40af 100%)',             _accent: '#93c5fd' },
  { id: 15, title: 'Pharmacology Quiz Bowl',        category: 'academic', event_date: '2024-01-28', _gradient: 'linear-gradient(145deg,#1e1b4b 0%,#4338ca 100%)',             _accent: '#a5b4fc' },
]

const CATEGORIES: { value: GalleryCategory | 'all'; label: string; count?: number }[] = [
  { value: 'all',      label: 'All' },
  { value: 'events',   label: 'Events' },
  { value: 'academic', label: 'Academic' },
  { value: 'health',   label: 'Health' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'social',   label: 'Social' },
  { value: 'welfare',  label: 'Welfare' },
]

const CATEGORY_STYLES: Record<GalleryCategory, { bg: string; text: string }> = {
  events:   { bg: 'rgba(60,181,89,0.15)',   text: '#3CB559' },
  academic: { bg: 'rgba(24,95,165,0.15)',   text: '#378ADD' },
  health:   { bg: 'rgba(200,153,26,0.15)',  text: '#C8991A' },
  outreach: { bg: 'rgba(60,181,89,0.12)',   text: '#2d6840' },
  social:   { bg: 'rgba(124,58,237,0.12)', text: '#7c3aed' },
  welfare:  { bg: 'rgba(220,38,38,0.10)',   text: '#dc2626' },
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
  const catStyle = CATEGORY_STYLES[item.category]
  const hasPhoto = Boolean(item.photo_url ?? item.thumbnail_url)

  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer group select-none"
      style={{ paddingBottom: '75%' /* 4:3 aspect ratio */ }}
    >
      <div className="absolute inset-0">
        {hasPhoto ? (
          <img
            src={item.thumbnail_url ?? item.photo_url}
            alt={item.title}
            className="w-full h-full object-cover object-center
                       group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          /* Gradient placeholder shown until real photo is provided */
          <div
            className="w-full h-full"
            style={{ background: item._gradient }}
          >
            {/* Subtle dot-pattern texture */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='1' fill='white'/%3E%3C/svg%3E")`,
              }}
            />
          </div>
        )}

        {/* Bottom scrim — always present so labels are readable over photos */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.10) 45%, transparent 100%)',
          }}
        />

        {/* Hover brightness overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Category pill — top left */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className="text-[10px] font-700 uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{
              background: catStyle.bg,
              color: item.photo_url ? '#fff' : catStyle.text,
              backdropFilter: 'blur(6px)',
              border: `1px solid ${catStyle.text}33`,
            }}
          >
            {item.category}
          </span>
        </div>

        {/* Zoom icon — top right, reveals on hover */}
        <div
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-all duration-200
                     translate-x-2 group-hover:translate-x-0"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
        >
          <ZoomIn className="h-3.5 w-3.5 text-white" />
        </div>

        {/* Title + date — bottom */}
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
  const catStyle = CATEGORY_STYLES[item.category]
  const hasPhoto = Boolean(item.photo_url)

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
            src={item.photo_url}
            alt={item.title}
            className="w-full object-contain"
            style={{ maxHeight: '80vh' }}
          />
        ) : (
          <div
            className="w-full flex items-center justify-center"
            style={{
              background: item._gradient,
              height: 'min(60vh, 480px)',
            }}
          >
            {/* Dot pattern */}
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
              <p className="text-sm font-500" style={{ color: item._accent }}>
                Photo coming soon
              </p>
            </div>
          </div>
        )}

        {/* Meta strip */}
        <div
          className="flex flex-wrap items-center gap-4 px-5 py-4"
          style={{ background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span
            className="text-[11px] font-700 uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: catStyle.bg, color: catStyle.text }}
          >
            {item.category}
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

  // Filter
  const filtered = activeCategory === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((g) => g.category === activeCategory)

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

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
      ? GALLERY_ITEMS.length
      : GALLERY_ITEMS.filter((g) => g.category === cat).length

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
            {filtered.length} {filtered.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>

        {/* ── Grid ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-5">🖼️</span>
            <h3 className="font-display text-xl font-semibold text-green-700 mb-2">No photos yet</h3>
            <p className="text-sm text-muted max-w-sm">
              Photos for this category will appear here once they're uploaded.
            </p>
          </div>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 space-y-0">
              {visible.map((item, idx) => (
                <div key={item.id} className="break-inside-avoid mb-3">
                  <GalleryCard item={item} onClick={() => openLightbox(idx)} />
                </div>
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
                  Showing {visible.length} of {filtered.length}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Backend note ── */}
        <p className="text-center text-xs text-muted mt-8 max-w-sm mx-auto leading-relaxed">
          Gradient placeholders are shown until real photos are uploaded via the admin panel
          and returned by the gallery API.
        </p>
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