# Admin Site Implementation Plan

## Core Goal

Build a dedicated admin dashboard that allows GPSA-UDS admins and executives to create, update, publish, archive, and audit website content without editing code.

The admin site should support:

- Full authentication and role-based access control.
- Content creation, editing, publishing, unpublishing, archiving, and soft deletion.
- Safe image and file uploads.
- Preview before publishing.
- Proper audit logging for every important admin action.
- Clear operational workflows for admins and executives.
- Responsive, fast, production-ready UI.

## Standards And Success Criteria

The implementation should target:

- OWASP ASVS Level 2 for application security controls.
- OWASP Top 10 and API Security Top 10 coverage.
- WCAG 2.2 AA accessibility.
- Secure software-development lifecycle checks in CI.
- Tested backup, recovery, monitoring, and incident procedures.

Initial performance objectives, measured in a production-like environment:

```txt
Admin route usable at p75:              <= 2.5 seconds
Normal API reads at p95:                <= 300 milliseconds
Normal API writes at p95:               <= 500 milliseconds
Dashboard summary at p95:               <= 800 milliseconds
Search feedback after debounce:         <= 100 milliseconds
API 5xx error rate:                     < 0.5 percent
```

Before implementation, document expected concurrent users, record volumes,
monthly upload volume, maximum file sizes, data-retention periods, and supported
browsers. Revisit the targets after production traffic is measured.

## Recommended Admin Routes

Frontend routes:

```txt
/admin
/admin/dashboard
/admin/home
/admin/about
/admin/leadership
/admin/news
/admin/events
/admin/opportunities
/admin/gallery
/admin/academics
/admin/welfare
/admin/users
/admin/audit-logs
/admin/settings
```

Use the existing auth system and protect routes with role guards.

```tsx
<ProtectedRoute roles={['admin', 'exec']} />
```

Frontend guards improve usability but are not a security boundary. Every API
operation must independently authenticate the caller and authorize the action
and target object.

Restrict high-risk pages to `admin` only:

- Users
- Audit logs
- Site settings
- Role changes
- Final publishing controls where approval is required

## Admin Layout

Create a dedicated admin shell:

```txt
AdminLayout
- Sidebar navigation
- Top bar with user profile
- Global search
- Notifications/alerts
- Breadcrumbs
- Main content area
```

Sidebar grouping:

```txt
Content
- Home Page
- About Page
- Leadership
- News
- Events
- Opportunities
- Gallery

Student Services
- Academic Resources
- Welfare Reports

Administration
- Users
- Audit Logs
- Site Settings
```

## Backend Architecture

Use domain routes where they already exist, and add admin-specific routes only where needed.

Admin-specific endpoints:

```txt
/api/v1/admin/dashboard
/api/v1/admin/audit-logs
/api/v1/admin/settings
```

Existing domain endpoints should continue to power content modules:

```txt
/api/v1/news
/api/v1/events
/api/v1/opportunities
/api/v1/gallery
/api/v1/leadership
/api/v1/academic-resources
/api/v1/welfare
```

List endpoints must implement server-side filtering, sorting, bounded pagination,
and maximum page sizes. Prefer cursor pagination for audit logs and other
high-growth datasets. Never load an entire audit, user, gallery, or welfare
dataset into the browser.

Every write endpoint should include:

- Authentication
- Role guard
- Request validation
- Audit logging
- Soft delete where appropriate
- Publish/unpublish/archive status where appropriate

Publishing, revision creation, and audit insertion must occur in one database
transaction. Enforce high-value domain invariants with database constraints
where possible.

## Content Lifecycle And Revisioning

Use an explicit workflow rather than independent status flags:

```txt
draft -> in_review -> approved -> scheduled/published -> archived
             |            |
             v            v
          rejected      draft

published -> unpublished
```

For each transition, define:

- Roles and permissions allowed to perform it.
- Required fields and validation.
- Whether a second person must approve it.
- Whether authors may approve their own changes.
- Notifications and audit events created.
- Which immutable revision becomes public.
- Reversal, scheduling, expiration, and timezone behavior.

Editing a published item must create a new draft revision without modifying the
currently published revision. Add a reusable revision model:

```txt
content_revisions
- id
- entity_type
- entity_id
- revision_number
- content_json
- created_by
- created_at
- change_summary
```

Publishing records `published_revision_id`, `published_at`, and `published_by`.
The admin UI must support revision comparison, preview, and rollback by creating
a new revision from an earlier version.

Use optimistic concurrency through a version number or ETag/`If-Match` header.
Reject stale updates with `409 Conflict` and show a conflict-resolution UI;
never silently overwrite another administrator's work.

## Authentication And Permissions

Use the existing JWT auth system only after verifying that it meets the session,
revocation, storage, and MFA requirements below; harden or replace deficient parts.

Document and test the complete session design:

- Prefer `HttpOnly`, `Secure`, and appropriately `SameSite` cookies for browser
  tokens instead of JavaScript-accessible storage.
- If cookies authenticate writes, require CSRF protection.
- Use short-lived access tokens and rotating refresh tokens with reuse detection.
- Revoke all relevant sessions after password, email, role, or account-status changes.
- Require multi-factor authentication for admins.
- Require recent reauthentication for role changes, sensitive exports, permanent
  deletion, and security-setting changes.
- Apply progressive delays or lockout protections to repeated authentication failures.
- Rate-limit login, password-reset, MFA, upload, export, and sensitive write endpoints.
- Do not reveal whether an account exists through login or recovery errors.

Add explicit permission helpers:

```py
can_manage_homepage(user)
can_manage_about_page(user)
can_manage_leadership(user)
can_write_news(user)
can_publish_news(user)
can_manage_events(user)
can_manage_gallery(user)
can_manage_academics(user)
can_manage_welfare(user)
can_manage_users(user)
can_view_audit_logs(user)
can_manage_site_settings(user)
```

Back these helpers with a centralized, deny-by-default policy model. Use granular
permissions such as `news.create`, `news.update`, `news.publish`,
`users.role.change`, `welfare.confidential.read`, and `audit.read`; map roles to
permissions rather than spreading role-name checks throughout the codebase.
Enforce object-level authorization to prevent IDOR/BOLA vulnerabilities.

Suggested permissions:

```txt
admin:
- Full admin access
- Publish content
- Manage users
- View audit logs
- Manage site settings
- Delete/archive content

exec:
- Create and update drafts
- Manage leadership records
- Manage events, welfare, opportunities, and academic uploads
- Upload resources and images
- Cannot manage users
- Cannot view full audit logs unless explicitly allowed
- Publishing may require admin approval

student:
- No admin access
```

Create and approve a permission matrix covering every resource, action, state
transition, export, and sensitive field before module implementation begins.

## Audit Logging

Every admin write action should create an audit log.

Track:

```txt
actor_id
actor_name
actor_role
action
entity_type
entity_id
result
reason
old_values
new_values
ip_address
user_agent
request_id
session_id
created_at
```

Audit records must be append-only and unavailable to normal CRUD operations.
Capture the actor role at the time of the action. Log denied operations, reads
of confidential welfare data, audit-log viewing, and exports as well as writes.

Never log passwords, tokens, secrets, complete confidential welfare reports, or
unnecessary personal data. Redact protected fields before persistence. Define
retention, archival, and access policies, and forward high-risk events such as
role changes and repeated failed logins to centralized monitoring. Use
tamper-evident storage if legal or compliance requirements demand it.

Actions should include:

```txt
CREATE
UPDATE
DELETE
SOFT_DELETE
PUBLISH
UNPUBLISH
ARCHIVE
UPLOAD_FILE
UPLOAD_PHOTO
CHANGE_ROLE
RESOLVE_WELFARE_REPORT
LOGIN
LOGOUT
FAILED_LOGIN
```

