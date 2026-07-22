# GPSA-UDS History & Legacy Page — Full-Stack Implementation Prompt

## Role

Act as a senior product designer, frontend engineer, backend engineer, database engineer, and QA engineer.

Your task is to implement the new **History & Legacy** page for the GPSA-UDS website using the attached visual wireframe/mockup as the primary design reference.

This is a **full-stack implementation**, not a static page. The page content must be backed by a maintainable data model, secure administrative workflows, media management, validation, publishing controls, and production-ready API or server-side data access.

---

# Primary Route

Implement:

```text
/about/history
```

This page is part of the About section and should appear in the About dropdown as:

```text
History & Legacy
```

Keep `/about` as the Overview page.

---

# Main Objective

Build a polished institutional history page that:

- tells the story of GPSA-UDS clearly;
- preserves institutional memory;
- displays verified milestones and achievements;
- communicates traditions and the “Pharmily” identity;
- presents measurable historical impact;
- supports a curated historical photo archive;
- allows authorized administrators to manage content without editing source code;
- remains fast, responsive, accessible, and easy to maintain;
- works correctly with the existing frontend, backend, authentication, storage, and deployment architecture.

Use the attached design image as a strong visual reference, but adapt it intelligently to the project’s real component system and content.

---

# Mandatory First Step: Investigate the Existing System

Before editing code:

1. Locate the existing frontend application and determine:
   - framework and version;
   - routing strategy;
   - server-rendering or client-rendering approach;
   - styling solution;
   - component library;
   - image optimization strategy;
   - form handling;
   - data-fetching conventions;
   - authentication and authorization model.

2. Locate the backend or data layer and determine:
   - whether the project uses Next.js route handlers, Supabase, PostgreSQL, Prisma, Drizzle, REST, GraphQL, or another stack;
   - current database migration strategy;
   - current storage solution for images and documents;
   - current admin or dashboard structure;
   - existing role and permission model;
   - existing audit-log facilities;
   - existing caching and revalidation behavior.

3. Inspect:
   - `/about`;
   - global navigation;
   - footer;
   - gallery;
   - leadership;
   - any CMS or admin pages;
   - reusable card, timeline, stats, media, and CTA components.

4. Run the project and capture:
   - current desktop page;
   - current mobile page;
   - console errors;
   - network errors;
   - broken assets;
   - layout problems;
   - performance issues.

5. Reuse the existing stack and conventions wherever practical.

Do not introduce a parallel backend architecture when the project already has a suitable one.

---

# Content Integrity Rules

This page contains institutional history. Accuracy matters.

Do not invent:

- foundation dates;
- recognition dates;
- administration years;
- milestones;
- achievements;
- statistics;
- partnerships;
- affiliations;
- photographs;
- officer names;
- official slogans;
- award claims.

When verified information is unavailable:

- create an unpublished or draft record;
- use a clearly marked admin placeholder;
- keep the item hidden from public display;
- add a developer note indicating what must be confirmed.

The public page must only display records whose publication status is approved.

---

# Visual Page Structure

Implement the page in the following order.

## 1. Header and About Navigation

Use the existing site header.

The About dropdown should include:

```text
Overview
History & Legacy
Leadership & Governance
Past Leadership & Recognition
Impact & Strategic Priorities
Documents & FAQs
```

For this task:

- `/about/history` must be the active route;
- desktop dropdown must be keyboard accessible;
- mobile About navigation must work as an accordion or nested menu;
- do not rely on hover alone;
- close menus on route selection, Escape, outside click, or navigation.

---

## 2. Hero

### Eyebrow

```text
ABOUT GPSA-UDS
```

### Headline

```text
Our History & Legacy
```

### Introductory copy

Use two concise paragraphs that explain:

- GPSA-UDS’s growth from its early formation to its present role;
- the values, service, leadership, and community spirit preserved across generations;
- the purpose of recording the association’s history for future students.

### Visual

