import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, Upload } from 'lucide-react'
import { heroApi } from '@/api/services'
import { Button, EmptyState, Skeleton } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { cn } from '@/utils'
import type { HeroSlide, HeroSlideCreateRequest, HeroSlideUpdateRequest } from '@/types'


function SlideForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: HeroSlide
  onSave: (data: HeroSlideCreateRequest | HeroSlideUpdateRequest) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    image_url: initial?.image_url ?? '',
    tag: initial?.tag ?? '',
    heading: initial?.heading ?? '',
    highlight: initial?.highlight ?? '',
    sub: initial?.sub ?? '',
    primary_button_label: initial?.primary_button_label ?? '',
    primary_button_path: initial?.primary_button_path ?? '',
    secondary_button_label: initial?.secondary_button_label ?? '',
    secondary_button_path: initial?.secondary_button_path ?? '',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  })

  const set = (field: string, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  const inputClass = "form-input w-full"
  const labelClass = "text-xs font-700 text-muted uppercase tracking-wide mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
      <div>
        <label className={labelClass}>Image URL</label>
        <input className={inputClass} value={form.image_url} onChange={(e) => set('image_url', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tag</label>
          <input className={inputClass} value={form.tag} onChange={(e) => set('tag', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Sort Order</label>
          <input className={inputClass} type="number" value={form.sort_order} onChange={(e) => set('sort_order', parseInt(e.target.value) || 0)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Heading</label>
          <input className={inputClass} value={form.heading} onChange={(e) => set('heading', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Highlight</label>
          <input className={inputClass} value={form.highlight} onChange={(e) => set('highlight', e.target.value)} required />
        </div>
      </div>

      <div>
        <label className={labelClass}>Subtitle</label>
        <textarea className={inputClass} rows={3} value={form.sub} onChange={(e) => set('sub', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Primary Button Label</label>
          <input className={inputClass} value={form.primary_button_label} onChange={(e) => set('primary_button_label', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Primary Button Path</label>
          <input className={inputClass} value={form.primary_button_path} onChange={(e) => set('primary_button_path', e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Secondary Button Label</label>
          <input className={inputClass} value={form.secondary_button_label} onChange={(e) => set('secondary_button_label', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Secondary Button Path</label>
          <input className={inputClass} value={form.secondary_button_path} onChange={(e) => set('secondary_button_path', e.target.value)} required />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => set('is_active', e.target.checked)}
          className="w-4 h-4 rounded border-cream-dark text-green-600 focus:ring-green-500"
        />
        <span className="text-sm font-500 text-deep">Active</span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" size="md">
          {initial ? 'Update Slide' : 'Create Slide'}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}


export function HeroSlidesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<HeroSlide | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { data: slides, isLoading } = useQuery({
    queryKey: ['hero-slides', 'admin'],
    queryFn: () => heroApi.list(true),
  })

  const createMut = useMutation({
    mutationFn: (data: HeroSlideCreateRequest) => heroApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hero-slides'] }); setShowForm(false) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: HeroSlideUpdateRequest }) => heroApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hero-slides'] }); setEditing(null) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => heroApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hero-slides'] }); setDeleting(null) },
  })

  const imageMut = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => heroApi.uploadImage(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hero-slides'] }),
  })

  const sorted = slides ? [...slides].sort((a, b) => a.sort_order - b.sort_order) : []

  const modal = showForm || editing || deleting

  return (
    <>
      <PageHeader title="Hero Slides" subtitle="Manage the homepage carousel slides." />

      <div className="section-container section-padding">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-muted">{slides?.length ?? 0} slides</p>
          <Button variant="primary" size="md" onClick={() => setShowForm(true)} rightIcon={<Plus className="h-4 w-4" />}>
            Add Slide
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : !sorted.length ? (
          <EmptyState icon="🎠" title="No slides yet" description="Create your first hero slide to get started." />
        ) : (
          <div className="space-y-4">
            {sorted.map((slide, i) => (
              <div
                key={slide.id}
                className="card p-5 flex items-center gap-5 hover:shadow-card-md transition-all"
              >
                {/* Drag handle */}
                <div className="text-muted flex-shrink-0 cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Thumbnail */}
                <div className="w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-cream-dark">
                  {slide.image_url ? (
                    <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted font-mono">#{slide.sort_order}</span>
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-700 px-1.5 py-0.5 rounded-full', slide.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {slide.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {slide.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm font-600 text-deep truncate">{slide.tag} — {slide.heading} {slide.highlight}</p>
                  <p className="text-xs text-muted truncate">{slide.sub}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <label
                    className="p-2 rounded-lg text-green-700 hover:bg-green-50 transition-all cursor-pointer"
                    title="Upload replacement image"
                  >
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={imageMut.isPending}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) imageMut.mutate({ id: slide.id, file })
                        event.target.value = ''
                      }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      if (i > 0) {
                        const above = sorted[i - 1]
                        updateMut.mutate({ id: slide.id, data: { sort_order: above.sort_order } })
                        updateMut.mutate({ id: above.id, data: { sort_order: slide.sort_order } })
                      }
                    }}
                    disabled={i === 0}
                    className="p-2 rounded-lg text-muted hover:bg-cream-dark hover:text-deep disabled:opacity-30 transition-all"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (i < sorted.length - 1) {
                        const below = sorted[i + 1]
                        updateMut.mutate({ id: slide.id, data: { sort_order: below.sort_order } })
                        updateMut.mutate({ id: below.id, data: { sort_order: slide.sort_order } })
                      }
                    }}
                    disabled={i === sorted.length - 1}
                    className="p-2 rounded-lg text-muted hover:bg-cream-dark hover:text-deep disabled:opacity-30 transition-all"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditing(slide)}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(slide.id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => { setShowForm(false); setEditing(null); setDeleting(null) }}>
          <div className="bg-white rounded-3xl shadow-card-lg w-full max-w-lg p-8 animate-fade-up max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {deleting ? (
              <>
                <h3 className="font-display text-xl font-bold text-deep mb-2">Delete Slide</h3>
                <p className="text-sm text-muted mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <Button variant="destructive" size="md" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(deleting)}>Delete</Button>
                  <Button variant="ghost" size="md" onClick={() => setDeleting(null)}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display text-xl font-bold text-deep mb-6">
                  {editing ? 'Edit Slide' : 'New Slide'}
                </h3>
                <div className="flex-1 overflow-hidden">
                  <SlideForm
                    initial={editing ?? undefined}
                    onSave={(data) => {
                      if (editing) {
                        updateMut.mutate({ id: editing.id, data })
                      } else {
                        createMut.mutate(data as HeroSlideCreateRequest)
                      }
                    }}
                    onCancel={() => { setShowForm(false); setEditing(null) }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
