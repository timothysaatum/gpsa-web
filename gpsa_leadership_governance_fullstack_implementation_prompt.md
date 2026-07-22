# GPSA-UDS Leadership & Governance Page — Full-Stack Implementation Prompt

## Role

Act as a senior product designer, frontend engineer, backend engineer, database engineer, security engineer, and QA engineer.

Your task is to implement the new **Leadership & Governance** page for the GPSA-UDS website using the attached visual design as the primary visual reference.

This is a **full-stack implementation**, not a static mockup. The page must be backed by secure, maintainable data models, administrative workflows, media handling, permissions, publishing controls, and production-ready frontend and backend architecture.

---

# Primary Route

Implement:

```text
/about/leadership
```

This page is part of the About section and should appear in the About dropdown as:

```text
Leadership & Governance
```

Keep:

```text
/about
```

as the About Overview page.

---

# Main Objective

Build a polished institutional page that:

- explains how GPSA-UDS is governed;
- presents the current executive leadership clearly;
- places the President and Vice President above the rest of the executive team;
- presents standing committees and governance bodies;
- communicates accountability, transparency, and constitutional order;
- supports secure backend management of leaders, committees, governance bodies, administration years, documents, and contact visibility;
- allows authorized administrators to update leadership without editing source code;
- remains responsive, accessible, performant, and easy to maintain.

Use the attached design as a strong visual direction, but adapt it intelligently to the real project architecture and design system.

---

# Mandatory First Step: Investigate Before Editing

Before changing code:

1. Locate the existing frontend application and determine:
   - framework and version;
   - routing strategy;
   - server-rendering or client-rendering approach;
   - styling system;
   - component library;
   - image optimization strategy;
   - form handling;
   - data-fetching conventions;
   - authentication and authorization model.

2. Locate the backend or data layer and determine:
   - database technology;
   - ORM or query layer;
   - migration system;
   - API pattern;
   - storage solution;
   - current admin dashboard;
   - role and permission model;
   - audit-log support;
   - caching and revalidation strategy.

3. Inspect:
   - `/about`;
   - global About navigation;
   - existing leadership or executive components;
   - current user/profile tables;
   - current media or gallery tables;
   - current document management;
   - current admin pages;
   - footer and contact information;
   - any existing committee or role data.

4. Run the project and capture:
   - current desktop state;
   - current tablet state;
   - current mobile state;
   - console errors;
   - network errors;
   - broken links;
   - missing images;
   - hydration issues;
   - layout overflow.

5. Reuse the current architecture and conventions wherever practical.

Do not create a parallel CMS, authentication layer, or storage system if the project already has a suitable one.

---

# Content Integrity Rules

Do not invent:

- executive names;
- official titles;
- administration years;
- committee names;
- governance responsibilities;
- office contacts;
- photographs;
- constitutional duties;
- election or appointment status;
- official documents;
- official social links.

When verified information is unavailable:

- create draft records only;
- keep them unpublished;
- use neutral placeholders in the admin UI;
- add developer notes;
- never present sample people or offices as real public data.

The public page must only display published and approved records.

---

# Visual Page Structure

Implement the page in the following order.

## 1. Shared Header and About Navigation

Use the existing global site header.

The About dropdown should include:

```text
Overview
History & Legacy
Leadership & Governance
Past Leadership & Recognition
Impact & Strategic Priorities
Documents & FAQs
```

For this route:

- `Leadership & Governance` must be the active item;
- desktop navigation must be keyboard accessible;
- mobile navigation must use a nested accordion or drawer;
- do not rely on hover alone;
- close dropdowns on selection, route change, outside click, and Escape.

---

## 2. Hero

### Eyebrow

```text
LEADERSHIP & GOVERNANCE
```

### Headline

```text
Led by Students.
Governed for All.
```

### Introductory copy

Use verified copy explaining that GPSA-UDS is democratically governed by students and that its structures support:

- accountability;
- transparency;
- fair representation;
- responsible administration;
- meaningful member participation.

### Primary CTA

```text
Meet the Executive Team
```

### Secondary CTA

```text
Our Governance Documents
```

Only activate CTAs when valid routes exist.

### Visual direction

- full-width institutional image;
- dark green overlay;
- readable white text;
- optional quote card on the right;
- no autoplay video;
- responsive image delivery;
- explicit dimensions or aspect ratio;
- meaningful alt text;
- no large unoptimized payload.

