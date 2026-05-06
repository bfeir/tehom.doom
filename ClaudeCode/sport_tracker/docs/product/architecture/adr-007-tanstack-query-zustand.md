# ADR-007: TanStack Query + Zustand for State Management

**Status**: Accepted
**Date**: 2026-04-13
**Author**: Morgan (nw-solution-architect)
**Supersedes**: —
**Superseded by**: —

---

## Context

The React PWA requires a state management strategy for three distinct concerns:

1. **Server state**: sessions, exercises, progression data — fetched from Supabase PostgREST, stale-able, cacheable, needs background refresh, needs invalidation after mutations.
2. **Global UI state**: authentication state (`user`, `session`, `isAuthenticated`) and sync status (`pendingCount`, `syncStatus`, `lastSyncedAt`) — must be readable outside the React tree (SyncCoordinator runs outside React).
3. **Local form state**: in-progress session form values and validation errors — scoped to a single component subtree.

These are three structurally different problems. Server state has a rich lifecycle (loading, error, stale, refetching). Global UI state is small, synchronous, and needs to be writable from non-React code. Local form state is ephemeral and component-scoped.

**Quality attributes driving this decision**: maintainability, testability, developer experience, time-to-market.

**Constraints**: solo developer, free tier only (no paid state management tooling), simplicity over sophistication.

---

## Decision

Use **TanStack Query (React Query) v5** for server state and **Zustand v4** for global UI state. Use React `useState` for local form state.

- TanStack Query: MIT license. GitHub: TanStack/query. 44K+ stars. Active maintenance, LTS releases.
- Zustand: MIT license. GitHub: pmndrs/zustand. 47K+ stars. Active maintenance.

---

## Alternatives Considered

### Alternative 1: Redux Toolkit (RTK) + RTK Query

RTK is the official Redux recommendation. RTK Query handles server state (similar to TanStack Query). Redux DevTools are excellent.

**Evaluation**:

Pros: industry standard, excellent DevTools, large community, RTK Query covers server-state concerns.

Cons: Redux concepts (actions, reducers, slices, dispatch) add substantial boilerplate and learning overhead for a solo developer on a small PWA. RTK Query is capable but requires wiring reducers and middleware in ways that TanStack Query avoids entirely. The Redux mental model (single global store for all state) creates pressure to put server state, UI state, and form state in the same place — a well-known source of complexity and over-fetching bugs. For a solo developer on a ~15-screen PWA, the Redux overhead-to-value ratio is poor.

**Rejection rationale**: Over-engineered for team size (1 developer) and application size (~15 screens). RTK Query and TanStack Query solve the same server-state problem; TanStack Query is simpler to set up and more ergonomic for this use case. Redux store as the single source of truth conflicts with the architectural separation of server state, UI state, and form state.

### Alternative 2: SWR (Stale-While-Revalidate, by Vercel)

SWR is a lightweight data-fetching library, MIT license, ~30K stars. Used by many Next.js projects.

**Evaluation**:

Pros: very simple API, small bundle size, good stale-while-revalidate semantics out of the box.

Cons: SWR is designed primarily for read (GET) operations. Mutation support (`useSWRMutation`) is less ergonomic than TanStack Query's `useMutation` with automatic cache invalidation. SWR does not have TanStack Query's `queryClient.invalidateQueries()` pattern for post-save cache invalidation — a critical need after session write and after offline sync drain. SWR has no built-in solution for global UI state (would still require Zustand or Context), so the two-library combination is still needed.

**Rejection rationale**: TanStack Query has superior mutation + cache invalidation ergonomics, which matters for the session write → readiness fetch → cache update flow. SWR is not a significant simplification — it still requires a companion global-state solution.

### Alternative 3: Jotai for global state (instead of Zustand)

Jotai is an atomic state management library, MIT license, ~20K stars. Works well with React concurrent mode.

**Evaluation**:

Pros: atomic model is intuitive, React-idiomatic, no store setup overhead.

Cons: Jotai atoms are inherently React-coupled — atoms are read/written via hooks, which requires a React context. **SyncCoordinator must write sync status from outside the React tree** (it runs as a boot-time singleton, not inside React). Jotai's atom write outside a React component requires `getDefaultStore()` or a store reference — an anti-pattern in Jotai's model that the library documentation discourages. Zustand stores are plain objects with `getState()` and `setState()` callable from anywhere (inside or outside React) — this is by design and is the reason Zustand is chosen over Jotai here.

**Rejection rationale**: The SyncCoordinator architectural requirement (writes sync status from outside React) makes Jotai a poor fit. Zustand explicitly supports this use case.

### Alternative 4: React Context + useReducer for global state

React Context + `useReducer` is a zero-dependency alternative to Zustand for small global state.

**Evaluation**:

Pros: no additional dependency, idiomatic React.

Cons: React Context does not support writes from outside the React tree. SyncCoordinator runs outside React and must update `syncStatusStore` — Context cannot satisfy this requirement. Additionally, Context re-renders all consumers on any state change (no selector support), which creates unnecessary re-renders for large consumer trees. For a PWA with potentially many components consuming sync status, this is a real performance concern.

**Rejection rationale**: Same blocking constraint as Jotai — cannot be written from outside React. The architecture decision (SyncCoordinator as a boot-time singleton outside React) is a hard requirement (DECISION AA5). React Context cannot satisfy it.

---

## Consequences

**Positive**:
- Server state (sessions, exercises) has automatic stale-while-revalidate, background refetch, and cache invalidation after mutations. This eliminates manual loading/error state management in components.
- `syncStatusStore` is writable from SyncCoordinator outside the React tree — satisfies the architectural constraint that SyncCoordinator is a boot-time singleton decoupled from React.
- Two small, focused libraries instead of one large opinionated framework. Each can be learned independently.
- Both libraries are MIT licensed, free tier compatible, and actively maintained.
- TanStack Query's `queryClient` is injectable in tests — server state interactions are fully testable without React rendering.

**Negative**:
- Two libraries for state (rather than one) requires understanding which state type belongs where. Mitigated by the state management layer table in the Application Architecture section — the categorization is explicit and enforced by import-linter rules.
- TanStack Query v5 has a different API surface from v4 (breaking change in query function signature). Developer must use v5 docs; v4 examples on Stack Overflow may mislead. Mitigated by documenting the v5 version pin in `package.json`.

**Neutral**:
- React `useState` for form state is not a compromise — it is the correct tool. Promoting form state to a global store would be an antipattern.
- Redux DevTools are foregone. Zustand has a DevTools middleware (`zustand/middleware/devtools`) that provides Redux DevTools integration — available if needed.
