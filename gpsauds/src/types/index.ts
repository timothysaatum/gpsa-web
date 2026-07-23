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

export type GalleryCategory = 'events' | 'academic' | 'health' | 'outreach' | 'social' | 'welfare'

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

export interface WelfareConfig {
  emergency_contact: string
  avg_response_time_hours: number
  confidential_percent: number
  total_reports: number
  total_resolved: number
  resolved_this_month: number
  trust_items: { icon: string; text: string }[]
}

export interface WelfareStats {
  total_reports: number
  pending: number
  in_review: number
  resolved: number
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

// ── Gallery ──────────────────────────────────────────────────────────────────

export interface GalleryItem {
  id: string
  image_url: string
  thumbnail_url: string | null
  title: string
  description: string | null
  category: GalleryCategory
  event_date: string | null
  sort_order: number
  is_published: boolean
  created_at: string
}

export type ContactStatus = 'pending' | 'in_progress' | 'resolved' | 'spam'

export interface ContactSubmission {
  id: string
  reference: string
  full_name: string
  email: string
  phone: string | null
  category: string
  subject: string
  message: string
  status: ContactStatus
  admin_notes: string | null
  assigned_to: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

// ── Leadership ───────────────────────────────────────────────────────────────

export interface Leader {
  id: string
  term_id: string
  full_name: string
  office: string
  bio: string | null
  email: string | null
  phone: string | null
  photo_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface LeadershipTerm {
  id: string
  title: string
  academic_year: string
  start_date: string | null
  end_date: string | null
  theme: string | null
  summary: string | null
  is_current: boolean
  sort_order: number
  created_at: string
  leaders: Leader[]
}

// ── Hero Slides ──────────────────────────────────────────────────────────────

export interface HeroSlide {
  id: string
  image_url: string
  tag: string
  heading: string
  highlight: string
  sub: string
  primary_button_label: string
  primary_button_path: string
  secondary_button_label: string
  secondary_button_path: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface HeroSlideCreateRequest {
  image_url: string
  tag: string
  heading: string
  highlight: string
  sub: string
  primary_button_label: string
  primary_button_path: string
  secondary_button_label: string
  secondary_button_path: string
  sort_order?: number
  is_active?: boolean
}

export interface HeroSlideUpdateRequest {
  image_url?: string
  tag?: string
  heading?: string
  highlight?: string
  sub?: string
  primary_button_label?: string
  primary_button_path?: string
  secondary_button_label?: string
  secondary_button_path?: string
  sort_order?: number
  is_active?: boolean
}

export interface Feedback {
  id: string
  entity_type: FeedbackEntityType
  entity_id: string
  rating: number
  comment: string | null
  created_at: string
}

// ── About ───────────────────────────────────────────────────────────────────

export interface PresidentWelcome {
  name: string
  title: string
  admin_year: string
  photo_url: string | null
  message: string
}

export interface CoreValueDetailed {
  name: string
  description: string
}

export interface WhatWeDoItem {
  title: string
  description: string
  items: string[]
  href?: string | null
}

export interface GovernanceBody {
  title: string
  description: string
}

export interface StrategicPriority {
  title: string
  description: string
}

export interface ImpactMetrics {
  reporting_period: string
  students_represented: string
  programmes_organised: string
  welfare_interventions: string
  outreach_beneficiaries: string
  opportunities_shared: string
  active_partnerships: string
}

export interface ImpactPageData {
  settings: {
    hero_eyebrow?: string
    hero_title_primary?: string
    hero_title_secondary?: string
    hero_intro?: string
    hero_image_url?: string
    hero_image_alt?: string
    commitment_title?: string
    commitment_description?: string
    vision_quote?: string
    vision_signature?: string
    cta_title?: string
    cta_description?: string
  }
  reporting_period: null | { id: string; name: string; academic_year: string }
  priorities: Array<{ id: string; title: string; slug: string; description: string; icon_name?: string | null; detail_url?: string | null }>
  metrics: Array<{ id: string; label: string; description?: string | null; display_value: string; prefix?: string | null; suffix?: string | null; icon_name?: string | null }>
  focus_areas: Array<{ id: string; title: string; slug: string; summary: string; image_url?: string | null; image_alt?: string | null; icon_name?: string | null; detail_url?: string | null }>
  featured_initiatives: Array<{ id: string; title: string; slug: string; summary: string; image_url?: string | null; image_alt?: string | null }>
  sdg_alignments: Array<{ id: string; summary: string; goal: { id: string; number: number; title: string; official_color: string; official_url: string } }>
  reports: Array<{ id: string; title: string; description?: string | null; download_url: string; file_name?: string | null }>
}

export interface GovernancePageData {
  settings: {
    hero_eyebrow?: string
    hero_title_primary?: string
    hero_title_secondary?: string
    hero_intro?: string
    hero_image_url?: string
    hero_image_alt?: string
    resource_card_title?: string
    resource_card_subtitle?: string
    resource_card_description?: string
    faq_quote?: string
    cta_title?: string
    cta_description?: string
  }
  categories: Array<{ id: string; name: string; slug: string; description?: string | null; icon_name?: string | null }>
  documents: Array<{
    id: string
    title: string
    slug: string
    description?: string | null
    document_type: string
    version?: string | null
    edition?: string | null
    academic_year?: string | null
    publication_date?: string | null
    file_name?: string | null
    file_extension?: string | null
    file_size_bytes?: number | null
    category: { name: string; slug: string }
    view_url?: string | null
    download_url?: string | null
  }>
  pagination: { page: number; page_size: number; total: number; pages: number }
  faqs: Array<{ id: string; question: string; slug: string; answer: string; category?: string | null; related_url?: string | null }>
}

export interface Partner {
  name: string
  logo_key: string
}

export interface AboutContent {
  name: string
  short_name: string
  tagline: string
  overview: string
  mission: string
  vision: string
  values: string[]
  core_values_detailed?: CoreValueDetailed[]
  pillars: { title: string; body: string }[]
  what_we_do?: WhatWeDoItem[]
  timeline: { year: string; title: string; body: string }[]
  stats: SiteStats
  impact_metrics?: ImpactMetrics
  president_welcome?: PresidentWelcome
  governance?: GovernanceBody[]
  strategic_priorities?: StrategicPriority[]
  partners?: Partner[]
  featured_news: {
    id: string
    title: string
    summary: string
    category: string
    published_at: string | null
  } | null
  upcoming_events: {
    id: string
    title: string
    location: string
    start_datetime: string
    event_type: string
  }[]
  open_opportunities: {
    id: string
    title: string
    organization: string
    deadline: string
    opp_type: string
  }[]
  gallery_highlights: {
    id: string
    title: string
    image_url: string
    thumbnail_url: string | null
    category: string
  }[]
  welfare: WelfareConfig
}

export interface HistoryMilestone {
  year_label: string
  title: string
  summary: string
  icon_name?: string | null
  image_url?: string | null
}

export interface HistoryAchievement {
  category: string
  title: string
  summary: string
  icon_name?: string | null
}

export interface HistoryMetric {
  value: string
  label: string
  icon_name?: string | null
  reporting_period?: string | null
}

export interface HistoryTradition {
  title: string
  description: string
  icon_name?: string | null
}

export interface HistoryContent {
  hero_eyebrow: string
  hero_title: string
  hero_intro_primary: string
  hero_intro_secondary: string
  milestones: HistoryMilestone[]
  achievements: HistoryAchievement[]
  metrics: HistoryMetric[]
  traditions: HistoryTradition[]
  gallery_preview: {
    id: string
    title: string
    image_url: string
    thumbnail_url: string | null
    category: string
  }[]
}

export interface CmsPage {
  slug: string
  title: string
  content: Record<string, unknown>
  is_published: boolean
  version: number
}

// ── Past Leadership & Recognition ──────────────────────────────────────────

export interface LegacyLeaderSummary {
  id?: string | null
  full_name: string
  office: string
  photo_url?: string | null
}

export interface LegacyAdministrationLeaderGroup {
  president?: LegacyLeaderSummary | null
  vice_president?: LegacyLeaderSummary | null
  other_executives_count: number
  other_executives: LegacyLeaderSummary[]
}

export interface LegacyAdministrationAchievement {
  id: string
  title: string
  summary: string
  category?: string | null
  image_url?: string | null
}

export interface LegacyAdministration {
  id: string
  academic_year: string
  slug: string
  title: string
  theme?: string | null
  slogan?: string | null
  starts_at?: string | null
  ends_at?: string | null
  group_photo_url?: string | null
  group_photo_alt?: string | null
  is_current: boolean
  status: string
  summary?: string | null
  executive_count: number
  committee_count: number
  initiatives_count: number
  lives_impacted?: string | null
  display_order: number
  top_leadership: LegacyAdministrationLeaderGroup
  achievements: LegacyAdministrationAchievement[]
}

export interface LegacyTimelineEvent {
  id: string
  year_label: string
  event_date?: string | null
  title: string
  summary: string
  icon_name?: string | null
  verification_status: string
  status: string
  display_order: number
}

export interface RecognitionCategoryItem {
  id: string
  name: string
  slug: string
  description: string
  icon_name?: string | null
  honourees_count: number
}

export interface RecognitionHonoureeItem {
  id: string
  category_id: string
  full_name: string
  title: string
  citation?: string | null
  recognition_year?: string | null
  class_year?: string | null
  photo_url?: string | null
  photo_alt?: string | null
}

export interface LegacyAwardItem {
  id: string
  title: string
  slug: string
  award_year: string
  category: string
  recipient_type: string
  recipient_name?: string | null
  citation: string
  image_url?: string | null
  image_alt?: string | null
  is_featured: boolean
  display_order: number
}

export interface LegacyHeroStat {
  label: string
  value: string
  icon_name?: string | null
}

export interface LegacyPageContent {
  hero_eyebrow: string
  hero_headline_primary: string
  hero_headline_secondary: string
  hero_supporting_text: string
  hero_quote_text: string
  hero_quote_citation: string
  statistics: LegacyHeroStat[]
  administrations: LegacyAdministration[]
  selected_administration?: LegacyAdministration | null
  timeline: LegacyTimelineEvent[]
  recognition_categories: RecognitionCategoryItem[]
  featured_awards: LegacyAwardItem[]
}

export interface HistoricalRecordSubmissionInput {
  submitter_name: string
  submitter_email: string
  submitter_phone?: string
  relationship_to_gpsa?: string
  record_type: string
  title: string
  description: string
  administration_year?: string
  event_date?: string
  consent_to_archive: boolean
  consent_to_publish: boolean
  file?: File
}

export interface LeaderNominationInput {
  nominee_name: string
  nominee_email?: string
  category_id?: string
  administration_year?: string
  reason: string
  achievements?: string
  nominator_name: string
  nominator_email: string
  relationship_to_nominee?: string
  consent_confirmed: boolean
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

export interface SiteStats {
  total_users: number
  active_members: number
  total_events: number
  total_resources: number
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor: User | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  request_id: string | null
  created_at: string
}

export interface AdminDashboard {
  users: number
  news_posts: number
  events: number
  opportunities: number
  gallery_images: number
  academic_resources: number
  welfare_reports: number
  pending_welfare_reports: number
  recent_audit: AuditLog[]
}

export interface ApiError {
  detail: string
  errors?: Array<{ field: string; message: string; type: string }>
  request_id?: string
}
