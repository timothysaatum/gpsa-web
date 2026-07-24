import api from './client'
import type {
  AcademicResource,
  AdminDashboard,
  AboutContent,
  HistoryContent, CmsPage,
  AuditLog,
  Certificate,
  CertificateVerify,
  ContactStatus,
  ContactSubmission,
  Course,
  Event,
  EventRegistration,
  EventStatus,
  EventSummary,
  EventType,
  Feedback,
  FeedbackEntityType,
  FeedbackSummary,
  GalleryCategory,
  GalleryItem,
  GovernancePageData,
  HeroSlide,
  HeroSlideCreateRequest,
  HeroSlideUpdateRequest,
  Leader,
  LeadershipTerm,
  LeadershipOffice,
  LegacyPageContent,
  LegacyAwardItem,
  HistoricalRecordSubmissionInput,
  ImpactPageData,
  LeaderNominationInput,
  RecognitionHonoureeItem,
  LoginRequest,
  MessageResponse,
  NewsCategory,
  NewsPost,
  NewsPostSummary,
  Notification,
  Opportunity,
  OpportunityType,
  Partner,
  PaginatedResponse,
  RegisterRequest,
  ReportStatus,
  ReportType,
  SiteStats,
  TokenResponse,
  Trimester,
  User,
  UserRole,
  WelfareConfig,
  WelfareReport,
  WelfareSpotlight,
  WelfareStats,
} from '@/types'

// ── About ────────────────────────────────────────────────────────────────────