Use an optimized campus, association, or university image with a dark green overlay.

Requirements:

- responsive image;
- explicit dimensions or aspect ratio;
- no layout shift;
- readable text contrast;
- proper alt text;
- no oversized image payload;
- no autoplay video background.

---

## 3. Institutional Journey Timeline

### Heading

```text
Our Journey
```

Display verified milestones chronologically.

Each milestone should contain:

- year or date;
- title;
- concise description;
- optional icon;
- optional image;
- publication status;
- display order.

Desktop:

- horizontal timeline when there is enough width;
- milestone points connected visually;
- each item remains readable without tiny text.

Tablet and mobile:

- vertical timeline;
- year and title remain prominent;
- no horizontal scrolling;
- no compressed multi-column cards.

The initial visual mockup shows example years such as 2015, 2018, 2021, 2023, and 2025. These are design examples only. Use actual verified dates from the database.

---

## 4. Milestones and Achievements

### Heading

```text
Milestones & Achievements
```

Recommended categories:

- Academic Excellence
- Welfare and Advocacy
- Professional Development
- Community Impact
- National and Global Reach
- Leadership Development

Each achievement card should contain:

- title;
- summary;
- category;
- optional icon;
- optional related year;
- optional detailed page or source link;
- publication status;
- display order.

Do not show vague or unsupported claims.

The page should allow an achievement to exist without a statistic.

---

## 5. Historical Impact by the Numbers

### Heading

```text
By the Numbers
```

Display only verified historical metrics.

Possible metrics:

- students represented since inception;
- academic programmes organised;
- welfare interventions;
- outreach beneficiaries;
- partnerships established;
- student leaders developed.

Every metric must support:

- value;
- label;
- optional suffix;
- reporting period;
- source note;
- verification status;
- display order.

Example value formats:

```text
1,250+
80+
₵180,000
12 countries
```

Do not use fabricated sample numbers on the public page.

An administrator should be able to mark a metric as verified before publication.

---

## 6. Traditions and Pharmily Spirit

### Heading

```text
Our Traditions — The Pharmily Spirit
```

Explain traditions and cultural values that define GPSA-UDS.

Possible themes:

- Pharmily Unity
- Excellence in All We Do
- Service to Humanity
- Leading with Integrity
- Leaving a Lasting Legacy

Each tradition should contain:

- title;
- short description;
- icon or visual symbol;
- display order;
- publication status.

This section must feel warm and human without becoming decorative or vague.

---

## 7. Historical Photo Preview

### Heading

```text
A Peek Into Our Journey
```

Show a curated selection of historical photos.

Each photo should support:

- image;
- title;
- caption;
- academic year;
- event type;
- photographer or source credit;
- alt text;
- date taken;
- featured flag;
- publication status;
- display order.

CTA:

```text
View Full Photo Archive
```

The CTA should link to an existing or newly supported gallery route.

Do not create a dead link.

### Performance

- use optimized responsive image delivery;
- lazy-load below-the-fold images;
- preserve aspect ratio;
- avoid a heavy carousel dependency;
- use CSS grid or scroll snap if horizontal browsing is needed;
- preload only the hero image when justified.

---

## 8. Legacy Call to Action

Use the mockup’s direction.

### Headline

```text
Be part of the legacy.
```

### Supporting copy

```text
Your story continues the story of GPSA-UDS.
```

Buttons:

- Join GPSA-UDS
- Explore Leadership

Use real routes only.

---

## 9. Footer

Reuse the existing footer.

Verify:

- official email;
- phone number;
- office location;
- social links;
- legal links;
- establishment year;
- no placeholders;
- no conflicting historical dates.

---

# Full Backend Support

The page must be driven by backend-managed content.

Use the project’s existing backend style. If the project uses Supabase, implement this with Supabase tables, RLS policies, storage, and server-side queries. If it uses another backend, map these requirements into the current architecture.

Do not create duplicate data-access patterns.

