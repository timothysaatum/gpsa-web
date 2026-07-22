# GPSA-UDS About Overview Redesign — Implementation Prompt

## Role

Act as a senior product designer and frontend engineer working on the GPSA-UDS website.

Your task is to redesign and implement the existing **About page** as the new **About Overview page**, using the attached visual wireframe/mockup as the primary visual reference.

The result must feel polished, institutional, credible, modern, responsive, accessible, and consistent with the existing GPSA-UDS brand.

---

## Primary Objective

Redesign the existing route:

```text
/about
```

into a high-quality **About Overview** page that:

- preserves the strongest parts of the current About page;
- incorporates the newly requested institutional content;
- improves information hierarchy and navigation;
- avoids unnecessary animation and visual complexity;
- remains fast on mobile devices and low-bandwidth connections;
- works correctly across desktop, tablet, and mobile;
- does not break existing routes, shared components, authentication, data fetching, or site navigation.

Use the attached design image as a **layout and visual direction reference**, not as a pixel-perfect screenshot to copy blindly.

---

## Source of Truth

Use these inputs in this order:

1. The attached visual wireframe/mockup.
2. The existing `/about` page implementation.
3. The current GPSA-UDS design system, brand colors, typography, spacing, components, and assets.
4. Existing backend or CMS data.
5. The requirements in this document.

Do not invent official facts, dates, names, statistics, partners, affiliations, or office-holder information.

When verified data is unavailable:

- reuse existing verified data;
- create clearly named data placeholders in code;
- add a developer comment explaining what must be supplied;
- never present fabricated values as real institutional information.

---

## First Step: Investigate Before Editing

Before changing code:

1. Locate the existing `/about` route and all components it uses.
2. Identify the framework, routing strategy, styling solution, component library, image system, and data sources.
3. Inspect the global navigation, footer, shared layout, typography, colors, breakpoints, and spacing tokens.
4. Determine which About-page content is hard-coded and which is loaded from an API, database, CMS, or configuration.
5. Identify reusable components already available in the project.
6. Run the project and capture the current desktop and mobile page states.
7. Record any existing console errors, hydration errors, missing images, broken links, or layout issues before making changes.

Do not begin with a full rewrite unless the current implementation is genuinely unsuitable. Prefer incremental, maintainable refactoring.

---

# Page Structure

Implement the sections in this order.

## 1. Hero

Retain the spirit of the current hero but improve the content hierarchy.

### Content

**Eyebrow**

```text
ABOUT GPSA-UDS
```

**Headline**

```text
Students first. Pharmacy forward.
```

**Introduction**

Use two concise paragraphs that clearly explain:

- what GPSA-UDS is;
- who it represents;
- why it exists;
- its academic, welfare, professional, advocacy, leadership, and community role.

Use verified institutional wording where available.

### Actions

Primary button:

```text
Join GPSA-UDS
```

Secondary button:

```text
Explore Our Work
```

### Visual composition

Desktop:

- text content on the left;
- optimized photo collage on the right;
- one compact overlay card communicating:

```text
Advocacy, care and excellence
```

Mobile:

- text first;
- buttons stacked or wrapped cleanly;
- collage below;
- overlay must remain readable without covering important faces;
- no horizontal scrolling.

### Requirements

- Reuse verified existing images where possible.
- Use responsive image delivery.
- Preserve image aspect ratios.
- Add meaningful alt text.
- Avoid loading all large source images at full resolution.

---

## 2. Annual Impact Bar

Place a compact dark-green impact section directly below the hero.

Include a visible reporting-period label such as:

```text
2025/2026 Impact
```

Only use verified figures.

Preferred metrics:

- Students represented
- Academic programmes organised
- Welfare interventions
- Outreach beneficiaries
- Opportunities shared
- Active partnerships

### Responsive layout

- Desktop: six columns.
- Tablet: three columns per row.
- Mobile: two columns per row.
- Ensure separators do not create awkward partial borders.
- Keep labels readable at 320 px width.

Do not animate counters on initial load unless the project already has an efficient and accessible counter component. Static values are preferred for performance and clarity.

---

## 3. Who We Are

Expand the current identity section.

### Content must explain

- the official identity of GPSA-UDS;
- the students it represents;
- its relationship with the University for Development Studies;
- its relationship with the relevant faculty, school, or department;
- its relationship with National GPSA or other verified professional bodies;
- the constitutional purpose of the association.