---

## 3. Governance Structure at a Glance

### Heading

```text
Governance Structure (At a Glance)
```

Present five bodies:

### General Assembly

The principal deliberative body composed of eligible members and responsible for major association decisions.

### Executive Board

Responsible for day-to-day leadership, administration, and implementation of approved programmes and decisions.

### Standing Committees

Specialised committees supporting key functional areas of the association.

### Judicial Board

Responsible for constitutional interpretation and internal judicial or disciplinary matters within its mandate.

### Electoral Commission

Independent body responsible for conducting free, fair, and transparent elections.

Each body should support:

- title;
- short description;
- optional icon;
- optional detailed route;
- display order;
- publication status.

### Responsive behavior

- Desktop: five cards in one row when space permits.
- Tablet: two or three columns.
- Mobile: one column.
- No tiny text.
- No horizontal scrolling.

---

# 4. Featured Leadership Tier

This section must make the President and Vice President visibly more prominent than the rest of the executive team.

### Heading

```text
2025/2026 Executive Leadership
```

The administration year must come from backend data.

## President and Vice President Layout

Desktop:

```text
President card | Vice President card
```

Mobile:

```text
President card
Vice President card
```

### Featured card requirements

Each card should include:

- verified photograph;
- office badge;
- full name;
- official position;
- administration year;
- short leadership summary;
- key portfolio responsibilities;
- optional approved contact links;
- optional approved social links;
- profile detail link;
- publication status.

### President card

The President card may be slightly more prominent through:

- first placement;
- subtle gold border;
- larger visual emphasis;
- stronger title treatment.

Do not make the Vice President card feel secondary or visually weak.

### Contact visibility

Contact fields must support:

- hidden;
- public;
- members-only;
- admin-only.

Do not expose private phone numbers or email addresses by default.

---

# 5. Executive Team

### Heading

```text
Executive Team
```

Display all other approved executives beneath the featured leadership tier.

Possible positions may include only verified offices such as:

- General Secretary
- Financial Secretary
- Organising Secretary
- Public Relations Officer
- Assistant Secretary
- Treasurer
- Academic Officer
- Welfare Officer
- other constitutionally recognized positions

Do not hard-code unverified roles.

### Executive card requirements

Each card should include:

- photo or initials fallback;
- name;
- office title;
- concise portfolio description;
- optional contact icons;
- profile detail link;
- display order;
- publication status.

### Layout

- Desktop: 4–5 cards per row depending on width.
- Tablet: 2–3 cards per row.
- Mobile: 1–2 cards per row depending on width.
- Avoid horizontal carousels for the main executive team.
- All executives must be reachable through natural vertical scrolling.

CTA:

```text
View All Executives
```

Only show if a detailed executive directory route exists.

---

# 6. Standing Committees

### Heading

```text
Standing Committees
```

Possible committee categories may include only verified committees such as:

- Academics
- Welfare
- Professional Development
- Public Relations & Communications
- Sports & Social
- Health Outreach & Community Service
- Editorial
- Finance
- Events
- Research
- other approved committees

Each committee card should support:

- name;
- short description;
- functions;
- icon;
- chairperson reference;
- committee members count;
- contact visibility;
- detail route;
- display order;
- status.

CTA on each card:

```text
View Committee
```

Do not create dead links.

### Responsive behavior

- Desktop: 5–6 compact cards per row when practical.
- Tablet: 2–3 columns.
- Mobile: one column.
- Ensure titles wrap correctly.

---

# 7. Governance and Accountability

Add a full-width institutional section.

### Heading

```text
Governance & Accountability
```

### Supporting copy

Explain that GPSA-UDS leadership is guided by:

- Constitution
- Standing Orders
- Policies
- Transparency
- Accountability
- Ethical leadership

Suggested feature items:

### Constitution

Guides the structure, authority, and operations of the association.

### Policies

Promote fairness, consistency, and responsible administration.

### Transparency

Ensures leaders remain accountable to members.

### CTA

```text
View Governance Documents
```

Link to the real documents route.

---

# 8. Final Call to Action

### Headline

```text
Your voice. Your association.
```

### Supporting copy

Encourage members to:

- participate;
- join committees;
- engage leadership;
- attend General Assembly meetings;
- use approved contact channels;
- contribute to the future of GPSA-UDS.

