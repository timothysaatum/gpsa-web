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

Every write endpoint should include:

- Authentication
- Role guard
- Request validation
- Audit logging
- Soft delete where appropriate
- Publish/unpublish/archive status where appropriate

## Authentication And Permissions

Use the existing JWT auth system.

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
old_values
new_values
ip_address
user_agent
request_id
created_at
```

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
- content_json
- is_published
- updated_by
- published_at
- created_at
- updated_at
```

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
review
published
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

## Backend Implementation

Recommended order:

1. Add audit log listing endpoint.
2. Add admin dashboard summary endpoint.
3. Add editable site settings/page content model.
4. Ensure every content write route logs old/new values.
5. Add missing publish/unpublish/archive actions.
6. Add file upload support where missing.
7. Add CSV export for registrations/resources where useful.
8. Add permission and audit tests.

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
- is_published
- updated_by
- published_at
- created_at
- updated_at

media_assets
- file_key
- public_url
- filename
- mime_type
- size_bytes
- uploaded_by
- entity_type
- entity_id
- created_at
```

A central `media_assets` table will make uploads easier to reuse across hero slides, news, gallery, leaders, events, and about-page content.

## Security Requirements

- Validate file MIME type and size.
- Use soft delete for public content.
- Require confirmation for destructive actions.
- Restrict user management to admins only.
- Restrict audit logs to admins only.
- Never expose confidential welfare details publicly.
- Keep publishing intentional.
- Rate-limit sensitive admin endpoints.
- Log failed login attempts.
- Avoid leaking internal errors to the frontend.

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
```

## Delivery Sequence

1. Build admin layout and route shell.
2. Build admin dashboard summary.
3. Build audit log backend and UI.
4. Build leadership admin fully.
5. Build gallery admin with uploads.
6. Build news admin.
7. Build events admin.
8. Build opportunities admin.
9. Build academics admin.
10. Build welfare admin.
11. Build users and settings admin.
12. Add final permission/audit/security tests.

This sequence creates a deployable admin foundation early, then expands module by module without breaking the public website.