### Suggested layout

Desktop:

- a large text card on the left;
- a compact institutional relationship diagram at the bottom or side.

Possible diagram:

```text
University for Development Studies
→ School/Faculty/Department
→ GPSA-UDS
→ Pharmacy Students
```

Use the official current name of the academic unit. Do not guess.

Mobile:

- stack the content;
- convert the relationship diagram into vertically arranged steps;
- keep text line length comfortable.

---

## 4. President’s Welcome

Add a human, current leadership section.

### Include

- president’s verified photograph;
- full name;
- position;
- administration year;
- short welcome message of approximately 120–150 words;
- CTA:

```text
Meet the Executive Team
```

### Layout

Desktop:

- photograph and identity block on the left;
- welcome message on the right.

Mobile:

- photograph first;
- identity details;
- message;
- CTA.

If verified content is not available, create the component and data interface without inventing a person or message.

---

## 5. Mission, Vision, and Core Values

Group these under one clear section heading.

### Mission and Vision

Use two visually distinct cards:

- Mission: dark green treatment.
- Vision: gold, cream, or a light brand treatment with accessible contrast.

### Core Values

Use these requested values, subject to final institutional approval:

- Professionalism
- Leadership
- Excellence
- Integrity
- Service
- Unity
- Innovation

Each value must include:

- a lightweight icon;
- the value name;
- one short explanatory sentence.

Do not show values as unexplained badges only.

### Responsive behavior

- Mission and Vision: two columns on desktop, stacked on mobile.
- Values: compact grid that becomes one or two columns on smaller screens.
- Avoid oversized cards that cause excessive scrolling.

---

## 6. What We Do

Replace the current generic service cards with five clear categories.

### Academic Development

- Tutorials
- Academic seminars
- Study resources
- Academic advocacy

### Student Welfare

- Welfare support
- Confidential assistance
- Advocacy
- Student representation

### Professional Development

- Conferences
- Workshops
- Career programmes
- Industry exposure

### Community Engagement

- Health screening
- Public-health campaigns
- Outreach
- Health education

### Social and Student Life

- Orientation
- Games and sports
- Dinners
- Entertainment and social events

### Interaction

Each category card may include a subtle:

```text
Learn more →
```

Only link it when an appropriate existing route exists.

Do not create dead links.

### Responsive layout

- Desktop: three cards in the first row and two in the second row, visually balanced.
- Tablet: two columns.
- Mobile: one column.

Cards must have consistent height where practical, without forcing excessive empty space.

---

## 7. Governance at a Glance

Add a compact institutional governance section.

Include:

### General Assembly

The principal deliberative body through which members consider major association matters.

### Executive Board

Responsible for day-to-day leadership, administration, and programme implementation.

### Standing Committees

Support specialised areas such as academics, welfare, events, communications, and professional development.

### Judicial Board

Interprets governing rules and handles constitutional or disciplinary matters within its mandate.

### Electoral Commission

Independently manages elections and protects the integrity of the electoral process.

CTA:

```text
Explore Leadership & Governance
```

Only activate the CTA if the destination route exists.

### UX direction

- Prefer a clean list or compact card layout.
- Do not use a heavy organisational chart on the Overview page.
- Keep detailed governance content for the dedicated page.

---

## 8. Strategic Priorities

Add a section for the current administration’s focus areas.

Possible categories:

- Academic Excellence
- Responsive Welfare
- Professional Exposure
- Transparent Leadership
- Community Impact
- Digital Transformation

These must be treated as configurable data.

Each priority should contain:

- title;
- concise explanation;
- optional status label only when real progress data exists.

Do not invent percentages or progress bars.

---

## 9. Community Moments

Retain and improve the current gallery preview.

### Include

- four to six optimized images;
- meaningful captions;
- a visible CTA:

```text
View Photo Archive
```

### Performance requirements

- Load only the first visible images eagerly when necessary.
- Lazy-load below-the-fold images.
- Use responsive image sizes.
- Prevent cumulative layout shift with explicit dimensions or aspect ratios.
- Do not ship original multi-megabyte images directly to the browser.

### Responsive behavior

- Desktop: editorial collage or compact horizontal grid.
- Tablet: two-column grid.
- Mobile: single-column cards or a lightweight horizontal snap carousel.
- Do not add a heavy third-party carousel library solely for this section.