---

# Required Data Model

Use names consistent with the project.

The following model is conceptual and may be adapted to the current stack.

## 1. History Page Settings

Suggested entity:

```text
history_page_settings
```

Fields:

```text
id
hero_eyebrow
hero_title
hero_intro_primary
hero_intro_secondary
hero_image_key or hero_image_url
hero_image_alt
traditions_intro
legacy_cta_title
legacy_cta_description
legacy_primary_cta_label
legacy_primary_cta_url
legacy_secondary_cta_label
legacy_secondary_cta_url
is_published
published_at
created_at
updated_at
created_by
updated_by
```

Only one active published settings record should control the public page.

---

## 2. History Milestones

Suggested entity:

```text
history_milestones
```

Fields:

```text
id
year_label
event_date
title
summary
description
icon_name
image_key or image_url
image_alt
source_reference
verification_status
status
display_order
is_featured
published_at
created_at
updated_at
created_by
updated_by
```

Recommended status values:

```text
draft
pending_review
published
archived
```

Recommended verification values:

```text
unverified
verified
disputed
```

Validation:

- `title` required;
- `year_label` or `event_date` required;
- `summary` required;
- `display_order` must be non-negative;
- unpublished records must not appear publicly.

---

## 3. Historical Achievements

Suggested entity:

```text
history_achievements
```

Fields:

```text
id
category
title
summary
description
year_label
icon_name
source_reference
verification_status
status
display_order
published_at
created_at
updated_at
created_by
updated_by
```

Suggested categories:

```text
academic_excellence
welfare_advocacy
professional_development
community_impact
national_global_reach
leadership_development
other
```

Use a controlled enum or validated string strategy consistent with the existing codebase.

---

## 4. Historical Metrics

Suggested entity:

```text
history_metrics
```

Fields:

```text
id
value
numeric_value
prefix
suffix
label
description
reporting_period
source_reference
verification_status
status
display_order
published_at
created_at
updated_at
created_by
updated_by
```

Support display values such as:

```text
1,250+
₵180k
12 countries
```

Do not require every value to be numeric.

---

## 5. Traditions

Suggested entity:

```text
history_traditions
```

Fields:

```text
id
title
description
icon_name
status
display_order
published_at
created_at
updated_at
created_by
updated_by
```

---

## 6. Historical Media

If the project already has a general media or gallery table, reuse it.

Otherwise, suggested entity:

```text
history_media
```

Fields:

```text
id
title
caption
alt_text
image_key
thumbnail_key
academic_year
event_date
event_type
source_credit
photographer
is_featured
status
display_order
published_at
created_at
updated_at
created_by
updated_by
```

Suggested event types:

```text
academic
leadership
welfare
community_outreach
professional
social
graduation
conference
historical
other
```

---

## 7. Content Revision History

Use an existing audit system where available.

Otherwise support:

```text
history_content_revisions
```

Fields:

```text
id
entity_type
entity_id
action
before_json
after_json
changed_by
changed_at
```

Track:

- create;
- update;
- publish;
- unpublish;
- archive;
- delete;
- reorder.

Do not permanently delete important institutional records by default. Prefer soft delete or archive.

---

# Database Migration Requirements

Create proper migrations for all new tables, enums, indexes, constraints, and policies.

Required:

- primary keys;
- foreign keys to users or profiles where applicable;
- created and updated timestamps;
- indexes for status and display order;
- indexes for event date and publication date;
- uniqueness constraints where appropriate;
- check constraints for valid ordering;
- soft-delete or archive strategy;
- rollback-safe migration design.

Do not modify production data destructively.

If tables already exist, write a safe migration that preserves data.

---

# API or Server-Side Data Access

Implement the public page with server-side data fetching where supported.

## Public read operations

The public route should retrieve:

- published page settings;
- published and verified milestones;
- published achievements;
- published and verified metrics;
- published traditions;
- published featured historical media.

Public responses must exclude:

- drafts;
- pending review content;
- unverified metrics when policy requires verification;
- private source notes;
- internal audit fields;
- uploader contact information;
- storage-internal metadata.

## Suggested endpoints

Adapt to the project’s conventions.

```text
GET /api/public/about/history
GET /api/public/about/history/milestones
GET /api/public/about/history/achievements
GET /api/public/about/history/metrics
GET /api/public/about/history/traditions
GET /api/public/about/history/media
```

A single aggregated endpoint is acceptable and may be better for performance:

```text
GET /api/public/about/history
```

Suggested public response shape:

```json
{
  "settings": {},
  "milestones": [],
  "achievements": [],
  "metrics": [],
  "traditions": [],
  "featuredMedia": []
}
```

Use existing server actions, route handlers, repositories, or service patterns where available.

---

# Admin Content Management

Provide full admin support.

Use the existing admin dashboard and authorization system.

Recommended admin routes:

```text
/admin/about/history
/admin/about/history/milestones
/admin/about/history/achievements
/admin/about/history/metrics
/admin/about/history/traditions
/admin/about/history/media
```

## Admin capabilities

Authorized users must be able to:

- edit hero and page settings;
- create milestones;
- edit milestones;
- reorder milestones;
- verify or dispute milestone dates;
- publish and unpublish milestones;
- archive milestones;
- create achievements;
- assign categories;
- reorder achievements;
- create historical metrics;
- add source references;
- mark metrics verified;
- create and edit traditions;
- upload historical photos;
- edit alt text and captions;
- feature or unfeature photos;
- preview unpublished content;
- publish content;
- view revision history.

## Required admin UX

- clear draft/published status;
- validation messages;
- confirmation for archive or destructive actions;
- unsaved-change warning;
- loading and success states;
- optimistic updates only when safe;
- accessible forms;
- keyboard support;
- responsive dashboard layout.

---

# Roles and Permissions

Use the existing role model.

At minimum support:

## Public Visitor

Can view published content only.

## Content Editor

Can:

- create and edit drafts;
- upload media;
- reorder content;
- submit for review.

Cannot:

- publish;
- delete permanently;
- change permissions.

## Content Publisher or Admin

Can:

- approve;
- publish;
- unpublish;
- archive;
- mark records verified;
- manage page settings.

## Super Admin

Can perform all administrative operations according to the existing platform rules.

Enforce authorization on the backend, not only in the UI.

If using Supabase, implement appropriate Row Level Security policies.

---

# Media Storage

Use the existing object storage solution.

Required:

- private or controlled upload bucket where appropriate;
- approved public delivery mechanism;
- file type validation;
- maximum file size;
- image dimension validation;
- unique object keys;
- safe filename handling;
- thumbnail generation if supported;
- orphaned-file cleanup;
- metadata storage;
- alt text required before publication.

Recommended accepted formats:

```text
image/jpeg
image/png
image/webp
image/avif
```

Do not allow executable uploads.

Do not store large binary images directly in relational database columns.

---

# Validation Rules

Implement validation on both client and server.

Examples:

- milestone title: required;
- summary: required and length-limited;
- year label: validated format;
- event date: valid date;
- image alt text: required before publish;
- display order: integer >= 0;
- metric label: required;
- source reference: required for sensitive or exact claims where policy demands it;
- URLs: valid and safe;
- CTA routes: must be internal or explicitly approved;
- status transitions: controlled;
- publication requires required fields.

Use the project’s existing validation library.

---

# Publishing Workflow

Implement a safe content lifecycle:

```text
Draft
→ Pending Review
→ Published
→ Archived
```

Rules:

- public pages display only published content;
- publishing requires appropriate permission;
- verified metrics must be explicitly marked;
- publication timestamp must be recorded;
- edits to published records should either update safely or create a new draft revision according to the current CMS pattern;
- archived content remains available to administrators.

Preview mode should allow authorized users to inspect draft content before publication.

