# ADR-009: Component Library — shadcn/ui (Radix UI + Tailwind CSS)

**Status**: Accepted
**Date**: 2026-04-21
**Author**: Morgan (nw-solution-architect)
**Feature**: react-pwa-ui
**Supersedes**: —
**Superseded by**: —

---

## Context

The React PWA requires a UI component library to accelerate development of the 8 user stories (UI-01
through UI-08). The selection must satisfy these constraints simultaneously:

- **SC-02**: Log entry completable in under 60 seconds — components must render instantly, no heavy
  bundle overhead.
- **SC-06**: Mobile-first, minimum 44×44px touch targets, large glanceable text — components must
  support dense touch interaction without overriding defaults.
- **Solo developer, free tier only**: no license fees, no SaaS design system subscriptions. OSS only.
- **TypeScript strict mode throughout**: the library must ship type definitions natively.
- **OOP paradigm (CLAUDE.md)**: component composition over render-prop heavy patterns.
- **Walking skeleton priority (WD-01)**: the first working screen set must be shippable without a
  custom design system being fully built out.

The candidate libraries evaluated are:

1. shadcn/ui (Radix UI primitives + Tailwind CSS) — copy-paste, headless
2. Mantine v7 — full-featured opinionated component library
3. Completely custom (no library)

The question is not which library has more components. It is which approach delivers the walking
skeleton fastest for a solo developer while remaining maintainable as component count grows to ~15 screens.

---

## Decision

Use **shadcn/ui** as the component foundation, implemented as:
- **Radix UI primitives** (MIT license, github.com/radix-ui/primitives, 15K+ stars) as the accessible
  headless base for interactive components (Dialog, Select, Tooltip, Switch, Popover).
- **Tailwind CSS v3** (MIT license, github.com/tailwindlabs/tailwindcss, 83K+ stars) for utility-first
  styling with a design token layer via `tailwind.config.ts`.
- **shadcn/ui components** (MIT license, github.com/shadcn-ui/ui, 80K+ stars) as the starting point
  for Button, Input, Card, Badge, Table — copied into `src/components/ui/` and owned by the codebase.

The shadcn/ui approach means components are **not a dependency** — they are copied source code. This
gives the solo developer full control, zero bundle overhead from unused components, and zero upstream
breaking-change risk after initial copy.

Design token conventions enforced in `tailwind.config.ts`:
- `touch-target-min: 44px` enforced via custom Tailwind variant (`touch:min-h-[44px] touch:min-w-[44px]`)
- Color primitives: zinc (neutral), green (READY signal), amber (NOT_YET), red (REVIEW/error)
- Font scale: `text-2xl` base for workout logging inputs (glanceable mid-workout, SC-06)
- `font-feature-settings: 'tnum'` on all numeric inputs (tabular numbers for reps/sets alignment)

---

## Alternatives Considered

### Alternative 1: Mantine v7

**Mantine** (MIT license, github.com/mantinedev/mantine, 26K+ stars) is a full-featured opinionated
React component library with 100+ components, theming, form validation helpers, and date pickers.

**Evaluation**:

Pros: zero setup overhead — install, import, use. Form components (NumberInput, Select, Textarea)
solve the session log form out of the box. Built-in theming API supports mobile-first customization.

Cons: bundle size is the primary concern. Mantine v7 core is ~80 KB gzipped; importing multiple
packages (mantine/core, mantine/form, mantine/hooks) adds 100–150 KB to the initial load. For a PWA
targeting mid-workout mobile use, the first paint budget is critical. Mantine's opinionated styling
layer conflicts with Tailwind CSS (cannot be mixed easily) — one or the other must be chosen. The
solo developer would be adopting Mantine's CSS variable theming system rather than owning the design
tokens directly. This creates lock-in: if Mantine's defaults diverge from the product's needs (e.g.,
touch target sizes, font scale), overriding requires understanding Mantine's internal token API.

**Rejection rationale**: Bundle overhead (100–150 KB) and CSS-in-JS vs Tailwind conflict. Mantine
solves more than is needed (date pickers, charts, modals) for a focused PWA with ~10 component types.
The shadcn/ui approach ships less JavaScript for the same visual quality.

---

### Alternative 2: Completely Custom (No Library)

Build all components from scratch using HTML + CSS Modules or Tailwind without a headless primitive layer.

**Evaluation**:

Pros: zero overhead, full control, no abstraction layer.

Cons: accessibility is expensive to implement correctly from scratch. Radix UI primitives handle
focus management, ARIA roles, keyboard navigation, and screen-reader announcements for interactive
components (Dialog, Select, Tooltip) — this is 2–3 days of implementation per component if done
correctly without a primitive layer. For a solo developer targeting a walking skeleton in Slice 1,
this is unjustifiable time cost. The exercise autocomplete (ExerciseSearch) alone requires a
combobox implementation with keyboard navigation and ARIA `combobox` role — Radix provides this via
`Combobox` primitive.

**Rejection rationale**: Accessibility overhead for interactive components makes fully custom
unjustifiable for a solo developer. The "custom" approach still ends up re-implementing what Radix
provides. Using Radix via shadcn/ui is equivalent to custom with accessibility already solved.

---

## Consequences

**Positive**:
- Zero runtime dependency on a component library — all component code lives in `src/components/ui/`
  and is owned by the project. No breaking changes from upstream library releases after initial scaffold.
- Radix primitives provide correct ARIA semantics and keyboard navigation for free — the developer
  does not implement focus traps, escape-to-close, or screen-reader announcements.
- Tailwind v3 generates only the CSS classes actually used (PurgeCSS is built in) — no unused styles
  in the production bundle. Expected CSS output: <20 KB gzipped for the full PWA.
- `tailwind.config.ts` design token layer is the single source of truth for colors, spacing, and
  type scale — all components reference tokens, not raw values. Changing the primary color is a
  one-line change in the config.
- shadcn/ui has excellent documentation and TypeScript types for all components.

**Negative**:
- Initial scaffold (shadcn/ui CLI, Tailwind setup, Radix peer dependencies) takes ~1 hour versus
  `npm install @mantine/core` (~10 minutes). Accepted: one-time cost.
- Components copied into the codebase must be manually updated if shadcn/ui upstream improves them.
  Accepted: at v1 scale, the component set is small (~10 components) and changes are infrequent.
- Tailwind CSS utility classes in JSX can make components visually noisy. Mitigated by: extracting
  Tailwind class strings into `cn()` helper constants in the component file, not inline in JSX.

**Neutral**:
- Tailwind CSS has occasional criticism for making markup "ugly." This is a team preference concern
  not applicable to a solo developer project.

---

## License Summary

| Package | License | GitHub Stars |
|---------|---------|--------------|
| radix-ui/primitives | MIT | 15K+ |
| tailwindcss | MIT | 83K+ |
| shadcn/ui | MIT | 80K+ |
| class-variance-authority | MIT | 5K+ |
| clsx | MIT | 8K+ |

All dependencies are MIT licensed. No proprietary tooling. No SaaS subscription required.