---

## 10. History and Legacy Preview

Convert the current full timeline into a concise preview.

### Include

- short “Our Story” introduction;
- three verified milestones;
- one historical or association image;
- CTA:

```text
Explore Our History & Legacy
```

The full timeline belongs on the dedicated History page.

### Data integrity

The existing site may contain conflicting establishment dates.

Verify all dates before publishing.

Do not display both an unverified foundation year and a different “EST.” year.

---

## 11. Partners and Affiliations

Add a restrained logo section.

Possible partners may include only verified organisations such as:

- University for Development Studies;
- the relevant pharmacy faculty, school, or department;
- National GPSA;
- professional bodies;
- healthcare institutions;
- NGOs;
- pharmaceutical organisations;
- sponsors.

### Requirements

- Use official partner names and approved logos.
- Add accessible text labels.
- Keep logo images optimized.
- Use monochrome or contained treatments only when brand guidelines permit.
- Do not create fake partner logos.
- Do not imply a partnership without confirmation.

CTA may be:

```text
View All Partners
```

Only show it if a destination exists.

---

## 12. Final Call to Action

Retain the existing:

```text
Your voice belongs here.
```

Supporting message should encourage students to:

- join GPSA-UDS;
- participate in programmes;
- access resources;
- request welfare support;
- contact the association.

Buttons:

- Join GPSA-UDS
- Welfare Support
- Contact Us

Use existing real routes.

---

## 13. Newsletter and Footer

Preserve the existing newsletter and footer unless they contain known problems.

Ensure:

- correct contact information;
- no placeholder phone numbers;
- no fake email addresses;
- no conflicting establishment dates;
- accessible form labels;
- clear subscription states;
- no layout overflow on mobile.

---

# Content to Remove or Reduce

Remove the full blocks for:

- Featured news
- Upcoming events
- Open opportunities

These belong on the homepage or their dedicated pages.

A compact “Latest from GPSA-UDS” strip may remain only if it uses existing live data and does not dominate the About Overview page.

---

# Navigation Requirements

The main About navigation is expected to become a dropdown containing institutional pages.

For this task:

- ensure `/about` remains the Overview route;
- label the dropdown item as `Overview`;
- do not break the existing main navigation;
- do not implement unrelated About subpages unless they already exist;
- make the desktop dropdown keyboard accessible;
- make the mobile About section an accordion or nested menu;
- do not rely on hover alone;
- close menus on route change, Escape, outside click, and selection.

---

# Design Direction

Follow the attached wireframe’s overall direction:

- clean white background;
- deep institutional green;
- restrained gold accents;
- serif display headings where already used;
- readable sans-serif body text;
- generous but controlled spacing;
- soft borders;
- moderate corner radius;
- subtle shadows;
- strong content hierarchy;
- credible institutional tone.

Do not overdecorate the page.

Avoid:

- excessive gradients;
- glassmorphism;
- autoplay media;
- heavy animation;
- parallax;
- large video backgrounds;
- unnecessary icon libraries;
- multiple competing card styles;
- very long line lengths;
- tiny gray text;
- excessive rounded containers;
- huge whitespace on mobile.

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

The page must:

- have no horizontal overflow;
- preserve readable heading sizes;
- avoid text clipping;
- keep touch targets at least 44 × 44 px where practical;
- stack content logically;
- maintain consistent section spacing;
- prevent images from overflowing rounded containers;
- preserve CTA visibility;
- avoid fixed heights for text-heavy cards;
- support zoom to 200%.

Use fluid sizing with `clamp()` or the project’s responsive type scale where appropriate.

---

# Accessibility Requirements

Meet WCAG 2.1 AA as closely as practical.

Required:

- semantic landmarks;
- one primary `h1`;
- logical heading order;
- visible focus states;
- keyboard-operable menus and controls;
- sufficient contrast;
- descriptive alt text;
- labels for all form fields;
- accessible button and link names;
- no critical information communicated through color alone;
- reduced-motion support;
- correct `aria-expanded`, `aria-controls`, and menu semantics where applicable.

Do not use clickable `div` elements when a button or link is appropriate.

---

# Performance Requirements

The redesign must not materially degrade site performance.

Implement the following:

