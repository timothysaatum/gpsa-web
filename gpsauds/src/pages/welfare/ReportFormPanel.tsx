import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn, capitalize } from '@/utils'
import { extractError } from '@/api/client'
import type { ReportType, WelfareCategory } from '@/types'
import type { UseFormReturn } from 'react-hook-form'
import type { UseMutationResult } from '@tanstack/react-query'
import type { ReportFormValues } from './useWelfareForm'
import type { WelfareReport } from '@/types'

interface ReportFormPanelProps {
  activeCard: ReportType | null
  submitted: boolean
  form: UseFormReturn<ReportFormValues>
  mutation: UseMutationResult<WelfareReport, Error, ReportFormValues>
  isAnonymous: boolean
  onClose: () => void
}

const CARD_LABELS: Record<ReportType, string> = {
  issue: 'Issue Report',
  support: 'Support Request',
  confidential: 'Confidential Submission',
}

const CARD_TITLES: Record<ReportType, string> = {
  issue: 'Report an Issue',
  support: 'Request Support',
  confidential: 'Confidential Report',
}

export function ReportFormPanel({ activeCard, submitted, form, mutation, isAnonymous, onClose }: ReportFormPanelProps) {
  const { register, handleSubmit, setValue, formState: { errors }, reset } = form

  useEffect(() => {
    if (!activeCard) reset()
  }, [activeCard, reset])

  if (!activeCard) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        style={{ opacity: activeCard ? 1 : 0 }}
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto z-50 transform transition-transform duration-300 ease-out"
        style={{ transform: activeCard ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="sticky top-0 flex items-center justify-between px-8 py-6 border-b border-cream-dark" style={{ background: 'var(--legacy-gradient)' }}>
          <div>
            <p className="text-green-300 text-[10px] font-700 uppercase tracking-widest mb-1">
              {CARD_LABELS[activeCard]}
            </p>
            <h2 className="font-display text-lg font-bold text-white">
              {CARD_TITLES[activeCard]}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors rounded-lg p-2 hover:bg-white/10 flex-shrink-0"
            aria-label="Close form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8">
          {submitted ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-gradient rounded-full mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-green-700 mb-2">Received — Thank You</h3>
              <p className="text-sm text-muted leading-relaxed mb-6">
                Your report has been securely received. Our Welfare Committee will
                follow up within 48 hours. All submissions are handled with full confidentiality.
              </p>
              <Button variant="outline" size="md" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <>
              {mutation.error && (
                <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {extractError(mutation.error)}
                </div>
              )}

              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                {activeCard !== 'confidential' && !isAnonymous && (
                  <>
                    <div>
                      <label className="form-label">Full Name</label>
                      <input {...register('name')} className="form-input" placeholder="Your name" />
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
                        <input {...register('contact')} className="form-input" placeholder="Email or phone (optional)" />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="form-label">Category *</label>
                  <select
                    {...register('category')}
                    className={cn('form-select', errors.category && 'form-input-error')}
                  >
                    <option value="">Select a category…</option>
                    {(['academic', 'welfare', 'financial', 'health', 'other'] as WelfareCategory[]).map((cat) => (
                      <option key={cat} value={cat}>{capitalize(cat)}</option>
                    ))}
                  </select>
                  {errors.category && <p className="form-error">{errors.category.message}</p>}
                </div>

                <div>
                  <label className="form-label">Description *</label>
                  <textarea
                    {...register('description')}
                    className={cn('form-input resize-none h-28', errors.description && 'form-input-error')}
                    placeholder="Describe your issue or request in detail…"
                  />
                  {errors.description && <p className="form-error">{errors.description.message}</p>}
                </div>

                {activeCard !== 'confidential' && (
                  <label className="flex items-center gap-3 cursor-pointer select-none py-1">
                    <div
                      onClick={() => setValue('is_anonymous', !isAnonymous)}
                      className={cn(
                        'w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0',
                        isAnonymous ? 'bg-green-gradient border-green-700' : 'border-cream-dark bg-white',
                      )}
                    >
                      {isAnonymous && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="text-sm font-500 text-deep">Submit Anonymously</span>
                  </label>
                )}

                <Button type="submit" variant="primary" size="lg" loading={mutation.isPending} className="w-full !mt-6">
                  Submit Report
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