Audit log UI filters:

```txt
Actor
Action
Entity type
Date range
Role
Search
```

## Admin Modules

### 1. Dashboard

Admin dashboard should show:

- Pending drafts
- Upcoming events
- Recent news
- Welfare reports needing attention
- Recently uploaded gallery images
- Recent audit activity
- Quick actions

Quick actions:

```txt
Create News
Create Event
Upload Gallery Image
Add Leader
Post Opportunity
Upload Academic Resource
```

### 2. Home Page Management

Admins should manage:

- Hero slides
- Announcement strip
- Featured news/events/opportunities
- Gallery highlights
- Homepage curated content

Keep most live data-driven sections automatic. Admins should mainly control curated content.

### 3. About Page Management

Add editable backend support for About content.

Recommended table:

```txt
site_pages
- id
- slug
- title
- status
- published_revision_id
- updated_by
- published_at
- published_by
- scheduled_for
- created_at
- updated_at
- version
```

Page body content belongs in `content_revisions.content_json`; the page record
tracks workflow state and the currently published revision.

About content structure:

```json
{
  "tagline": "",
  "overview": "",
  "mission": "",
  "vision": "",
  "values": [],
  "pillars": [],
  "timeline": []
}
```

The admin UI should expose structured fields, not raw JSON.

### 4. Leadership Management

Leadership management should support:

- Create leadership term.
- Mark term as current.
- Add leaders.
- Upload real leader photos.
- Edit names, offices, bios, emails, and phone numbers.
- Reorder leaders.
- Archive past administrations.
- Preserve every administration in history.

### 5. News Management

News admin should support:

- Draft news.
- Publish/unpublish.
- Feature/unfeature.
- Mark urgent.
- Add strip announcement.
- Attach image.
- Preview before publish.

Recommended statuses:

```txt
draft
in_review
approved
scheduled
published
unpublished
archived
```

### 6. Events Management

Events admin should support:

- Create event.
- Set event type and status.
- Upload banner image.
- Add agenda.
- Add speakers.
- Mark featured.
- View registrations.
- Export registrations as CSV.
- Issue certificates.

### 7. Opportunities Management

Opportunities admin should support:

- Create opportunity.
- Edit opportunity.
- Set deadline.
- Validate external link.
- Publish/unpublish.
- Mark active/inactive.
- Auto-expire after deadline.

### 8. Gallery Management

Gallery admin should support:

- Upload single or multiple images.
- Set category.
- Add title, description, and date.
- Reorder images.
- Delete/archive images.
- Preview gallery layout.

### 9. Academic Resources

Academic resources admin should support:

- Upload files.
- Assign course, level, trimester, and type.
- Mark featured.
- Publish/unpublish.
- Review pending uploads.
- Delete/archive outdated resources.

### 10. Welfare Admin

Welfare admin should support:

- View welfare reports.
- Filter by status, category, and type.
- Resolve reports.
- Add internal notes.
- Create welfare spotlight.
- Update welfare config/contact.
- Protect anonymous and confidential data carefully.

Treat welfare as a separately threat-modeled sensitive module. Require:

- Field-level permissions and least-privilege access.
- Encryption at rest for sensitive fields and private attachment storage.
- Audit logging of reads, exports, and changes without copying report contents.
- Redacted notifications that never include confidential report details.
- A documented retention and secure-deletion policy.
- Protection against identity leakage through filenames, metadata, IP addresses,
  logs, exports, or attachments.
- Explicit rules for anonymous reports and emergency escalation.

### 11. User Management

Admin only.

User management should support:

- View users.
- Search/filter users.
- Change role.
- Verify email manually if needed.
- Disable/soft-delete users.
- View user activity summary.

Never expose passwords, password hashes, refresh tokens, or raw auth tokens.

## Frontend Implementation

Create admin pages:

```txt
gpsauds/src/pages/admin/AdminLayout.tsx
gpsauds/src/pages/admin/AdminDashboardPage.tsx
gpsauds/src/pages/admin/AdminHomePage.tsx
gpsauds/src/pages/admin/AdminAboutPage.tsx
gpsauds/src/pages/admin/AdminLeadershipPage.tsx
gpsauds/src/pages/admin/AdminNewsPage.tsx
gpsauds/src/pages/admin/AdminEventsPage.tsx
gpsauds/src/pages/admin/AdminOpportunitiesPage.tsx
gpsauds/src/pages/admin/AdminGalleryPage.tsx
gpsauds/src/pages/admin/AdminAcademicsPage.tsx
gpsauds/src/pages/admin/AdminWelfarePage.tsx
gpsauds/src/pages/admin/AdminUsersPage.tsx
gpsauds/src/pages/admin/AdminAuditLogsPage.tsx
gpsauds/src/pages/admin/AdminSettingsPage.tsx
```

Shared admin components:

```txt
AdminTable
AdminToolbar
AdminFormDrawer
AdminConfirmDialog
AdminStatusBadge
ImageUploader
FileUploader
PublishControls
AuditTrailPanel
```

Admin UI principles:

- Dense but readable.
- Fast workflows.
- Clear save/publish states.
- Strong empty/error/loading states.
- Responsive sidebar and tables.
- Avoid marketing-style layouts.

Frontend performance and reliability requirements:

- Route-level code splitting for admin modules and large editors.
- Debounced search with cancellation of stale requests.
- Query caching with targeted invalidation after mutations.
- Virtualized rows only when bounded pagination is insufficient.
- Upload progress, cancellation, retry, and interrupted-upload recovery.
- Protection against duplicate submissions.
- Unsaved-change warnings and session-expiry recovery.
- Explicit handling of `409 Conflict` from concurrent editing.
- Independent dashboard widgets so one failed query does not blank the page.

## Accessibility Requirements

Meet WCAG 2.2 AA and include accessibility acceptance criteria in every module:

- Complete keyboard navigation with visible focus states.
- Correct landmarks, headings, labels, table headers, and captions.
- Programmatic association of validation errors and form controls.
- Screen-reader announcements for save, publish, loading, and error states.
- Focus trapping and restoration for drawers and dialogs.
- Text and controls that meet contrast requirements and do not rely on color alone.
- Support for 200 percent zoom, reduced motion, and appropriate touch targets.
- Keyboard-accessible move-up/move-down alternatives to drag-and-drop reordering.

Automated accessibility checks are required in CI, supplemented by keyboard and
screen-reader testing for critical workflows.

## Performance And Scalability Design

- Use server-side pagination, filtering, search, and sorting for data tables.
- Return bounded dashboard summaries instead of complete records.
- Run independent summary queries concurrently where supported and briefly cache
  non-sensitive aggregates.
- Monitor slow database queries and add indexes based on measured query plans.
- Use asynchronous jobs for large exports, image processing, notifications,
  certificate generation, scheduled publishing, and malware scanning.
- Serve optimized image variants through object storage/CDN; generate thumbnails
  and WebP/AVIF variants where supported.
- Load-test dashboard summaries, audit logs, search, exports, and bulk uploads
  against agreed production-like data volumes.

## Backend Implementation

Required backend foundations, implemented in the Delivery Sequence below:

1. Central authentication and permission-policy enforcement.
2. Append-only audit writer, redaction rules, and paginated listing endpoint.
3. Content revision and validated workflow-transition services.
4. Secure media upload and processing pipeline.
5. Editable page and schema-validated site-settings models.
6. Bounded dashboard summary endpoint.
7. Asynchronous and audited export jobs where justified.
8. Permission, audit, security, transaction, and performance tests for every slice.

## Recommended Database Additions

