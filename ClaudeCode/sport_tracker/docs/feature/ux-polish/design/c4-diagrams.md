# C4 Diagrams — ux-polish Design System

**Feature**: ux-polish
**Author**: Morgan (nw-solution-architect)
**Date**: 2026-05-04
**Scope**: These diagrams show where the UX Design System sits within the existing system
architecture. The overall system architecture (L1) and container architecture (L2) are documented
in `docs/product/architecture/brief.md`. This file provides the ux-polish-scoped view.

---

## L1 — System Context

The ux-polish feature introduces no new external systems. The System Context is unchanged from
the react-pwa-ui DESIGN wave. Shown here for completeness with the design system highlighted.

```mermaid
C4Context
  title System Context — Calisthenics Tracker (ux-polish view)

  Person(marco, "Marco", "Intermediate calisthenics practitioner. Primary user. iPhone, outdoor use.")
  Person(luis, "Luis", "Beta friend. Accessibility user — reduced motion enabled.")

  System(pwa, "Calisthenics Tracker PWA", "React 18 PWA. Offline-first. Delivers workout logging, readiness signalling, and progression tracking. Includes UX Design System (ux-polish).")

  System_Ext(supabase, "Supabase Platform", "Auth (Google OAuth + email/password), PostgREST API, Edge Functions (Deno), Postgres DB.")
  System_Ext(claude, "Anthropic Claude API", "LLM for coaching advice. Called server-side only via fn-claude-coach.")
  System_Ext(cloudflare, "Cloudflare Pages", "Static asset CDN. Serves PWA bundle globally.")

  Rel(marco, pwa, "Logs workout sessions, views readiness signal, tracks progression via")
  Rel(luis, pwa, "Uses with reduced motion enabled via")
  Rel(pwa, supabase, "Stores sessions, reads exercises, authenticates users via")
  Rel(pwa, cloudflare, "Served from")
  Rel(supabase, claude, "Calls for AI coaching advice via")
```

---

## L2 — Container Diagram

The ux-polish feature modifies the React PWA container only. No new containers are introduced.
The `Design Token Layer` is highlighted as the new internal structural element.

```mermaid
C4Container
  title Container Diagram — Calisthenics Tracker (ux-polish additions highlighted)

  Person(marco, "Marco")
  Person(luis, "Luis")

  Container(pwa, "React PWA (Vite)", "React 18, TypeScript strict", "Offline-first PWA. All 5 screens. Served from Cloudflare Pages.")

  Container_Boundary(pwa_internal, "React PWA — Internal Structure") {
    Container(tokens, "UX Design System", "CSS custom properties + tokens.ts", "design-tokens.css: color, typography, spacing, motion, radius tokens. System-adaptive dark/light via prefers-color-scheme. Reduced motion via prefers-reduced-motion.")
    Container(pages, "Screen Components", "React, TypeScript", "Auth, Home, Session, Timer, Readiness. Consume design tokens via var(--token). BEM-named CSS files.")
    Container(nav, "Bottom Nav Bar", "HTML nav + CSS", "Fixed position. 3 destinations. env(safe-area-inset-bottom) for iOS safe area. Reads authStore for conditional render.")
    Container(services, "Domain Services", "TypeScript classes", "ReadinessEngine, SyncCoordinator, PlateauDetector. No styling dependencies.")
    Container(adapters, "Port Adapters", "TypeScript", "SupabaseSessionAdapter, IndexedDBSessionAdapter, EdgeFunctionReadinessAdapter. Infrastructure only.")
    Container(stores, "State Stores", "Zustand", "authStore, syncStatusStore. UI-global state. Read by HomeScreen for sync badge, nav bar for auth conditional.")
    Container(sw, "Service Worker", "Workbox / vite-plugin-pwa", "Offline cache, Background Sync. Unchanged by ux-polish.")
  }

  ContainerDb(indexeddb, "IndexedDB", "Browser storage", "Offline write queue for sessions.")

  System_Ext(supabase, "Supabase Platform", "Auth, PostgREST, Edge Functions, Postgres")
  System_Ext(cloudflare, "Cloudflare Pages", "CDN")

  Rel(marco, pwa, "Interacts with via browser / installed PWA")
  Rel(luis, pwa, "Interacts with via browser / installed PWA")
  Rel(pwa, cloudflare, "Loads PWA bundle from")
  Rel(tokens, pages, "Supplies CSS custom properties to")
  Rel(tokens, nav, "Supplies CSS custom properties to")
  Rel(pages, services, "Invokes domain logic via hooks through")
  Rel(pages, stores, "Reads UI state from")
  Rel(nav, stores, "Reads isAuthenticated from")
  Rel(services, adapters, "Calls infrastructure through port interfaces via")
  Rel(adapters, supabase, "Reads and writes data to")
  Rel(adapters, indexeddb, "Queues offline sessions in")
  Rel(sw, indexeddb, "Drains offline queue from")
  Rel(sw, supabase, "Replays queued sessions to")
```

---

## Design Token Layer — Component View (L3)

The Design Token Layer is simple enough to warrant a brief component view. This is not a full
L3 diagram (the layer has fewer than 5 components), but it clarifies the two-file structure.

```mermaid
C4Component
  title Component View — UX Design System Layer

  Container_Boundary(token_layer, "UX Design System") {
    Component(tokens_css, "design-tokens.css", "CSS custom properties", "SSOT for all design tokens. :root (dark defaults), @media prefers-color-scheme light (light overrides), @media prefers-reduced-motion reduce (motion collapse). Imported once in main.tsx.")
    Component(tokens_ts, "tokens.ts", "TypeScript module", "Secondary artifact. Exports TRANSITION_DURATION=150 and ANIMATION_DURATION=220 as typed number constants. Derived from design-tokens.css — not an independent SSOT.")
  }

  Container(main_tsx, "main.tsx", "React entry point", "Imports design-tokens.css before all component imports.")
  Container(screen_css, "Screen CSS files", "Plain CSS + BEM", "HomeScreen.css, SessionScreen.css, etc. Reference var(--token-name). Co-located with screen components.")
  Container(ts_components, "TypeScript components", "React + TypeScript", "Import tokens.ts constants for setTimeout timing coordination only.")

  Rel(main_tsx, tokens_css, "Imports globally")
  Rel(tokens_css, screen_css, "Provides CSS custom properties to via cascade")
  Rel(tokens_ts, ts_components, "Exports timing constants to")
  Rel(tokens_css, tokens_ts, "Is the source of truth for values in")
```

---

## Key Architectural Notes for DISTILL Wave

1. **No new containers**: ux-polish adds no new deployable units, no new Edge Functions, no new
   Supabase tables.

2. **No external integrations**: ux-polish adds no calls to external APIs. No contract tests are
   needed for this feature.

3. **Dependency direction**: `design-tokens.css` is consumed by screen CSS files — it has no
   import dependencies itself. It sits at the outermost presentation layer. Domain services
   (`services/`) and adapters (`repositories/`) have no dependency on the token layer.

4. **Hexagonal boundary preserved**: The ux-polish additions (CSS files, nav bar component)
   all live in the `components/` and `pages/` layers. No modifications to `services/`,
   `repositories/`, or `lib/ports/`. The hexagonal boundary is not touched.

5. **Architectural enforcement**: import-linter rules (already configured) ensure that
   `services/` and `repositories/` cannot accidentally import from `src/styles/`. New rule
   recommended: verify `tokens.ts` is only imported by files in `src/components/` and `src/pages/`.