Buttons:

- Join GPSA-UDS
- Get Involved
- Contact Us

Use real routes only.

---

# 9. Footer

Reuse the existing site footer.

Verify:

- official contact information;
- office location;
- email address;
- phone number;
- office hours;
- social links;
- legal links;
- administration year;
- no placeholder data.

---

# Full Backend Support

The page must be managed through backend data.

Use the existing backend style. If the project uses Supabase, use tables, storage, RLS, server-side queries, and admin tooling consistent with the rest of the application. If another stack is used, map these requirements into that architecture.

Do not create duplicate data access patterns.

---

# Required Data Model

The following entities are conceptual. Adapt them to the existing project.

## 1. Leadership Page Settings

Suggested entity:

```text
leadership_page_settings
```

Fields:

```text
id
hero_eyebrow
hero_title
hero_intro
hero_image_key
hero_image_alt
quote_text
quote_author
primary_cta_label
primary_cta_url
secondary_cta_label
secondary_cta_url
is_published
published_at
created_at
updated_at
created_by
updated_by
```

Only one active published record should control the public page.

---

## 2. Administrations

Suggested entity:

```text
leadership_administrations
```

Fields:

```text
id
academic_year
theme
slogan
starts_at
ends_at
is_current
status
published_at
created_at
updated_at
created_by
updated_by
```

Recommended statuses:

```text
draft
pending_review
published
archived
```

Constraints:

- only one administration may be current;
- academic year must be unique;
- current administration must be published before appearing publicly.

---

## 3. Leadership Positions

Suggested entity:

```text
leadership_positions
```

Fields:

```text
id
name
slug
short_name
description
rank
tier
is_featured
is_executive
is_active
display_order
created_at
updated_at
```

Suggested tier values:

```text
featured
executive
board
commission
committee
other
```

Use `rank` and `display_order` rather than relying on title strings.

President and Vice President must be configured as:

```text
tier = featured
```

Do not hard-code hierarchy in presentation logic only.

---

## 4. Leaders

Suggested entity:

```text
leaders
```

Fields:

```text
id
full_name
preferred_name
slug
bio
photo_key
photo_alt
email
phone
linkedin_url
other_social_url
contact_visibility
profile_status
created_at
updated_at
created_by
updated_by
```

Suggested contact visibility values:

```text
hidden
public
members_only
admin_only
```

---

## 5. Leadership Appointments

Suggested entity:

```text
leadership_appointments
```

Fields:

```text
id
administration_id
leader_id
position_id
portfolio_summary
responsibilities_json
is_primary
is_acting
started_at
ended_at
status
display_order
published_at
created_at
updated_at
created_by
updated_by
```

This table connects a person, position, and administration.

This supports:

- current leadership;
- past leadership;
- acting appointments;
- multiple appointments;
- future legacy pages.

---

## 6. Governance Bodies

Suggested entity:

```text
governance_bodies
```

Fields:

```text
id
name
slug
short_description
full_description
body_type
icon_name
authority_summary
composition_summary
functions_json
detail_url
status
display_order
published_at
created_at
updated_at
created_by
updated_by
```

Suggested body types:

```text
general_assembly
executive_board
standing_committees
judicial_board
electoral_commission
other
```

---

## 7. Committees

Suggested entity:

```text
committees
```

Fields:

```text
id
name
slug
short_description
full_description
icon_name
functions_json
administration_id
chairperson_appointment_id
contact_email
contact_phone
contact_visibility
status
display_order
published_at
created_at
updated_at
created_by
updated_by
```

---

## 8. Committee Memberships

Suggested entity:

```text
committee_memberships
```

Fields:

```text
id
committee_id
leader_id
role_title
is_chairperson
started_at
ended_at
status
display_order
created_at
updated_at
created_by
updated_by
```

---

## 9. Governance Documents

Reuse an existing document table if available.

Otherwise suggested entity:

```text
governance_documents
```

Fields:

```text
id
title
slug
document_type
description
version
academic_year
file_key
file_name
mime_type
file_size_bytes
is_public
status
published_at
created_at
updated_at
created_by
updated_by
```

Suggested document types:

```text
constitution
standing_orders
policy
strategic_plan
election_guideline
annual_report
committee_regulation
other
```

---