```txt
site_settings
- key
- value_json
- updated_by
- updated_at

site_pages
- slug
- title
- content_json
- status
- published_revision_id
- updated_by
- published_at
- published_by
- scheduled_for
- created_at
- updated_at
- version

media_assets
- file_key
- visibility
- filename
- mime_type
- size_bytes
- checksum
- scan_status
- processing_status
- width
- height
- uploaded_by
- entity_type
- entity_id
- created_at
- deleted_at
- retention_until
```

A central `media_assets` table will make uploads easier to reuse across hero slides, news, gallery, leaders, events, and about-page content.

Store provider-neutral object keys rather than assuming every asset has a
permanent public URL. Generate public or short-lived signed URLs according to
visibility. Add `deleted_at`, `deleted_by`, and `deletion_reason` to soft-deleted
domain records, and define restoration, retention, and permanent-deletion rules.

Add database constraints and indexes for real query patterns. At minimum,
consider indexes for content status/publish time, event start time, opportunity
deadline, welfare status/category/date, media entity references, and audit date,
actor, and entity. Enforce invariants such as one current leadership term,
unique page slugs, valid date ordering, and valid published revision references.

## Security Requirements

- Validate upload extension, declared MIME type, magic bytes, size, and image dimensions.
- Generate random storage keys; normalize display names and prevent path traversal.
- Quarantine uploads until malware scanning and processing succeed.
- Re-encode raster images, strip unnecessary metadata, and block or sanitize active
  formats such as SVG and HTML.
- Protect against decompression/archive bombs and enforce per-user quotas.
- Store confidential attachments privately and use short-lived signed downloads.
- Use soft delete for public content.
- Require confirmation for destructive actions.
- Restrict user management to admins only.
- Restrict audit logs to admins only.
- Never expose confidential welfare details publicly.
- Keep publishing intentional.
- Rate-limit sensitive admin endpoints.
- Log failed login attempts.
- Avoid leaking internal errors to the frontend.
- Sanitize rich text on the server with an allowlist before storing or rendering it.
- Validate external links, allow only approved protocols, and add safe link attributes.
- Do not let the backend freely fetch submitted URLs; if link checking is required,
  defend against SSRF, redirects, DNS rebinding, and private-network targets.
- Apply CSP, HSTS, `X-Content-Type-Options`, referrer policy, frame restrictions,
  and an appropriate permissions policy.
- Validate request body size, structure, types, identifiers, and unexpected fields.
- Prevent spreadsheet formula injection in CSV exports.
- Store secrets in an approved secret manager, never in `site_settings` or source code.
- Scan dependencies, containers, source, and commits for known vulnerabilities and secrets.

The generic `site_settings` store must use an allowlist of known keys with schemas,
size limits, visibility classification, and per-setting permissions. It must not
serve as unrestricted application configuration or secret storage.

## Testing Plan

Backend tests:

```txt
- Unauthenticated users cannot access admin endpoints.
- Students cannot access admin endpoints.
- Exec users can create drafts but cannot manage users.
- Admin users can publish content and manage users.
- Audit log is created on create/update/delete/publish.
- File upload rejects invalid MIME types.
- File upload rejects oversized files.
- Soft-deleted content does not appear publicly.
- Confidential welfare reports remain protected.
- Permission-matrix tests cover every role, resource, action, export, and transition.
- Object-level authorization prevents access by changing resource identifiers.
- Draft edits cannot alter the currently published revision.
- Invalid state transitions and self-approval rules are rejected.
- Stale concurrent writes return `409 Conflict` without losing data.
- Publish, revision, and audit transactions roll back together on failure.
- Pagination limits, filtering, sorting, and search behave correctly.
- Uploads reject spoofed MIME types, executable content, malicious SVG, malware,
  excessive image dimensions, unsafe filenames, and archive bombs.
- Stored XSS, CSRF where applicable, SSRF, and CSV formula-injection tests pass.
- Audit logs redact protected fields and cannot be changed through normal APIs.
- Welfare reads, exports, retention, redaction, and access logging are enforced.
- Scheduled publishing and expiration work across timezone and clock-edge cases.
- Session revocation, refresh rotation, MFA, and step-up authentication work as designed.
```

