# ADR-008: Unit Tests Only for v1, Strict TDD

**Status**: Accepted
**Date**: 2026-04-13
**Author**: Morgan (nw-solution-architect)
**Supersedes**: —
**Superseded by**: —

---

## Context

The testing strategy must be defined before implementation begins (strict TDD requires a test strategy to be established upfront). The relevant constraints:

- **Team size**: 1 developer (solo).
- **Timeline**: v1 launch target with MVP feature set.
- **Architectural structure**: ports-and-adapters (hexagonal) — services are isolated from infrastructure via injected interfaces.
- **Priority business logic**: ReadinessEngine (progression rules), SyncCoordinator (offline sync), PlateauDetector (stagnation detection).
- **Infrastructure**: Supabase (managed), IndexedDB (browser), React (UI framework).

**Key architectural observation**: The ports-and-adapters pattern was chosen partly because it enables isolated unit testing. Services receive port interfaces via constructor injection. In tests, adapters are replaced with in-memory fakes. This means core business logic can be fully verified without running a Supabase instance, a browser, or a React tree.

**Quality attributes driving this decision**: testability, time-to-market, maintainability.

---

## Decision

**v1 testing scope**: Unit tests only, using **Vitest** (MIT license, GitHub: vitest-dev/vitest, 15K+ stars, Vite-native).

**TDD discipline**: Strict. Test first. Red before Green. No production code without a failing test. Refactor only after Green.

**Priority order**: Pure business logic first.
1. `ReadinessEngine` — most complex rules, highest business risk.
2. `SyncCoordinator` — coordination logic, edge cases in offline queue drain and reconnect.
3. `PlateauDetector` — pure computation, fully isolatable.
4. Port compliance tests — each adapter verified against the port contract using in-memory fakes (not integration tests).

**v1 exclusions** (deferred to v2):
- Integration tests against real Supabase instance.
- React component rendering tests (React Testing Library).
- E2E tests (Playwright or Cypress).

---

## Alternatives Considered

### Alternative 1: Integration Tests Alongside Unit Tests

Add integration tests that hit the Supabase local emulator (`supabase start` Docker environment) alongside unit tests.

**Evaluation**:

Pros: would catch adapter-to-database contract bugs that unit tests miss. Higher confidence in the session write → PostgREST → Postgres path.

Cons: requires Docker Desktop running locally (not always available on all developer machines), adds CI infrastructure complexity (Supabase service containers in GitHub Actions), and adds test setup/teardown overhead for each test run. For a solo developer, the time cost of maintaining a local Supabase emulator exceeds the bug-detection benefit in v1 — the primary bug surface in v1 is the business logic (ReadinessEngine rules), not the adapter wiring. Adapter integration can be verified manually during development via Supabase dashboard and Postman, with integration tests added when the adapter surface grows in v2.

**Rejection rationale**: The time-to-market constraint for a solo developer makes the Docker + Supabase emulator integration test setup unjustifiable for v1. The primary bug risk is in business logic, which unit tests cover fully. Integration tests are explicitly planned for v2.

### Alternative 2: E2E Tests with Playwright

Write Playwright E2E tests covering the full user flow (login → log session → view readiness signal).

**Evaluation**:

Pros: highest confidence tests — verify the entire system works together. Catch integration bugs that unit tests miss.

Cons: E2E tests are the slowest, most brittle, and most expensive to maintain test type. They require a running Supabase instance, a deployed or locally running PWA, and browser automation. For a solo developer building v1, E2E tests slow down the TDD cycle (E2E tests take seconds per test, not milliseconds), require external infrastructure to be running, and are fragile against UI changes. The business risk in v1 is in the progression rules engine and offline sync logic — both are best tested with fast, isolated unit tests.

**Rejection rationale**: E2E tests are the wrong tool for the highest-risk code in v1. They are expensive to write and maintain. Deferred to v2 when the system is stable enough to have a fixed E2E surface.

### Alternative 3: React Testing Library Component Tests

Add component-level tests using React Testing Library (RTL) for UI components.

**Evaluation**:

Pros: tests the React component layer in isolation (without E2E infrastructure). Catches component rendering bugs and hook integration issues.

Cons: component tests in RTL require mocking TanStack Query, Zustand stores, and Router context — substantial test setup per component. For v1, the UI is thin (the value is in the business logic, not the component rendering). The ports-and-adapters structure means hooks are thin bridges to services; services are the logic, and services are already covered by unit tests.

**Rejection rationale**: For v1, the component layer adds setup overhead without catching the high-value bugs (which live in services). Added to v2 backlog after the service layer is stable and component tree grows beyond ~10 components.

---

## Consequences

**Positive**:
- TDD with unit tests produces fast feedback loops (milliseconds per test). The developer can run the full test suite on every file save.
- Vitest is Vite-native — same config, no separate Babel/Jest transform setup, no `jest.config.js` vs `vite.config.ts` conflict.
- Services are 100% unit-testable because they receive port interfaces via constructor injection (in-memory fakes, no real Supabase required).
- Strict TDD discipline produces better-designed interfaces — tests are the first client of every service, which forces clear method contracts.
- 80% line coverage threshold on `services/` enforced by Vitest `--coverage` at CI time.

**Negative**:
- Adapter-to-infrastructure bugs (e.g., wrong Supabase column name, unexpected RLS policy behavior) are not caught by unit tests. Accepted trade-off — these will surface in manual testing during development and will be caught by integration tests in v2.
- React component rendering bugs are not caught. Accepted — UI is thin in v1 and manually verifiable.
- No automated regression net for the full E2E user flow in v1. The offline sync path (IndexedDB → reconnect → PostgREST → readiness signal) is partially verified by SyncCoordinator unit tests (with in-memory fakes) but not end-to-end. Accepted trade-off for v1 timeline.

**Neutral**:
- Vitest is chosen over Jest because it shares the Vite config — not because Jest is inferior. If the project were not using Vite, Jest would be a valid choice. This is a toolchain-alignment decision, not a capability decision.
- The strict TDD discipline applies to `services/` layer. Components and hooks in v1 use a test-when-complex heuristic — tests are written when the logic warrants it, not mandated by the ADR.
