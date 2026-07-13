import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns'

// ── Tailwind class merger ─────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  return format(new Date(dateStr), fmt)
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a")
}

export function relativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function deadlineUrgency(deadline: string): 'expired' | 'closing_today' | 'closing_soon' | 'open' {
  const d = new Date(deadline)
  if (isPast(d)) return 'expired'
  const days = differenceInDays(d, new Date())
  if (days === 0) return 'closing_today'
  if (days <= 7) return 'closing_soon'
  return 'open'
}

export function eventUrgency(startDatetime: string): 'today' | 'tomorrow' | 'this_week' | 'upcoming' | 'past' {
  const start = new Date(startDatetime)
  if (isPast(start)) return 'past'
  const days = differenceInDays(start, new Date())
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days <= 7) return 'this_week'
  return 'upcoming'
}

// ── File size ─────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// ── String helpers ────────────────────────────────────────────────────────────

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length).trimEnd() + '…'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// ── Content type labels ───────────────────────────────────────────────────────

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  exam_questions: 'Exam Questions',
  lecture_slides: 'Lecture Slides',
  tutorial_videos: 'Tutorial Videos',
  lab_reports: 'Lab Reports',
  field_materials: 'Field Materials',
}

export const TRIMESTER_LABELS: Record<string, string> = {
  first: '1st Trimester',
  second: '2nd Trimester',
  third: '3rd Trimester',
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  academic: 'Academic',
  welfare: 'Welfare',
  outreach: 'Outreach',
  social: 'Social',
  conference: 'Conference',
}

export const OPP_TYPE_LABELS: Record<string, string> = {
  internship: 'Internship',
  scholarship: 'Scholarship',
  job: 'Job',
  training: 'Training',
}

export const NEWS_CATEGORY_LABELS: Record<string, string> = {
  announcement: 'Announcement',
  academic_update: 'Academic Update',
  welfare_update: 'Welfare Update',
  events_recap: 'Events Recap',
  opportunities: 'Opportunities',
  general: 'General News',
}