---

# Caching and Revalidation

The page should be fast but reflect updates reliably.

Use the existing framework’s caching model.

Recommended approach:

- server-render published history content;
- cache public data;
- revalidate after admin publication;
- invalidate only relevant history routes and data keys;
- avoid refetching all site content after every small change;
- do not expose stale draft content.

If using Next.js:

- use server components where appropriate;
- minimise client components;
- use `revalidatePath` or tag-based revalidation after publish;
- avoid fetching the same data multiple times in one request.

---

# Frontend Component Architecture

Do not create one giant page component.

Suggested structure:

```text
HistoryLegacyPage
├── HistoryHero
├── HistoryTimeline
├── AchievementGrid
├── HistoricalMetrics
├── TraditionsSection
├── HistoricalGalleryPreview
├── LegacyCTA
└── SharedFooter
```

Suggested reusable data types:

```ts
type HistoryPageSettings = {
  heroEyebrow: string;
  heroTitle: string;
  heroIntroPrimary: string;
  heroIntroSecondary?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
};

type HistoryMilestone = {
  id: string;
  yearLabel: string;
  eventDate?: string;
  title: string;
  summary: string;
  iconName?: string;
  imageUrl?: string;
  imageAlt?: string;
};

type HistoryAchievement = {
  id: string;
  category: string;
  title: string;
  summary: string;
  iconName?: string;
};

type HistoryMetric = {
  id: string;
  value: string;
  label: string;
  reportingPeriod?: string;
};

type HistoryTradition = {
  id: string;
  title: string;
  description: string;
  iconName?: string;
};

type HistoryMediaItem = {
  id: string;
  title: string;
  caption?: string;
  altText: string;
  imageUrl: string;
  academicYear?: string;
};
```

Adapt these names to the project’s naming conventions.

---

# Responsive Design Requirements

Test at minimum:

```text
320 × 568
360 × 800
390 × 844
412 × 915
768 × 1024
1024 × 768
1280 × 800
1440 × 900
```

Required behavior:

- no horizontal overflow;
- hero copy remains readable;
- timeline converts to vertical on smaller screens;
- achievement cards stack naturally;
- metrics remain readable;
- tradition icons and text do not collapse;
- gallery images preserve aspect ratio;
- CTA buttons remain usable;
- footer remains stable;
- touch targets are at least 44 × 44 px where practical;
- page supports 200% zoom.

Avoid fixed content heights.

---

# Accessibility Requirements

Target WCAG 2.1 AA.

Required:

- one page `h1`;
- logical heading structure;
- semantic sections;
- accessible navigation;
- visible focus;
- keyboard-operable menus;
- sufficient contrast;
- descriptive alt text;
- captions for historical images;
- reduced-motion support;
- no color-only status indicators;
- buttons and links use correct semantics;
- timeline remains understandable without visual connectors;
- admin forms have labels, instructions, and error summaries.

---

# Performance Requirements

The redesign must not materially regress site performance.

Required:

- server-render static institutional content where possible;
- minimise client JavaScript;
- use framework-native image optimization;
- lazy-load below-the-fold images;
- avoid large animation libraries;
- avoid autoplay media;
- avoid unnecessary third-party dependencies;
- import icons individually;
- use CSS for simple transitions;
- prevent cumulative layout shift;
- use pagination or limited queries for media;
- avoid N+1 queries;
- use indexed database queries;
- aggregate public data efficiently;
- cache published content appropriately.

Do not load the full historical archive on the landing page.

---

# Security Requirements

Required:

- backend authorization for all admin mutations;
- CSRF protection where relevant to the stack;
- server-side validation;
- sanitized text and URLs;
- safe file uploads;
- no secrets in client bundles;
- no service-role key exposure;
- no public access to drafts;
- no unrestricted storage write policy;
- rate limiting for mutation endpoints where appropriate;
- audit all publish and archive actions.

---

# Error and Empty States

