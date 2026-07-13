// ── Enums ─────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'exec' | 'admin'

export type ContentType =
  | 'exam_questions'
  | 'lecture_slides'
  | 'tutorial_videos'
  | 'lab_reports'
  | 'field_materials'

export type Trimester = 'first' | 'second' | 'third'
export type FileType = 'pdf' | 'video' | 'doc' | 'image' | 'other'

export type EventType = 'academic' | 'welfare' | 'outreach' | 'social' | 'conference'
export type EventStatus = 'upcoming' | 'ongoing' | 'past'

export type ReportType = 'issue' | 'support' | 'confidential'
export type WelfareCategory = 'academic' | 'welfare' | 'financial' | 'health' | 'other'
export type ReportStatus = 'pending' | 'in_review' | 'resolved'

export type OpportunityType = 'internship' | 'scholarship' | 'job' | 'training'

export type NewsCategory =
  | 'announcement'
  | 'academic_update'
  | 'welfare_update'
  | 'events_recap'
  | 'opportunities'
  | 'general'

export type NotificationType =
  | 'event_reminder'
  | 'event_registration'
  | 'welfare_status_change'
  | 'opportunity_posted'
  | 'news_published'
  | 'general'

export type FeedbackEntityType = 'event' | 'academic_resource' | 'opportunity'

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  full_name: string
  email: string
  password: string
  phone?: string
  student_id?: string
  level?: number
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  full_name: string
  email: string
  phone: string | null
  student_id: string | null
  level: number | null
  role: UserRole
  email_verified: boolean
  created_at: string
}

export interface UserSummary {
  id: string
  full_name: string
  role: UserRole
}

// ── Academic Resources ────────────────────────────────────────────────────────

export interface Course {
  id: string
  name: string
  code: string | null
  level: number
}

export interface AcademicResource {
  id: string
  title: string
  content_type: ContentType
  course_id: string
  course: Course | null
  level: number
  trimester: Trimester
  file_type: FileType
  mime_type: string
  file_size_bytes: number
  duration_mins: number | null
  is_featured: boolean
  is_published: boolean
  download_url: string | null
  created_at: string
}

// ── Events ────────────────────────────────────────────────────────────────────

export interface Event {
  id: string
  title: string
  description: string
  event_type: EventType
  status: EventStatus
  start_datetime: string
  end_datetime: string | null
  location: string
  banner_emoji: string | null
  banner_image_url: string | null
  is_featured: boolean
  agenda: Record<string, unknown> | null
  speakers: unknown[] | null
  created_at: string
}

export interface EventSummary {
  id: string
  title: string
  event_type: EventType
  status: EventStatus
  start_datetime: string
  location: string
  banner_emoji: string | null
  is_featured: boolean
}

export interface EventRegistration {
  id: string
  event_id: string
  full_name: string
  level: number | null
  contact: string | null
  registered_at: string
}

// ── Welfare ───────────────────────────────────────────────────────────────────

export interface WelfareReport {
  id: string
  report_type: ReportType
  category: WelfareCategory
  description: string
  is_anonymous: boolean
  name: string | null
  level: number | null
  status: ReportStatus
  submitted_at: string
}

export interface WelfareSpotlight {
  id: string
  summary: string
  action_taken: string
  is_active: boolean
  created_at: string
}

// ── Opportunities ─────────────────────────────────────────────────────────────

export interface Opportunity {
  id: string
  title: string
  organization: string
  opp_type: OpportunityType
  description: string
  location: string | null
  deadline: string
  external_link: string
  is_active: boolean
  is_published: boolean
  created_at: string
}

// ── News ──────────────────────────────────────────────────────────────────────

export interface NewsPost {
  id: string
  title: string
  category: NewsCategory
  summary: string
  body: string
  banner_emoji: string | null
  is_featured: boolean
  is_urgent: boolean
  is_strip_announcement: boolean
  is_published: boolean
  published_at: string | null
  attachments: string[] | null
  created_at: string
}

export interface NewsPostSummary {
  id: string
  title: string
  category: NewsCategory
  summary: string
  banner_emoji: string | null
  is_featured: boolean
  is_urgent: boolean
  published_at: string | null
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  notification_type: NotificationType
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

// ── Certificates ──────────────────────────────────────────────────────────────

export interface Certificate {
  id: string
  event_id: string
  user_id: string
  verification_code: string
  download_url: string | null
  issued_at: string
}

export interface CertificateVerify {
  verification_code: string
  event_title: string
  recipient_name: string
  issued_at: string
  is_valid: boolean
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export interface Feedback {
  id: string
  entity_type: FeedbackEntityType
  entity_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface FeedbackSummary {
  entity_type: FeedbackEntityType
  entity_id: string
  average_rating: number
  total_count: number
}

// ── API Wrappers ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  offset: number
  limit: number
}

export interface MessageResponse {
  message: string
}

export interface ApiError {
  detail: string
  errors?: Array<{ field: string; message: string; type: string }>
  request_id?: string
}