export const aboutApi = {
  get: () => api.get<AboutContent>('/about/').then((r) => r.data),
  listPartnersAdmin: () => api.get<Partner[]>('/about/partners/admin').then((r) => r.data),
  createPartner: (data: { name: string; website_url?: string | null; sort_order: number; is_published: boolean }) =>
    api.post<Partner>('/about/partners', data).then((r) => r.data),
  updatePartner: (id: string, data: Partial<Pick<Partner, 'name' | 'website_url' | 'sort_order' | 'is_published'>>) =>
    api.patch<Partner>(`/about/partners/${id}`, data).then((r) => r.data),
  uploadPartnerLogo: (id: string, file: File) => {
    const data = new FormData()
    data.append('file', file)
    return api.post<Partner>(`/about/partners/${id}/logo`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  deletePartner: (id: string) => api.delete<MessageResponse>(`/about/partners/${id}`).then((r) => r.data),
}

export const historyApi = {
  get: () => api.get<HistoryContent>('/about/history').then((r) => r.data),
}

export const impactApi = {
  getPage: () => api.get<ImpactPageData>('/about/impact').then((r) => r.data),
  listAdmin: (resource: string) => api.get<Array<Record<string, unknown>>>(`/about/impact/admin/${resource}`).then((r) => r.data),
  create: (resource: string, data: Record<string, unknown>) => api.post(`/about/impact/admin/${resource}`, { data }).then((r) => r.data),
  update: (resource: string, id: string, data: Record<string, unknown>) => api.patch(`/about/impact/admin/${resource}/${id}`, { data }).then((r) => r.data),
  delete: (resource: string, id: string) => api.delete(`/about/impact/admin/${resource}/${id}`).then((r) => r.data),
  uploadFocusImage: (id: string, file: File) => {
    const data = new FormData(); data.append('file', file)
    return api.post(`/about/impact/admin/focus-areas/${id}/image`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  uploadInitiativeImage: (id: string, file: File) => {
    const data = new FormData(); data.append('file', file)
    return api.post(`/about/impact/admin/initiatives/${id}/image`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  uploadReport: (id: string, file: File) => {
    const data = new FormData(); data.append('file', file)
    return api.post(`/about/impact/admin/reports/${id}/file`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
  uploadHeroImage: (file: File) => {
    const data = new FormData(); data.append('file', file)
    return api.post('/about/impact/admin/settings/hero/image', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
}

export const governanceApi = {
  getPage: (params?: { search?: string; category?: string; year?: string; document_type?: string; page?: number; page_size?: number }) =>
    api.get<GovernancePageData>('/about/governance', { params }).then((r) => r.data),
  listAdmin: (resource: string) => api.get<Array<Record<string, unknown>>>(`/about/governance/admin/${resource}`).then((r) => r.data),
  create: (resource: string, data: Record<string, unknown>) => api.post(`/about/governance/admin/${resource}`, { data }).then((r) => r.data),
  update: (resource: string, id: string, data: Record<string, unknown>) => api.patch(`/about/governance/admin/${resource}/${id}`, { data }).then((r) => r.data),
  delete: (resource: string, id: string) => api.delete(`/about/governance/admin/${resource}/${id}`).then((r) => r.data),
  uploadDocument: (id: string, version: string, file: File) => {
    const data = new FormData(); data.append('file', file)
    return api.post(`/about/governance/admin/documents/${id}/file`, data, { params: { version }, headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
}

export const cmsApi = {
  getPublicPage: <T extends Record<string, unknown>>(slug: string) =>
    api.get<T>(`/cms/pages/public/${slug}`).then((r) => r.data),
  getPage: (slug: string) => api.get<CmsPage>(`/cms/pages/${slug}`).then((r) => r.data),
  updatePage: (slug: string, data: { title: string; content: Record<string, unknown>; is_published: boolean; expected_version?: number }) =>
    api.put<CmsPage>(`/cms/pages/${slug}`, data).then((r) => r.data),
  deletePage: (slug: string) =>
    api.delete<MessageResponse>(`/cms/pages/${slug}`).then((r) => r.data),
}

// ── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  dashboard: () =>
    api.get<AdminDashboard>('/admin/dashboard').then((r) => r.data),

  auditLogs: (params?: {
    actor_id?: string
    action?: string
    entity_type?: string
    role?: UserRole
    search?: string
    date_from?: string
    date_to?: string
    offset?: number
    limit?: number
  }) =>
    api.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params }).then((r) => r.data),
}

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

  getMe: () => api.get<User>('/users/me').then((r) => r.data),

  listUsers: (params?: { offset?: number; limit?: number }) =>
    api.get<PaginatedResponse<User>>('/users/', { params }).then((r) => r.data),

  getUser: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  adminUpdateUser: (id: string, data: { role?: UserRole; is_active?: boolean }) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),

  deleteUser: (id: string) =>
    api.delete<MessageResponse>(`/users/${id}`).then((r) => r.data),
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
    is_featured?: boolean
    sort_by?: 'title' | 'level' | 'created_at' | 'file_size'
    sort_order?: 'asc' | 'desc'
    offset?: number
    limit?: number
  }) =>
    api
      .get<PaginatedResponse<AcademicResource>>('/academic-resources/', { params })
      .then((r) => r.data),

  listAllResources: (params?: { offset?: number; limit?: number }) =>
    api.get<PaginatedResponse<AcademicResource>>('/academic-resources/admin/all', { params }).then((r) => r.data),

  getResource: (id: string) =>
    api.get<AcademicResource>(`/academic-resources/${id}`).then((r) => r.data),

  uploadResource: (formData: FormData) =>
    api
      .post<AcademicResource>('/academic-resources/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  createCourse: (data: { name: string; code?: string; level: number }) =>
    api.post<Course>('/academic-resources/courses', data).then((r) => r.data),

  updateResource: (id: string, data: {
    title?: string
    content_type?: string
    course_id?: string
    level?: number
    trimester?: Trimester
    duration_mins?: number | null
    is_featured?: boolean
    is_published?: boolean
  }) =>
    api.patch<AcademicResource>(`/academic-resources/${id}`, data).then((r) => r.data),

  publishResource: (id: string) =>
    api.post<AcademicResource>(`/academic-resources/${id}/publish`).then((r) => r.data),

  uploadThumbnail: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<AcademicResource>(`/academic-resources/${id}/thumbnail`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },

  deleteResource: (id: string) =>
    api.delete<MessageResponse>(`/academic-resources/${id}`).then((r) => r.data),
}

// ── Events ────────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: (params?: {
    event_status?: EventStatus
    event_type?: EventType
    search?: string
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

  create: (data: {
    title: string
    description: string
    event_type: EventType
    start_datetime: string
    end_datetime?: string | null
    location: string
    banner_emoji?: string | null
    is_featured?: boolean
    agenda?: Record<string, unknown> | null
    speakers?: unknown[] | null
  }) =>
    api.post<Event>('/events/', data).then((r) => r.data),

  update: (id: string, data: {
    title?: string
    description?: string
    event_type?: EventType
    status?: EventStatus
    start_datetime?: string
    end_datetime?: string | null
    location?: string
    banner_emoji?: string | null
    is_featured?: boolean
    agenda?: Record<string, unknown> | null
    speakers?: unknown[] | null
  }) =>
    api.patch<Event>(`/events/${id}`, data).then((r) => r.data),

  deleteEvent: (id: string) =>
    api.delete<MessageResponse>(`/events/${id}`).then((r) => r.data),

  listRegistrations: (eventId: string) =>
    api.get<EventRegistration[]>(`/events/${eventId}/registrations`).then((r) => r.data),
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

  createSpotlight: (data: { summary: string; action_taken: string }) =>
    api.post<WelfareSpotlight>('/welfare/spotlight', data).then((r) => r.data),

  getConfig: () =>
    api.get<WelfareConfig>('/welfare/config').then((r) => r.data),

  getStats: () =>
    api.get<WelfareStats>('/welfare/stats').then((r) => r.data),
}

// ── Opportunities ─────────────────────────────────────────────────────────────

export const opportunitiesApi = {
  list: (params?: {
    opp_type?: OpportunityType
    include_expired?: boolean
    search?: string
    sort_by?: 'deadline' | 'created_at' | 'title'
    sort_order?: 'asc' | 'desc'
    offset?: number
    limit?: number
  }) =>
    api
      .get<PaginatedResponse<Opportunity>>('/opportunities/', { params })
      .then((r) => r.data),

  listAdmin: (params?: { offset?: number; limit?: number }) =>
    api.get<PaginatedResponse<Opportunity>>('/opportunities/admin/all', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Opportunity>(`/opportunities/${id}`).then((r) => r.data),

  create: (data: {
    title: string
    organization: string
    opp_type: OpportunityType
    description: string
    location?: string | null
    deadline: string
    external_link: string
  }) =>
    api.post<Opportunity>('/opportunities/', data).then((r) => r.data),

  update: (id: string, data: {
    title?: string
    organization?: string
    opp_type?: OpportunityType
    description?: string
    location?: string | null
    deadline?: string
    external_link?: string
    is_published?: boolean
  }) =>
    api.patch<Opportunity>(`/opportunities/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<MessageResponse>(`/opportunities/${id}`).then((r) => r.data),

  uploadThumbnail: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<Opportunity>(`/opportunities/${id}/thumbnail`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
  },
}

// ── News ──────────────────────────────────────────────────────────────────────

export const newsApi = {
  list: (params?: { category?: NewsCategory; offset?: number; limit?: number }) =>
    api.get<PaginatedResponse<NewsPostSummary>>('/news/', { params }).then((r) => r.data),

  listAdmin: (params?: { offset?: number; limit?: number }) =>
    api.get<PaginatedResponse<NewsPostSummary>>('/news/admin/all', { params }).then((r) => r.data),

  getFeatured: () =>
    api.get<NewsPost | null>('/news/featured').then((r) => r.data),

  getStripAnnouncements: () =>
    api.get<NewsPostSummary[]>('/news/strip').then((r) => r.data),

  search: (q: string, offset = 0, limit = 20) =>
    api
      .get<NewsPostSummary[]>('/news/search', { params: { q, offset, limit } })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<NewsPost>(`/news/${id}`).then((r) => r.data),

  create: (data: {
    title: string
    category: NewsCategory
    summary: string
    body: string
    banner_emoji?: string | null
    image_alt?: string | null
    is_featured?: boolean
    is_urgent?: boolean
    is_strip_announcement?: boolean
    attachments?: string[] | null
    publish_immediately?: boolean
  }) =>
    api.post<NewsPost>('/news/', data).then((r) => r.data),

  update: (id: string, data: {
    title?: string
    category?: NewsCategory
    summary?: string
    body?: string
    banner_emoji?: string | null
    image_alt?: string | null
    is_featured?: boolean
    is_urgent?: boolean
    is_strip_announcement?: boolean
    attachments?: string[] | null
  }) =>
    api.patch<NewsPost>(`/news/${id}`, data).then((r) => r.data),

  publish: (id: string) =>
    api.post<NewsPost>(`/news/${id}/publish`).then((r) => r.data),

  uploadImage: (id: string, file: File) => {
    const data = new FormData()
    data.append('file', file)
    return api.post<NewsPost>(`/news/${id}/image`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  delete: (id: string) =>
    api.delete<MessageResponse>(`/news/${id}`).then((r) => r.data),
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

  issue: (eventId: string) =>
    api.post<Certificate[]>(`/certificates/issue/${eventId}`).then((r) => r.data),
}

// ── Hero Slides ───────────────────────────────────────────────────────────────

export const heroApi = {
  list: (includeInactive?: boolean) =>
    api.get<HeroSlide[]>('/hero/', { params: { include_inactive: includeInactive } }).then((r) => r.data),

  getById: (id: string) =>
    api.get<HeroSlide>(`/hero/${id}`).then((r) => r.data),

  create: (data: HeroSlideCreateRequest) =>
    api.post<HeroSlide>('/hero/', data).then((r) => r.data),

  update: (id: string, data: HeroSlideUpdateRequest) =>
    api.patch<HeroSlide>(`/hero/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<MessageResponse>(`/hero/${id}`).then((r) => r.data),

  uploadImage: (id: string, file: File) => {
    const data = new FormData()
    data.append('file', file)
    return api.post<HeroSlide>(`/hero/${id}/image`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
}

// ── Gallery ──────────────────────────────────────────────────────────────────

export const galleryApi = {
  list: (params?: { category?: GalleryCategory; offset?: number; limit?: number }) =>
    api.get<GalleryItem[]>('/gallery/', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<GalleryItem>(`/gallery/${id}`).then((r) => r.data),

  create: (formData: FormData) =>
    api
      .post<GalleryItem>('/gallery/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  listAdmin: (params?: { offset?: number; limit?: number }) =>
    api.get<GalleryItem[]>('/gallery/admin/all', { params }).then((r) => r.data),

  update: (id: string, data: {
    title?: string
    description?: string | null
    category?: GalleryCategory
    event_date?: string | null
    sort_order?: number
    is_published?: boolean
  }) =>
    api.patch<GalleryItem>(`/gallery/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<MessageResponse>(`/gallery/${id}`).then((r) => r.data),

  replaceImage: (id: string, file: File) => {
    const data = new FormData()
    data.append('file', file)
    return api.post<GalleryItem>(`/gallery/${id}/image`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
}

export const contactApi = {
  submit: (data: {
    full_name: string
    email: string
    phone?: string
    category: string
    subject: string
    message: string
    consent: boolean
    website: string
  }) => api.post<{ reference: string; message: string }>('/contact/', data).then((r) => r.data),

  listAdmin: (params?: { contact_status?: ContactStatus; search?: string; offset?: number; limit?: number }) =>
    api.get<PaginatedResponse<ContactSubmission>>('/contact/admin', { params }).then((r) => r.data),

  update: (id: string, data: { status?: ContactStatus; admin_notes?: string | null; assigned_to?: string | null }) =>
    api.patch<ContactSubmission>(`/contact/admin/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<MessageResponse>(`/contact/admin/${id}`).then((r) => r.data),
}

// ── Leadership ───────────────────────────────────────────────────────────────

export const leadershipApi = {
  list: (params?: { include_inactive?: boolean; offset?: number; limit?: number }) =>
    api.get<LeadershipTerm[]>('/leadership/', { params }).then((r) => r.data),

  current: () =>
    api.get<LeadershipTerm | null>('/leadership/current').then((r) => r.data),

  listAdmin: () =>
    api.get<LeadershipTerm[]>('/leadership/admin').then((r) => r.data),

  listOffices: () =>
    api.get<LeadershipOffice[]>('/leadership/offices').then((r) => r.data),

  createOffice: (data: { name: string; sort_order?: number }) =>
    api.post<LeadershipOffice>('/leadership/offices', data).then((r) => r.data),

  deleteOffice: (id: string) =>
    api.delete<MessageResponse>(`/leadership/offices/${id}`).then((r) => r.data),

  createTerm: (data: {
    title: string
    academic_year: string
    start_date?: string | null
    end_date?: string | null
    theme?: string | null
    summary?: string | null
    is_current?: boolean
    sort_order?: number
  }) =>
    api.post<LeadershipTerm>('/leadership/terms', data).then((r) => r.data),

  updateTerm: (id: string, data: {
    title?: string
    academic_year?: string
    start_date?: string | null
    end_date?: string | null
    theme?: string | null
    summary?: string | null
    is_current?: boolean
    sort_order?: number
  }) =>
    api.patch<LeadershipTerm>(`/leadership/terms/${id}`, data).then((r) => r.data),

  deleteTerm: (id: string) =>
    api.delete<MessageResponse>(`/leadership/terms/${id}`).then((r) => r.data),

  createLeader: (data: {
    term_id: string
    full_name: string
    office: string
    bio?: string | null
    email?: string | null
    phone?: string | null
    photo_url?: string | null
    sort_order?: number
    is_active?: boolean
  }) =>
    api.post<Leader>('/leadership/leaders', data).then((r) => r.data),

  updateLeader: (id: string, data: {
    term_id?: string
    full_name?: string
    office?: string
    bio?: string | null
    email?: string | null
    phone?: string | null
    photo_url?: string | null
    sort_order?: number
    is_active?: boolean
  }) =>
    api.patch<Leader>(`/leadership/leaders/${id}`, data).then((r) => r.data),

  uploadLeaderPhoto: (id: string, formData: FormData) =>
    api
      .post<Leader>(`/leadership/leaders/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  deleteLeader: (id: string) =>
    api.delete<MessageResponse>(`/leadership/leaders/${id}`).then((r) => r.data),
}

// ── Past Leadership & Recognition ──────────────────────────────────────────

export const legacyApi = {
  getPage: (year?: string) =>
    api.get<LegacyPageContent>('/about/legacy', { params: { year } }).then((r) => r.data),

  submitRecord: async ({ file, ...data }: HistoricalRecordSubmissionInput) => {
    const created = await api.post<MessageResponse & { id: string }>('/about/legacy/submissions', data).then((r) => r.data)
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        await api.post(`/about/legacy/submissions/${created.id}/file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } catch {
        return {
          ...created,
          message: 'Your record details were received, but the attachment could not be uploaded. The archive team may contact you.',
        }
      }
    }
    return created
  },

  submitNomination: (data: LeaderNominationInput) =>
    api.post<MessageResponse>('/about/legacy/nominations', data).then((r) => r.data),
  listHonourees: (categorySlug: string) =>
    api.get<RecognitionHonoureeItem[]>(`/about/legacy/recognition/${categorySlug}`).then((r) => r.data),
  listAwards: () =>
    api.get<LegacyAwardItem[]>('/about/legacy/awards').then((r) => r.data),

  listContent: (resource: string) =>
    api.get<Array<Record<string, unknown>>>(`/about/legacy/admin/content/${resource}`).then((r) => r.data),
  createContent: (resource: string, data: Record<string, unknown>) =>
    api.post<Record<string, unknown>>(`/about/legacy/admin/content/${resource}`, { data }).then((r) => r.data),
  updateContent: (resource: string, id: string, data: Record<string, unknown>) =>
    api.patch<Record<string, unknown>>(`/about/legacy/admin/content/${resource}/${id}`, { data }).then((r) => r.data),
  deleteContent: (resource: string, id: string) =>
    api.delete<MessageResponse>(`/about/legacy/admin/content/${resource}/${id}`).then((r) => r.data),
  listSubmissions: () =>
    api.get<Array<Record<string, unknown>>>('/about/legacy/admin/submissions').then((r) => r.data),
  reviewSubmission: (id: string, status: 'accepted' | 'rejected' | 'published' | 'archived') =>
    api.patch(`/about/legacy/admin/submissions/${id}`, { status }).then((r) => r.data),
  listNominations: () =>
    api.get<Array<Record<string, unknown>>>('/about/legacy/admin/nominations').then((r) => r.data),
  reviewNomination: (id: string, status: 'approved' | 'rejected' | 'under_review') =>
    api.patch(`/about/legacy/admin/nominations/${id}`, { status }).then((r) => r.data),
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export const statsApi = {
  get: () =>
    api.get<SiteStats>('/stats').then((r) => r.data),
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

  list: (entityType: FeedbackEntityType, entityId: string, params?: { offset?: number; limit?: number }) =>
    api
      .get<Feedback[]>(`/feedback/${entityType}/${entityId}`, { params })
      .then((r) => r.data),
}
