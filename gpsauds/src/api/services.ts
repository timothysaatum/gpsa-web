import api from './client'
import type {
  AcademicResource,
  Certificate,
  CertificateVerify,
  Course,
  Event,
  EventRegistration,
  EventStatus,
  EventSummary,
  EventType,
  Feedback,
  FeedbackEntityType,
  FeedbackSummary,
  LoginRequest,
  MessageResponse,
  NewsCategory,
  NewsPost,
  NewsPostSummary,
  Notification,
  Opportunity,
  OpportunityType,
  PaginatedResponse,
  RegisterRequest,
  ReportStatus,
  ReportType,
  TokenResponse,
  Trimester,
  User,
  WelfareReport,
  WelfareSpotlight,
} from '@/types'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<User>('/auth/register', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refresh_token: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token }).then((r) => r.data),

  logout: (refresh_token: string) =>
    api.post<MessageResponse>('/auth/logout', { refresh_token }).then((r) => r.data),

  logoutAll: () =>
    api.post<MessageResponse>('/auth/logout-all').then((r) => r.data),

  verifyEmail: (token: string) =>
    api.post<MessageResponse>('/auth/verify-email', { token }).then((r) => r.data),

  resendVerification: (email: string) =>
    api.post<MessageResponse>('/auth/resend-verification', { email }).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<MessageResponse>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, new_password: string) =>
    api.post<MessageResponse>('/auth/reset-password', { token, new_password }).then((r) => r.data),

  changePassword: (current_password: string, new_password: string) =>
    api
      .post<MessageResponse>('/auth/change-password', { current_password, new_password })
      .then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  updateProfile: (data: Partial<Pick<User, 'full_name' | 'phone' | 'student_id' | 'level'>>) =>
    api.patch<User>('/users/me', data).then((r) => r.data),
}

// ── Academic Resources ────────────────────────────────────────────────────────

export const academicsApi = {
  listCourses: (level?: number) =>
    api
      .get<Course[]>('/academic-resources/courses', { params: { level } })
      .then((r) => r.data),

  listResources: (params?: {
    level?: number
    trimester?: Trimester
    content_type?: string
    course_id?: string
    search?: string
    offset?: number
    limit?: number
  }) =>
    api
      .get<PaginatedResponse<AcademicResource>>('/academic-resources/', { params })
      .then((r) => r.data),

  getResource: (id: string) =>
    api.get<AcademicResource>(`/academic-resources/${id}`).then((r) => r.data),

  uploadResource: (formData: FormData) =>
    api
      .post<AcademicResource>('/academic-resources/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
}

// ── Events ────────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: (params?: {
    event_status?: EventStatus
    event_type?: EventType
    offset?: number
    limit?: number
  }) =>
    api.get<PaginatedResponse<EventSummary>>('/events/', { params }).then((r) => r.data),

  getFeatured: () =>
    api.get<Event | null>('/events/featured').then((r) => r.data),

  getById: (id: string) =>
    api.get<Event>(`/events/${id}`).then((r) => r.data),

  register: (
    eventId: string,
    data: { full_name: string; level?: number; contact?: string; notes?: string }
  ) =>
    api
      .post<EventRegistration>(`/events/${eventId}/register`, data)
      .then((r) => r.data),

  cancelRegistration: (eventId: string) =>
    api.delete<MessageResponse>(`/events/${eventId}/register`).then((r) => r.data),
}

// ── Welfare ───────────────────────────────────────────────────────────────────

export const welfareApi = {
  submitReport: (data: {
    report_type: ReportType
    category: string
    description: string
    is_anonymous: boolean
    name?: string
    level?: number
    contact?: string
  }) => api.post<WelfareReport>('/welfare/reports', data).then((r) => r.data),

  getSpotlight: () =>
    api.get<WelfareSpotlight | null>('/welfare/spotlight').then((r) => r.data),

  listReports: (params?: {
    report_type?: ReportType
    report_status?: ReportStatus
    offset?: number
    limit?: number
  }) =>
    api
      .get<PaginatedResponse<WelfareReport>>('/welfare/reports', { params })
      .then((r) => r.data),

  resolveReport: (id: string, data: { status: ReportStatus; admin_notes?: string }) =>
    api.patch<WelfareReport>(`/welfare/reports/${id}/resolve`, data).then((r) => r.data),
}

// ── Opportunities ─────────────────────────────────────────────────────────────

export const opportunitiesApi = {
  list: (params?: {
    opp_type?: OpportunityType
    include_expired?: boolean
    offset?: number
    limit?: number
  }) =>
    api
      .get<PaginatedResponse<Opportunity>>('/opportunities/', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Opportunity>(`/opportunities/${id}`).then((r) => r.data),
}

// ── News ──────────────────────────────────────────────────────────────────────

export const newsApi = {
  list: (params?: { category?: NewsCategory; offset?: number; limit?: number }) =>
    api.get<PaginatedResponse<NewsPostSummary>>('/news/', { params }).then((r) => r.data),

  getFeatured: () =>
    api.get<NewsPost | null>('/news/featured').then((r) => r.data),

  getStripAnnouncements: () =>
    api.get<NewsPostSummary[]>('/news/strip').then((r) => r.data),

  search: (q: string, offset = 0) =>
    api
      .get<NewsPostSummary[]>('/news/search', { params: { q, offset } })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<NewsPost>(`/news/${id}`).then((r) => r.data),
}

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: { unread_only?: boolean; offset?: number; limit?: number }) =>
    api
      .get<PaginatedResponse<Notification>>('/notifications/', { params })
      .then((r) => r.data),

  markRead: (id: string) =>
    api.post<Notification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    api.post<MessageResponse>('/notifications/read-all').then((r) => r.data),
}

// ── Certificates ──────────────────────────────────────────────────────────────

export const certificatesApi = {
  verify: (code: string) =>
    api.get<CertificateVerify>(`/certificates/verify/${code}`).then((r) => r.data),

  mine: () => api.get<Certificate[]>('/certificates/mine').then((r) => r.data),
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export const feedbackApi = {
  submit: (data: {
    entity_type: FeedbackEntityType
    entity_id: string
    rating: number
    comment?: string
  }) => api.post<Feedback>('/feedback/', data).then((r) => r.data),

  getSummary: (entityType: FeedbackEntityType, entityId: string) =>
    api
      .get<FeedbackSummary>(`/feedback/${entityType}/${entityId}/summary`)
      .then((r) => r.data),
}