- reuse current dependencies where possible;
- do not add a large UI or animation dependency for this page;
- use framework-native image optimization;
- use responsive image sizes;
- lazy-load below-the-fold media;
- preload only truly critical assets;
- avoid large client-side data bundles;
- keep static content server-rendered where the framework supports it;
- minimise client components;
- avoid unnecessary state;
- avoid layout shifts;
- use CSS for simple visual effects;
- tree-shake icons or import icons individually;
- avoid duplicated image assets;
- remove unused code from the old About page.

Target outcomes:

- no new console errors;
- no hydration warnings;
- no broken image requests;
- no avoidable render-blocking assets;
- strong Core Web Vitals;
- Lighthouse mobile performance should not regress meaningfully from the current page.

If the existing page is already slow, identify and fix the most relevant About-page causes.

---

# Data and Component Architecture

Prefer a data-driven structure.

Suggested content objects:

```ts
type ImpactMetric = {
  value: string;
  label: string;
  icon?: React.ComponentType;
};

type CoreValue = {
  title: string;
  description: string;
  icon?: React.ComponentType;
};

type ServiceArea = {
  title: string;
  description?: string;
  items: string[];
  href?: string;
  icon?: React.ComponentType;
};

type GovernanceBody = {
  title: string;
  description: string;
  href?: string;
};

type StrategicPriority = {
  title: string;
  description: string;
  status?: string;
};

type Milestone = {
  year: string;
  title: string;
  description: string;
};

type Partner = {
  name: string;
  logoSrc: string;
  href?: string;
};
```

Use the project’s existing types and patterns where they already exist.

Do not create one giant page component containing all content and markup.

Extract reusable sections only when doing so improves readability, testing, or reuse.

Avoid premature abstraction.

---

# SEO and Metadata

Preserve or improve:

- page title;
- meta description;
- Open Graph metadata;
- canonical URL;
- structured heading hierarchy;
- crawlable text;
- meaningful link labels.

Suggested metadata direction:

```text
Title: About GPSA-UDS
Description: Learn about GPSA-UDS, its mission, leadership, student services, governance, impact, and role in representing pharmacy students at the University for Development Studies.
```

Use the project’s metadata conventions.

---

# Testing Requirements

After implementation, perform all of the following.

## Functional testing

Verify:

- `/about` loads directly;
- all CTA links work;
- dropdown or mobile navigation behavior works;
- no dead links were introduced;
- all images load;
- newsletter remains functional;
- shared header and footer still work;
- route transitions do not leave menus open;
- no authentication flow is affected.

## Responsive testing

Test every required viewport.

Check:

- hero composition;
- stat wrapping;
- card stacking;
- image cropping;
- text overflow;
- CTA wrapping;
- footer columns;
- mobile navigation;
- landscape tablet layouts.

## Accessibility testing

Check:

- keyboard navigation;
- focus order;
- focus visibility;
- heading structure;
- screen-reader names;
- color contrast;
- reduced-motion behavior;
- form labels.

## Technical testing

Run the project’s available checks:

```text
typecheck
lint
unit tests
component tests
build
```

Run any existing end-to-end or Playwright tests relevant to public navigation and the About route.

Add focused tests when the project already has a testing framework.

## Browser testing

At minimum verify:

- Chrome/Chromium
- Firefox
- mobile Chrome emulation

Use Safari testing when the environment supports it.

---

# Acceptance Criteria

The task is complete only when:

- `/about` has been transformed into the About Overview page;
- the attached wireframe’s visual direction is recognisable;
- the page remains consistent with the rest of the live site;
- content hierarchy is improved;
- the requested institutional sections are incorporated;
- no fake institutional data has been introduced;
- mobile usability is strong;
- no horizontal overflow exists;
- accessibility fundamentals are implemented;
- performance does not meaningfully regress;
- there are no console, build, type, lint, or hydration errors;
- all visible CTAs lead to real destinations;
- old redundant About-page sections and unused code are removed;
- all checks pass.

---

# Final Delivery Report

When finished, provide:

1. A concise summary of the redesign.
2. A list of files changed.
3. Sections/components added or removed.
4. Data still requiring official confirmation.
5. Accessibility improvements made.
6. Performance decisions made.
7. Tests and commands run.
8. Test results.
9. Screenshots at desktop, tablet, and mobile widths.
10. Any remaining limitations.

Do not call the work complete until the page has been run, visually inspected, tested, and iterated on.