Public page:

- if no milestones exist, hide the section gracefully;
- if no image is available, use a branded non-photographic fallback;
- do not show broken image icons;
- do not expose raw backend errors;
- render a safe page when one section fails.

Admin:

- meaningful validation errors;
- retry support;
- upload progress;
- failed upload cleanup;
- clear publish errors;
- empty-state guidance.

---

# SEO and Metadata

Implement:

```text
Title: History & Legacy | GPSA-UDS
```

Suggested description:

```text
Explore the history, milestones, achievements, traditions, and enduring legacy of the Ghana Pharmaceutical Students’ Association at the University for Development Studies.
```

Also support:

- canonical URL;
- Open Graph title and description;
- Open Graph image;
- crawlable server-rendered text;
- meaningful internal links;
- correct heading hierarchy.

Do not publish unverified dates in structured metadata.

---

# Seed and Migration Data

If existing verified history content exists:

- migrate it safely;
- preserve source references;
- mark uncertain records as draft or unverified;
- do not automatically publish conflicting data.

Provide a seed mechanism for local development, but clearly label all sample records as development-only.

Never seed fake production claims.

---

# Testing Requirements

## Backend tests

Test:

- public queries return published content only;
- drafts are excluded;
- archived content is excluded;
- authorization rules;
- role restrictions;
- publish transitions;
- validation failures;
- ordering;
- metric verification;
- upload validation;
- revalidation behavior;
- audit log creation.

## Frontend tests

Test:

- sections render from backend data;
- missing optional sections are handled;
- timeline mobile layout;
- buttons and links;
- loading states;
- empty states;
- image fallbacks;
- accessible names;
- keyboard navigation.

## Integration tests

Test:

```text
Admin creates milestone
→ saves draft
→ submits for review
→ publisher verifies and publishes
→ public page updates
```

Also test:

```text
Admin uploads historical image
→ adds alt text
→ publishes
→ image appears in preview
→ archive link works
```

## Technical checks

Run all available project checks:

```text
typecheck
lint
unit tests
integration tests
end-to-end tests
production build
```

Use Playwright or the project’s current E2E framework where available.

---

# Browser and Device Testing

Verify at minimum:

- Chrome/Chromium;
- Firefox;
- Android mobile viewport;
- tablet viewport;
- Safari where the environment supports it.

Check:

- sticky or dropdown navigation;
- timeline rendering;
- image cropping;
- button wrapping;
- footer layout;
- keyboard interaction;
- slow-network image behavior.

---

# Acceptance Criteria

The implementation is complete only when:

- `/about/history` exists and matches the attached design direction;
- the page is backed by real backend-managed content;
- authorized administrators can manage all page sections;
- draft, review, publish, archive, and verification workflows work;
- public users cannot access drafts;
- history dates and claims are not fabricated;
- the page is responsive at all required sizes;
- the timeline works on mobile without horizontal scrolling;
- gallery images are optimized;
- accessibility fundamentals are implemented;
- all CTAs lead to valid routes;
- caching and revalidation work after publishing;
- migrations are safe;
- security policies are enforced;
- audit history is recorded;
- no console, type, lint, test, build, or hydration errors remain;
- performance does not meaningfully regress.

---

# Final Delivery Report

When finished, provide:

1. Summary of the full-stack implementation.
2. Files added and changed.
3. Database tables, columns, enums, indexes, and migrations.
4. API routes, server actions, services, or repositories added.
5. Admin routes and workflows added.
6. Roles and permissions enforced.
7. Storage and image handling decisions.
8. Caching and revalidation strategy.
9. Content that still needs official verification.
10. Accessibility improvements.
11. Performance improvements.
12. Security controls.
13. Tests and commands run.
14. Test results.
15. Desktop, tablet, and mobile screenshots.
16. Remaining limitations.

Do not call the work complete until the feature has been implemented, migrated, run, visually inspected, tested, and iterated on.
