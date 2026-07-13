// ─────────────────────────────────────────────────────────────────────────────
// WelfarePage — redesigned
// Drop this file into src/pages/ (or wherever other-pages.tsx lives), then in
// other-pages.tsx replace the WelfarePage function body with:
//   export { WelfarePage } from './WelfarePage'
// All API logic, hooks, schema, and types are preserved exactly.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, CheckCircle, Phone, Shield, Clock, HeartHandshake, X } from 'lucide-react'
import { welfareApi } from '@/api/services'
import { extractError } from '@/api/client'
import { Button, Badge } from '@/components/ui'
import { cn, capitalize } from '@/utils'
import type { ReportType, WelfareCategory } from '@/types'

// ── Schema (unchanged) ────────────────────────────────────────────────────────

const reportSchema = z.object({
  report_type:  z.enum(['issue', 'support', 'confidential']),
  category:     z.enum(['academic', 'welfare', 'financial', 'health', 'other']),
  description:  z.string().min(10, 'Please describe your issue (min 10 characters)'),
  is_anonymous: z.boolean(),
  name:         z.string().optional(),
  level:        z.string().optional(),
  contact:      z.string().optional(),
})
type ReportForm = z.infer<typeof reportSchema>

// ── Card config ───────────────────────────────────────────────────────────────

const CARDS = [
  {
    type:       'issue'        as ReportType,
    icon:       '⚠️',
    num:        '01',
    title:      'Report an Issue',
    desc:       'Academic concerns, lecturer issues, facility problems, or general complaints.',
    cta:        'Report Now',
    accentBar:  'bg-red-500',
    numStyle:   'bg-red-100 text-red-600',
    activeRing: 'ring-red-300 border-red-400',
    btnVariant: 'destructive' as const,
  },
  {
    type:       'support'      as ReportType,
    icon:       '🧠',
    num:        '02',
    title:      'Request Support',
    desc:       'Personal struggles, financial difficulty, or academic pressure — we can help.',
    cta:        'Get Help',
    accentBar:  'bg-green-gradient',
    numStyle:   'bg-green-gradient text-white',
    activeRing: 'ring-green-300 border-green-700',
    btnVariant: 'primary'      as const,
  },
  {
    type:       'confidential' as ReportType,
    icon:       '🔒',
    num:        '03',
    title:      'Confidential Report',
    desc:       'Sensitive issues where your identity must remain fully protected and private.',
    cta:        'Submit Confidentially',
    accentBar:  'bg-violet-500',
    numStyle:   'bg-violet-100 text-violet-700',
    activeRing: 'ring-violet-300 border-violet-400',
    btnVariant: 'outline'      as const,
  },
]

// ── Trust strip items ─────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { Icon: Shield,        text: 'End-to-End Confidential' },
  { Icon: HeartHandshake,text: 'Welfare Committee Review' },
  { Icon: Clock,         text: '48-Hour Response' },
  { Icon: Phone,         text: 'Direct Officer Line' },
]

// ── WelfarePage ───────────────────────────────────────────────────────────────

