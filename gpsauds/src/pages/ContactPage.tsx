import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, CheckCircle2, Clock3, Mail, MapPin, Phone, Send } from 'lucide-react'
import { contactApi } from '@/api/services'
import { extractError } from '@/api/client'
import { Button } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { useCmsPageSettings } from '@/hooks/useCmsPageSettings'
import { contactPageDefaults } from '@/config/cmsPageDefaults'
import { cn } from '@/utils'

const contactSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name.').max(150),
  email: z.string().trim().email('Enter a valid email address.').max(320),
  phone: z.string().trim().max(40).optional(),
  category: z.enum(['general', 'membership', 'academics', 'events', 'partnership', 'media', 'other']),
  subject: z.string().trim().min(3, 'Enter a subject.').max(200),
  message: z.string().trim().min(20, 'Please provide at least 20 characters.').max(5000),
  consent: z.boolean().refine((value) => value, 'Please confirm the privacy notice.'),
  website: z.string().max(0).default(''),
})

type ContactForm = z.infer<typeof contactSchema>

const categories = [
  ['general', 'General enquiry'],
  ['membership', 'Membership'],
  ['academics', 'Academics'],
  ['events', 'Events'],
  ['partnership', 'Partnership or sponsorship'],
  ['media', 'Media'],
  ['other', 'Other'],
] as const

export function ContactPage() {
  const { settings } = useCmsPageSettings('contact', contactPageDefaults)
  const [receipt, setReceipt] = useState<{ reference: string; message: string } | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { category: 'general', consent: false, website: '' },
  })
  const submit = useMutation({
    mutationFn: contactApi.submit,
    onSuccess: (result) => {
      setReceipt(result)
      reset({ category: 'general', consent: false, website: '' })
    },
  })

  const contactCards = [
    { Icon: MapPin, title: settings.office_title, value: settings.office_address },
    { Icon: Mail, title: settings.email_title, value: settings.public_email, href: `mailto:${settings.public_email}` },
    { Icon: Phone, title: settings.phone_title, value: settings.public_phone, href: `tel:${settings.public_phone.replace(/\s/g, '')}` },
    { Icon: Clock3, title: settings.hours_title, value: settings.office_hours },
  ]

  return (
    <>
      <PageHeader title={settings.page_title} subtitle={settings.page_subtitle} />
      <main className="section-container section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr] gap-8 lg:gap-12 items-start">
          <section aria-labelledby="contact-details-title">
            <div className="rounded-3xl bg-brand p-7 sm:p-9 text-white shadow-card-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 mb-6">
                <Building2 className="h-6 w-6 text-gold-400" />
              </div>
              <h2 id="contact-details-title" className="font-display text-3xl font-bold mb-2">Contact details</h2>
              <p className="text-white/65 text-sm mb-7">{settings.response_note}</p>
              <div className="space-y-5">
                {contactCards.map(({ Icon, title, value, href }) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="h-4 w-4 text-gold-400" />
                    </span>
                    <div>
                      <p className="text-[11px] font-700 uppercase tracking-wider text-white/45">{title}</p>
                      {href ? <a href={href} className="text-sm text-white/90 hover:text-gold-300">{value}</a> : <p className="text-sm text-white/90">{value}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-cream-dark bg-white p-6 sm:p-9 shadow-card" aria-labelledby="contact-form-title">
            <h2 id="contact-form-title" className="font-display text-3xl font-bold text-deep">{settings.form_title}</h2>
            <p className="text-sm text-muted mt-1 mb-7">{settings.form_description}</p>

            {receipt ? (
              <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-7 text-center">
                <CheckCircle2 className="h-11 w-11 text-green-700 mx-auto mb-3" />
                <h3 className="font-display text-2xl font-bold text-green-800">Message received</h3>
                <p className="text-sm text-green-800/75 mt-2">{receipt.message}</p>
                <p className="mt-4 rounded-xl bg-white px-4 py-3 font-mono text-sm font-bold text-green-800">Reference: {receipt.reference}</p>
                <Button className="mt-5" variant="outline" onClick={() => setReceipt(null)}>Send another message</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit((values) => submit.mutate(values))} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Full name *" error={errors.full_name?.message}><input {...register('full_name')} autoComplete="name" className={cn('form-input', errors.full_name && 'form-input-error')} /></FormField>
                  <FormField label="Email *" error={errors.email?.message}><input {...register('email')} type="email" autoComplete="email" className={cn('form-input', errors.email && 'form-input-error')} /></FormField>
                  <FormField label="Phone"><input {...register('phone')} type="tel" autoComplete="tel" className="form-input" /></FormField>
                  <FormField label="Enquiry type *" error={errors.category?.message}>
                    <select {...register('category')} className="form-select">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  </FormField>
                </div>
                <FormField label="Subject *" error={errors.subject?.message}><input {...register('subject')} className={cn('form-input', errors.subject && 'form-input-error')} /></FormField>
                <FormField label="Message *" error={errors.message?.message}>
                  <textarea {...register('message')} rows={7} className={cn('form-input resize-y', errors.message && 'form-input-error')} placeholder="Tell us how we can help…" />
                </FormField>
                <div className="absolute -left-[10000px]" aria-hidden="true"><label>Website<input {...register('website')} tabIndex={-1} autoComplete="off" /></label></div>
                <label className="flex items-start gap-3 text-sm text-muted cursor-pointer">
                  <input {...register('consent')} type="checkbox" className="mt-1 h-4 w-4 rounded border-cream-dark text-green-700" />
                  <span>{settings.privacy_note}</span>
                </label>
                {errors.consent && <p className="form-error">{errors.consent.message}</p>}
                {submit.error && <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{extractError(submit.error)}</p>}
                <Button type="submit" size="lg" loading={submit.isPending} leftIcon={<Send className="h-4 w-4" />}>Send message</Button>
              </form>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="form-label">{label}</span>{children}{error && <span className="form-error">{error}</span>}</label>
}
