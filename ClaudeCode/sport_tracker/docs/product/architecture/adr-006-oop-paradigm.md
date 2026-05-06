# ADR-006: OOP Paradigm Over Functional Programming

**Status**: Accepted
**Date**: 2026-04-13
**Author**: Morgan (nw-solution-architect)
**Supersedes**: —
**Superseded by**: —

---

## Context

The application architecture requires a programming paradigm decision for the React PWA frontend and its service layer. This decision determines the default style for services, domain logic, and how software-crafter approaches implementation.

The domain model (produced by Hera, nw-ddd-architect) is aggregate-centric: `Session`, `UserProgression`, and `ProgressionEvent` are well-defined aggregates with object identity, command/query semantics, and invariant enforcement on the aggregate root. The system has explicit state transitions (offline → syncing → synced), mutable progression state per user per track, and class-based dependency injection requirements (services receive port interfaces via constructor).

The developer is a solo practitioner. The team size is one.

**Quality attributes driving this decision**: maintainability, testability, time-to-market.

---

## Decision

Use **object-oriented programming (OOP)** as the paradigm for this project. Services are classes. Ports are TypeScript interfaces. Adapters are classes implementing interfaces. Constructor injection is the DI mechanism.

---

## Alternatives Considered

### Alternative 1: Functional Programming (FP)

Domains expressed as algebraic data types. Effect systems (fp-ts or Effect-TS) for I/O boundaries. Composition over inheritance. Function-signature ports; pure functions with explicit effect boundaries.

**Evaluation**:

Pros: strong compile-time guarantees, explicit effect tracking, no hidden state mutations.

Cons: requires re-expressing the aggregate model (Session, UserProgression) as discriminated unions and tagged types — a non-trivial translation that adds cognitive overhead without corresponding domain benefit. Effect-TS or fp-ts have steep learning curves that are unjustified for a solo developer under time-to-market pressure. The domain model as designed by Hera uses object identity and aggregate invariants — concepts that map naturally to classes, not to algebraic data types. FP's primary advantage (eliminating hidden state) is already addressed by ports-and-adapters: all I/O is behind interfaces, injected in tests as in-memory fakes.

**Rejection rationale**: The learning curve cost exceeds the benefit for this team size and domain model. FP is not wrong — it is not the right trade-off here.

### Alternative 2: Mixed Paradigm (OOP for aggregates, FP for utilities)

Use classes for aggregates and services; use pure functions for utility logic (PlateauDetector, ReadinessSignal computation).

**Evaluation**:

This is a valid approach and partially describes how OOP code already works in practice — pure computation methods on services behave like pure functions. However, declaring a "mixed paradigm" policy creates ambiguity for software-crafter: which layer uses which style? When does a utility become a class? The overhead of maintaining the policy distinction adds cognitive load without structural benefit.

**Rejection rationale**: The OOP decision does not prohibit pure functions inside class methods. It simply establishes a consistent default. Software-crafter uses pure static methods or standalone functions wherever appropriate — the paradigm choice is about the default organizing principle, not a prohibition on functions.

---

## Consequences

**Positive**:
- Domain model aggregates (Session, UserProgression, ProgressionEvent) map directly to classes without translation overhead.
- Constructor injection (services receive ports as constructor arguments) is idiomatic OOP and directly supports strict TDD: tests instantiate services with in-memory fake adapters.
- `@nw-software-crafter` persona is designated for OOP; no paradigm mismatch between architect intent and crafter implementation.
- Consistent style across the codebase; no context switching between FP and OOP layers.

**Negative**:
- Class-based code can accrue hidden state and mutable coupling if discipline erodes. Mitigated by import-linter boundary enforcement and the ports-and-adapters structure: services only hold injected ports, not mutable infrastructure state.
- FP's effect-tracking advantages (explicit I/O, no surprises) are foregone. Mitigated by the architecture rule that services depend only on port interfaces, never on concrete infrastructure — the boundary is structural, not type-tracked.

**Neutral**:
- This decision does not affect the Supabase backend (Edge Functions on Deno — TypeScript, paradigm-neutral).
- TypeScript strict mode is required regardless of paradigm (separate constraint).