export function WelfarePage() {
  const [activeCard, setActiveCard] = useState<ReportType | null>(null)
  const [submitted,  setSubmitted]  = useState(false)

  const { data: spotlight } = useQuery({
    queryKey: ['welfare', 'spotlight'],
    queryFn:  welfareApi.getSpotlight,
    staleTime: 5 * 60 * 1000,
  })

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors }, reset,
  } = useForm<ReportForm>({
    resolver:      zodResolver(reportSchema),
    defaultValues: { is_anonymous: false, report_type: 'issue' },
  })
  const isAnonymous = watch('is_anonymous')

  const mutation = useMutation({
    mutationFn: (data: ReportForm) =>
      welfareApi.submitReport({
        ...data,
        level: data.level ? parseInt(data.level) : undefined,
      }),
    onSuccess: () => { setSubmitted(true); reset() },
  })

  const handleCardClick = (type: ReportType) => {
    setActiveCard(type)
    setValue('report_type', type)
    setSubmitted(false)
  }

  const closeForm = () => {
    setActiveCard(null)
    setSubmitted(false)
    reset()
  }

  const activeConfig = CARDS.find((c) => c.type === activeCard)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden mt-16 lg:mt-[70px]"
        style={{
          background: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)',
          minHeight: '300px',
        }}
      >
        {/* Subtle cross / plus pattern */}
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Gold radial glow top-right */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 80% 20%, rgba(242,193,46,0.18) 0%, transparent 55%)',
          }}
        />

        <div className="relative section-container py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* Left: heading */}
            <div className="max-w-xl">
              {/* Live / secure badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-gradient animate-pulse flex-shrink-0" />
                <span className="text-white/75 text-xs font-600 tracking-wide">
                  Welfare Portal — Confidential &amp; Secure
                </span>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                Your Wellbeing<br />Matters Here
              </h1>
              <p className="text-white/65 text-base leading-relaxed max-w-md">
                Reach out, report an issue, or request support — we are here for every
                member of the GPSA-UDS community.
              </p>
            </div>

            {/* Right: stats */}
            <div className="flex flex-row lg:flex-col gap-3 flex-shrink-0">
              {[
                { value: '48h',   label: 'Avg Response Time' },
                { value: '100%',  label: 'Confidential' },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-7 py-4 text-center min-w-[110px]"
                >
                  <p className="font-display text-3xl font-bold text-white leading-none">{value}</p>
                  <p className="text-white/50 text-[11px] font-600 tracking-wide mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className="section-container section-padding">

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 mb-12 border-y border-cream-dark">
          {TRUST_ITEMS.map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-gradient flex items-center justify-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-700 text-[#1B3D22]">{text}</span>
            </div>
          ))}
        </div>

        {/* Section heading */}
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-[#1B3D22] mb-1">
            How can we help?
          </h2>
          <p className="text-sm text-muted">
            Select the option that best describes what you need.
          </p>
        </div>

        {/* ── ACTION CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
          {CARDS.map((c) => {
            const isActive = activeCard === c.type
            return (
              <div
                key={c.type}
                onClick={() => handleCardClick(c.type)}
                className={cn(
                  'relative bg-white border-2 rounded-2xl overflow-hidden flex flex-col gap-5 p-7 cursor-pointer',
                  'transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5',
                  isActive
                    ? `${c.activeRing} ring-4 shadow-lg`
                    : 'border-cream-dark hover:border-opacity-70'
                )}
              >
                {/* Top colour bar */}
                <div className={cn('absolute top-0 left-0 right-0 h-[3px]', c.accentBar)} />

                {/* Number badge */}
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-display font-bold',
                    c.numStyle,
                  )}
                >
                  {c.num}
                </span>

                {/* Text */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{c.icon}</span>
                    <h3 className="font-body font-700 text-[#1B3D22] text-[17px] leading-snug">
                      {c.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{c.desc}</p>
                </div>

                {/* CTA */}
                <Button
                  variant={c.btnVariant}
                  size="md"
                  className="mt-auto"
                  onClick={(e) => { e.stopPropagation(); handleCardClick(c.type) }}
                >
                  {c.cta}
                </Button>
              </div>
            )
          })}
        </div>

        {/* ── FORM PANEL (SLIDE-IN) ── */}
        {activeCard && (
          <>
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
              style={{
                opacity: activeCard ? 1 : 0,
                pointerEvents: activeCard ? 'auto' : 'none',
              }}
              onClick={closeForm}
            />

            {/* Slide-in panel */}
            <div
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto z-50 transform transition-transform duration-300 ease-out"
              style={{
                transform: activeCard ? 'translateX(0)' : 'translateX(100%)',
              }}
            >
              {/* Form header (sticky) */}
              <div
                className="sticky top-0 flex items-center justify-between px-8 py-6 border-b border-cream-dark"
                style={{ background: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)' }}
              >
                <div>
                  <p className="text-green-300 text-[10px] font-700 uppercase tracking-widest mb-1">
                    {activeCard === 'issue'
                      ? 'Issue Report'
                      : activeCard === 'support'
                      ? 'Support Request'
                      : 'Confidential Submission'}
                  </p>
                  <h2 className="font-display text-lg font-bold text-white">
                    {activeConfig?.title}
                  </h2>
                </div>
                <button
                  onClick={closeForm}
                  className="text-white/50 hover:text-white transition-colors rounded-lg p-2 hover:bg-white/10 flex-shrink-0"
                  aria-label="Close form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form content */}
              <div className="p-8">
                {submitted ? (
                  /* ── Success state ── */
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-green-gradient rounded-full mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-green-700 mb-2">
                      Received — Thank You
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mb-6">
                      Your report has been securely received. Our Welfare Committee will
                      follow up within 48 hours. All submissions are handled with full
                      confidentiality.
                    </p>
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full"
                      onClick={() => { setActiveCard(null); setSubmitted(false) }}
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  /* ── Form ── */
                  <>
                    {mutation.error && (
                      <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {extractError(mutation.error)}
                      </div>
                    )}

                    <form
                      onSubmit={handleSubmit((d) => mutation.mutate(d))}
                      className="space-y-4"
                    >
                      {/* Identity fields (non-confidential, non-anonymous) */}
                      {activeCard !== 'confidential' && !isAnonymous && (
                        <>
                          <div>
                            <label className="form-label">Full Name</label>
                            <input
                              {...register('name')}
                              className="form-input"
                              placeholder="Your name"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="form-label">Level</label>
                              <select {...register('level')} className="form-select">
                                <option value="">Select…</option>
                                {[100, 200, 300, 400, 500, 600].map((l) => (
                                  <option key={l} value={l}>Level {l}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="form-label">Contact</label>
                              <input
                                {...register('contact')}
                                className="form-input"
                                placeholder="Email or phone (optional)"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Category */}
                      <div>
                        <label className="form-label">Category *</label>
                        <select
                          {...register('category')}
                          className={cn('form-select', errors.category && 'form-input-error')}
                        >
                          <option value="">Select a category…</option>
                          {(['academic', 'welfare', 'financial', 'health', 'other'] as WelfareCategory[]).map(
                            (cat) => (
                              <option key={cat} value={cat}>{capitalize(cat)}</option>
                            ),
                          )}
                        </select>
                        {errors.category && (
                          <p className="form-error">{errors.category.message}</p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="form-label">Description *</label>
                        <textarea
                          {...register('description')}
                          className={cn('form-input resize-none h-28', errors.description && 'form-input-error')}
                          placeholder="Describe your issue or request in detail…"
                        />
                        {errors.description && (
                          <p className="form-error">{errors.description.message}</p>
                        )}
                      </div>

                      {/* Anonymous toggle */}
                      {activeCard !== 'confidential' && (
                        <label className="flex items-center gap-3 cursor-pointer select-none py-1">
                          <div
                            onClick={() => setValue('is_anonymous', !isAnonymous)}
                            className={cn(
                              'w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0',
                              isAnonymous
                                ? 'bg-green-gradient border-green-700'
                                : 'border-cream-dark bg-white',
                            )}
                          >
                            {isAnonymous && (
                              <span className="text-white text-[10px] font-bold">✓</span>
                            )}
                          </div>
                          <span className="text-sm font-500 text-[#1B3D22]">
                            Submit Anonymously
                          </span>
                        </label>
                      )}

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={mutation.isPending}
                        className="w-full !mt-6"
                      >
                        Submit Report
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── TRUST QUOTE ── */}
        <div
          className="relative overflow-hidden rounded-3xl mb-12 p-8 lg:p-10"
          style={{ background: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)' }}
        >
          {/* Decorative large quote mark */}
          <div
            className="absolute top-2 right-6 font-display font-bold text-white/5 select-none leading-none"
            style={{ fontSize: '160px', lineHeight: 1 }}
          >
            "
          </div>

          <div className="relative">
            <p className="text-lg lg:text-xl text-white/80 leading-relaxed italic font-body max-w-2xl mb-7">
              "All reports are handled with care and confidentiality. Our Welfare Committee
              reviews every submission. No concern is too small — your wellbeing is our priority."
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Attribution */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <HeartHandshake className="h-4 w-4 text-green-300" />
                </div>
                <div>
                  <p className="text-white text-sm font-700">GPSA-UDS Welfare Committee</p>
                  <p className="text-white/35 text-xs">Confidential Welfare Portal</p>
                </div>
              </div>

              {/* Emergency contact pill */}
              <div className="inline-flex flex-col bg-red-500/15 border border-red-400/25 rounded-2xl px-5 py-3 flex-shrink-0">
                <span className="text-red-300 text-[10px] font-700 uppercase tracking-widest mb-0.5">
                  🚨 Emergency Contact
                </span>
                <span className="text-white font-display font-bold text-base tracking-wide">
                  +233 XXX XXX XXX
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ISSUE OF THE WEEK ── */}
        {spotlight && (
          <div className="mb-14">
            {/* Section divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-cream-dark" />
              <span className="text-[11px] font-700 text-muted uppercase tracking-widest">
                This Week's Spotlight
              </span>
              <div className="h-px flex-1 bg-cream-dark" />
            </div>

            <div className="bg-[#FFFBEB] border-2 border-[#F2C12E]/40 rounded-2xl overflow-hidden max-w-2xl">
              {/* Card header bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F2C12E]/30 bg-[#F2C12E]/10">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📌</span>
                  <h3 className="font-body font-700 text-[#1B3D22] text-sm">
                    Issue of the Week
                  </h3>
                </div>
                <Badge variant="gold">Community Concern</Badge>
              </div>

              {/* Card body */}
              <div className="p-6 lg:p-7">
                <blockquote className="text-sm lg:text-[15px] text-[#3a4a3a] italic leading-relaxed mb-5 border-l-3 border-[#F2C12E] pl-4">
                  "{spotlight.summary}"
                </blockquote>

                {/* Action taken inset */}
                <div className="bg-white/70 border border-[#F2C12E]/30 rounded-xl p-4 lg:p-5">
                  <p className="text-[10px] font-700 text-[#8a6a00] uppercase tracking-widest mb-1.5">
                    Action Taken
                  </p>
                  <p className="text-sm text-[#1B3D22] leading-relaxed">
                    {spotlight.action_taken}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}