## 10. Audit and Revision History

Use the existing audit system.

Otherwise support:

```text
leadership_content_revisions
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
- reorder;
- contact visibility change;
- appointment change;
- committee membership change.

---

# Database Migration Requirements

Create safe migrations for all new tables, constraints, enums, indexes, and policies.

Required:

- primary keys;
- foreign keys;
- timestamps;
- indexes for status and display order;
- indexes for administration and appointment lookups;
- uniqueness constraints for slugs and academic years;
- constraint enforcing one current administration;
- safe soft-delete or archive strategy;
- rollback-safe migration;
- no destructive production data changes.

If existing leadership data exists, migrate it safely.

---

# Public Data Access

The public route should retrieve:

- published page settings;
- current published administration;
- President and Vice President appointments;
- remaining published executive appointments;
- published governance bodies;
- published committees;
- public governance document links.

Public responses must exclude:

- drafts;
- pending review records;
- private contact details;
- internal notes;
- audit fields;
- admin-only metadata;
- archived appointments.

Suggested endpoint:

```text
GET /api/public/about/leadership
```

Suggested response:

```json
{
  "settings": {},
  "administration": {},
  "governanceBodies": [],
  "featuredLeaders": [],
  "executives": [],
  "committees": [],
  "documents": []
}
```

Prefer one aggregated server-side query for the page.

Avoid N+1 queries.

---

# Admin Content Management

Integrate with the existing admin dashboard.

Suggested admin routes:

```text
/admin/about/leadership
/admin/about/leadership/administrations
/admin/about/leadership/positions
/admin/about/leadership/leaders
/admin/about/leadership/appointments
/admin/about/leadership/governance-bodies
/admin/about/leadership/committees
/admin/about/leadership/documents
```

Authorized users must be able to:

- edit page settings;
- create administrations;
- mark one administration current;
- create positions;
- assign tier and rank;
- create leader profiles;
- upload profile photos;
- create appointments;
- assign President and Vice President;
- reorder executives;
- create governance bodies;
- create committees;
- assign chairpersons;
- add committee members;
- control contact visibility;
- upload governance documents;
- preview drafts;
- publish;
- unpublish;
- archive;
- view revision history.

---

# Admin UX Requirements

Required:

- clear administration selector;
- clear current administration badge;
- drag-and-drop or safe reorder controls;
- preview of public leadership hierarchy;
- validation preventing duplicate President appointments;
- validation preventing duplicate Vice President appointments;
- warning before changing current administration;
- status indicators;
- unsaved-change warning;
- image upload progress;
- accessible forms;
- clear publish confirmations;
- responsive dashboard.

Do not publish a leader without:

- name;
- position;
- administration;
- portfolio summary;
- photo alt text when a photo exists.

---

# Roles and Permissions

Use the existing authorization model.

At minimum:

## Public Visitor

Can view published records only.

## Content Editor

Can:

- create and edit drafts;
- upload photos;
- manage descriptions;
- reorder draft content;
- submit for review.

Cannot:

- publish;
- alter permissions;
- expose private contacts;
- permanently delete institutional records.

## Content Publisher or Admin

Can:

- approve;
- publish;
- unpublish;
- archive;
- manage current administration;
- manage contact visibility;
- approve public contact fields.

## Super Admin

Can perform all authorized platform operations.

Enforce permissions on the backend, not only in the UI.

---

# Media Storage

Use the project’s existing object storage.

Required:

- validate file type;
- validate file size;
- validate dimensions;
- use safe unique keys;
- generate optimized derivatives where supported;
- require alt text before publication;
- clean orphaned uploads;
- do not store binary images in relational columns;
- do not expose private storage credentials.

Recommended accepted formats:

```text
image/jpeg
image/png
image/webp
image/avif
```

---

# Contact Privacy

Leadership pages often expose personal details. Privacy must be explicit.

Support:

```text
hidden
public
members_only
admin_only
```

Rules:

- public page displays only fields marked public;
- phone numbers hidden by default;
- personal email hidden by default;
- official role email may be public;
- admin UI must show a clear consent notice;
- contact visibility changes must be audited;
- never expose contact fields through public API responses when hidden.

---

# Validation Rules

Implement server-side and client-side validation.

Examples:

- administration year required;
- only one current administration;
- only one active President per administration;
- only one active Vice President per administration;
- leader name required;
- position required;
- portfolio summary length-limited;
- valid URLs;
- valid email and phone formats;
- safe display order;
- valid status transitions;
- photo alt text required before publish;
- public contact requires explicit visibility selection;
- committee slug unique;
- governance body type validated;
- document type validated;
- document file required before publish.

Use the existing validation library.

---

# Publishing Workflow

Implement:

```text
Draft
→ Pending Review
→ Published
→ Archived
```

Rules:

- only published content appears publicly;
- publishing requires appropriate role;
- administration changes should not silently replace historical records;
- changing a current administration should preserve the previous one;
- appointment end dates should be recorded;
- archived records remain available to admins;
- preview mode should support unpublished content.

---

# Caching and Revalidation

Use the project’s existing caching model.

Recommended:

- server-render public leadership content;
- cache published leadership data;
- invalidate only leadership-related routes after publication;
- use tag-based or path-based revalidation where supported;
- avoid client-side fetching for static institutional content;
- minimise duplicate queries.

If using Next.js:

- prefer server components;
- use `revalidatePath` or `revalidateTag`;
- avoid unnecessary client components;
- avoid re-fetching the same data in nested components.

---

# Frontend Component Architecture

Suggested structure:

```text
LeadershipGovernancePage
├── LeadershipHero
├── GovernanceStructure
├── FeaturedLeadership
│   ├── PresidentCard
│   └── VicePresidentCard
├── ExecutiveGrid
├── CommitteeGrid
├── GovernanceAccountability
├── LeadershipCTA
└── SharedFooter
```

Suggested types:

```ts
type Administration = {
  id: string;
  academicYear: string;
  theme?: string;
  slogan?: string;
};

