import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { welfareApi } from '@/api/services'
import type { ReportType } from '@/types'

const reportSchema = z.object({
  report_type: z.enum(['issue', 'support', 'confidential']),
  category: z.enum(['academic', 'welfare', 'financial', 'health', 'other']),
  description: z.string().min(10, 'Please describe your issue (min 10 characters)'),
  is_anonymous: z.boolean(),
  name: z.string().optional(),
  level: z.string().optional(),
  contact: z.string().optional(),
})
export type ReportFormValues = z.infer<typeof reportSchema>

export function useWelfareForm() {
  const [activeCard, setActiveCard] = useState<ReportType | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { is_anonymous: false, report_type: 'issue' },
  })

  const mutation = useMutation({
    mutationFn: (data: ReportFormValues) =>
      welfareApi.submitReport({
        ...data,
        level: data.level ? parseInt(data.level) : undefined,
      }),
    onSuccess: () => {
      setSubmitted(true)
      form.reset()
    },
  })

  const openForm = (type: ReportType) => {
    setActiveCard(type)
    form.setValue('report_type', type)
    setSubmitted(false)
  }

  const closeForm = () => {
    setActiveCard(null)
    setSubmitted(false)
    form.reset()
  }

  return {
    activeCard,
    submitted,
    form,
    mutation,
    isAnonymous: form.watch('is_anonymous'),
    openForm,
    closeForm,
  }
}