Frontend checks:

```txt
- Admin routes redirect unauthenticated users.
- Student users cannot access admin routes.
- Sidebar works on mobile.
- Forms validate required fields.
- Upload controls show success and error states.
- Tables handle loading, empty, and error states.
- Publish/unpublish controls update content correctly.
- Production build passes.
- Keyboard-only workflows and focus management work.
- Screen readers receive useful labels, errors, and status announcements.
- Unsaved changes, session expiry, duplicate submit, and stale-edit conflicts are handled.
- Partial dashboard failure and slow/offline network states remain usable.
- Interrupted uploads can be safely retried without duplicate assets.
- Supported browsers, mobile layouts, 200 percent zoom, and reduced motion are verified.

Non-functional and release checks:

```txt
- API and UI performance budgets pass with production-like data.
- Load tests cover dashboard, audit logs, search, exports, and bulk uploads.
- Automated WCAG checks and manual critical-flow accessibility checks pass.
- Static analysis, dependency/container scanning, and secret scanning pass.
- Security testing follows the agreed OWASP ASVS Level 2 controls.
- Database migration upgrade and rollback paths are tested.
- Backup restoration is successfully exercised.
- Logs and error reports are verified not to leak sensitive data.
- Critical alerts and incident runbooks are exercised in staging.
```

## Operations And Reliability

Production readiness requires:

- Structured application and security logs with correlation/request IDs.
- Metrics for latency, error rates, authorization denials, background jobs,
  failed logins, uploads, exports, and publishing failures.
- Alerts for sustained errors, slow queries, queue backlog, repeated login failures,
  role changes, and security-control failures.
- Health and readiness endpoints that do not expose secrets.
- Error tracking with personal and confidential data scrubbing.
- Automated database and media backups with documented retention.
- Defined recovery-time and recovery-point objectives and tested restoration.
- Background-job idempotency, retry limits, dead-letter handling, and monitoring.
- Feature flags and a rollback plan for risky modules and migrations.
- Production-like staging with representative permissions and sanitized data.
- Data-retention, legal deletion, and incident-response procedures.

Large CSV exports should run asynchronously, be access-controlled and audited,
expire automatically, and notify the requesting administrator without attaching
sensitive data to email or notifications.
```

## Delivery Sequence

1. Confirm data classification, record volumes, retention, performance objectives,
   permission matrix, and content state machines.
2. Threat-model authentication, publishing, uploads, exports, users, settings, and
   the welfare module; map required OWASP ASVS controls.
3. Harden sessions, MFA, CSRF where applicable, API authorization, rate limits,
   and step-up authentication.
4. Build append-only audit infrastructure, redaction, retention, and security alerts.
5. Build content revisions, workflow transitions, preview, rollback, scheduling,
   transactions, and optimistic concurrency.
6. Build secure media upload, scanning, private/public delivery, processing, and cleanup.
7. Build the accessible admin shell and shared components.
8. Deliver one complete vertical slice, preferably News or Leadership, including
   schema, API, UI, authorization, audit, accessibility, and performance tests.
9. Validate the vertical slice with security and load testing, then apply lessons
   to Events, Opportunities, Gallery, and Academic Resources.
10. Build dashboard summaries from the proven module APIs with bounded queries and
    independent widget failure handling.
11. Build Welfare as a separately reviewed sensitive-data module.
12. Build Users and Settings with MFA, step-up authentication, session revocation,
    and strict audit controls.
13. Complete cross-module accessibility, disaster-recovery, migration, security,
    performance, and production-readiness testing before launch.

Each vertical slice must meet its authorization, audit, accessibility, security,
performance, observability, and rollback acceptance criteria before the next module
is treated as complete. Security and test work is continuous rather than deferred
to the end of delivery.