type LeadershipPosition = {
  id: string;
  name: string;
  tier: "featured" | "executive" | "other";
  rank: number;
};

type Leader = {
  id: string;
  fullName: string;
  slug: string;
  photoUrl?: string;
  photoAlt?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
};

type LeadershipAppointment = {
  id: string;
  leader: Leader;
  position: LeadershipPosition;
  portfolioSummary: string;
  responsibilities: string[];
  displayOrder: number;
};

type GovernanceBody = {
  id: string;
  name: string;
  shortDescription: string;
  iconName?: string;
};

type Committee = {
  id: string;
  name: string;
  shortDescription: string;
  iconName?: string;
  href?: string;
};
```

Adapt to existing project conventions.

---

# Responsive Requirements

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

Required:

- no horizontal overflow;
- hero content remains readable;
- governance cards stack naturally;
- President and Vice President remain above all other executives;
- featured cards stack on mobile;
- executive cards remain readable;
- committee cards wrap correctly;
- contact icons remain usable;
- CTA buttons wrap cleanly;
- footer remains stable;
- support 200% zoom;
- touch targets at least 44 × 44 px where practical.

Do not use fixed heights for content-heavy cards.

---

# Accessibility Requirements

Target WCAG 2.1 AA.

Required:

- one `h1`;
- logical heading order;
- semantic sections;
- accessible dropdown navigation;
- visible focus;
- keyboard-operable CTAs;
- sufficient contrast;
- descriptive image alt text;
- contact icons with accessible names;
- no information conveyed by color alone;
- reduced-motion support;
- correct button and link semantics;
- leadership hierarchy understandable without visual styling;
- admin forms with labels and error summaries.

---

# Performance Requirements

The implementation must not materially degrade performance.

Required:

- server-render public content where possible;
- minimise client JavaScript;
- use responsive image optimization;
- lazy-load below-the-fold portraits;
- avoid loading full-resolution originals;
- do not add a large carousel dependency;
- import icons individually;
- avoid duplicated profile queries;
- use indexed joins;
- avoid N+1 queries;
- cache published content;
- revalidate after admin publishing;
- prevent layout shifts;
- avoid unnecessary animation.

Do not eagerly load every executive image if only the top leadership is above the fold.

---

# Security Requirements

Required:

- backend authorization;
- server-side validation;
- safe media uploads;
- no public draft access;
- no exposed service credentials;
- no unrestricted storage writes;
- sanitized text and URLs;
- audit publish and contact visibility changes;
- rate-limit mutation endpoints where appropriate;
- protect admin routes;
- enforce RLS where applicable.

---

# Empty and Error States

Public page:

- if no current administration exists, show a safe institutional message;
- if President or Vice President is missing, hide that card gracefully and log the content issue;
- if images are missing, use initials or a branded fallback;
- do not show broken images;
- do not expose raw backend errors;
- sections with no published data should hide cleanly.

Admin:

- empty-state guidance;
- upload failure recovery;
- publish validation errors;
- duplicate appointment warnings;
- safe retry controls;
- clear status transitions.

---

# SEO and Metadata

Implement:

```text
Title: Leadership & Governance | GPSA-UDS
```

Suggested description:

```text
Meet the current GPSA-UDS executive leadership, learn how the association is governed, and explore its committees, constitutional bodies, and accountability structures.
```

Also support:

- canonical URL;
- Open Graph metadata;
- crawlable text;
- meaningful internal links;
- correct heading hierarchy.

Do not include private contact details in metadata.

---

# Seed and Migration Data

If verified existing leadership data exists:

- migrate safely;
- preserve administration history;
- preserve image references;
- preserve contact privacy;
- mark uncertain data as draft;
- never overwrite historical appointments.

Local development seed data may be created, but must be clearly marked development-only.

Do not seed fake production leaders.

---

# Testing Requirements

## Backend tests

Test:

- public API returns published records only;
- draft leaders are excluded;
- archived appointments are excluded;
- only one current administration;
- only one President per administration;
- only one Vice President per administration;
- contact privacy rules;
- role authorization;
- publish transitions;
- reorder behavior;
- audit log creation;
- safe document access;
- storage validation;
- revalidation.

## Frontend tests

Test:

- President and Vice President appear before the remaining executives;
- mobile layout stacks correctly;
- missing image fallback;
- hidden contacts are not rendered;
- governance cards render;
- committee links work;
- CTAs work;
- empty states work;
- keyboard navigation;
- accessible names;
- responsive layout.

## Integration tests

Test:

```text
Admin creates administration
→ creates President and Vice President appointments
→ publishes administration
→ public page shows both at the top
→ remaining executives appear below
```

Test:

```text
Admin changes contact visibility to hidden
→ public API no longer returns the contact field
→ public page removes the icon
```

Test:

```text
Admin ends current administration
→ creates new administration
→ previous administration remains preserved
→ new current leadership appears publicly after publish
```

## Technical checks

Run:

```text
typecheck
lint
unit tests
integration tests
end-to-end tests
production build
```

Use Playwright or the project’s existing E2E system where available.

---

# Browser and Device Testing

Verify at minimum:

- Chrome/Chromium;
- Firefox;
- Android mobile viewport;
- tablet viewport;
- Safari where supported.

Check:

- dropdown navigation;
- hero layout;
- leadership hierarchy;
- image loading;
- card wrapping;
- contact icon focus;
- mobile scrolling;
- footer;
- slow network behavior.

---

# Acceptance Criteria

The implementation is complete only when:

- `/about/leadership` exists;
- the visual direction matches the attached design;
- President and Vice President are featured above all other executives;
- leadership hierarchy is backend-driven;
- current administration data is backend-managed;
- governance bodies are backend-managed;
- committees are backend-managed;
- admin workflows work;
- role permissions are enforced;
- contact privacy is enforced;
- drafts are not public;
- migrations are safe;
- no fabricated leadership data is published;
- the page is responsive;
- accessibility fundamentals are implemented;
- performance does not meaningfully regress;
- caching and revalidation work;
- no console, build, lint, type, test, hydration, or broken-link errors remain.

---

# Final Delivery Report

When finished, provide:

1. Summary of the full-stack implementation.
2. Files added and changed.
3. Database tables, fields, enums, indexes, and constraints.
4. Migration details.
5. API routes, server actions, repositories, or services added.
6. Admin routes and workflows added.
7. Roles and permissions enforced.
8. President/Vice President hierarchy implementation.
9. Contact privacy implementation.
10. Media storage decisions.
11. Caching and revalidation strategy.
12. Accessibility improvements.
13. Performance decisions.
14. Security controls.
15. Tests and commands run.
16. Test results.
17. Desktop, tablet, and mobile screenshots.
18. Content still requiring official confirmation.
19. Remaining limitations.

Do not call the work complete until the page has been implemented, migrated, run, visually inspected, tested, and iterated on.
