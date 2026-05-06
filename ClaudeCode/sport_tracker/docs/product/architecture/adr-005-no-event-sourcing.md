# ADR-005: Traditional State with Domain Event Publishing over Full Event Sourcing

**Date**: 2026-04-13
**Status**: Accepted
**Author**: Hera (nw-ddd-architect)
**Wave**: DESIGN
**Deciders**: Product owner (domain expert), Hera (DDD Architect), Titan (System Designer)

---

## Context

The Calisthenics Tracker v1 domain includes two core aggregates — `Session` (Training Log context) and `UserProgression` (Progression Engine context) — where the following properties were assessed for their suitability for Event Sourcing (ES):

- **Q: Is a complete audit trail required?** Partially. Progression history matters (when did I advance and why?). Individual session edit history does not matter (sessions are append-only; mistakes are corrected by logging a new session).

- **Q: Are temporal queries needed?** Yes. Users need to replay past readiness decisions ("why did the system promote me?", debug past decisions). The domain expert confirmed all three temporal use cases: history of completed exercises, traceability of advancement, and replay of past progression decisions.

- **Q: Are multiple views of the same data required?** In v1: no. The session history view and the readiness signal card are the only consumers of session data. There is no reporting context, analytics projection, or external subscriber in v1.

- **Q: Are state transitions complex?** For `Session`: no. Sessions are immutable after creation — there are no state transitions. For `UserProgression`: low complexity. There is one transition per track (advance to next exercise). No reversals, no compensating transactions, no branching process flows in v1.

- **Q: Does the team have ES experience and learning budget?** No explicit ES experience; this is a solo developer product. No learning budget was allocated for ES infrastructure.

---

## Decision

**Use traditional state storage with domain event publishing. Do not use full Event Sourcing.**

Specifically:

1. **`Session` aggregate**: Stored as rows in the `sessions` table. Sessions are immutable after write (no update commands exist). The table functions as a de-facto append-only log of training facts.

2. **`UserProgression` aggregate**: Current state stored in `user_progression` table (one row per user per track). Advancement history stored in `progression_events` table (one row per advancement, with qualifying session IDs cited for traceability).

3. **Domain events are published** (`SessionLogged`, `SessionSynced`, `ProgressionAdvanced`) as integration events for cross-context coordination, but they are not the system of record. Postgres rows are the system of record.

4. **Temporal replay is achievable without an event store**: Because `sessions` rows carry `logged_at` (the workout date), any historical readiness signal can be reconstructed by filtering `WHERE logged_at <= :target_date` and re-running the rules engine. This satisfies all three temporal use cases identified by the domain expert, at zero additional infrastructure cost.

---

## Rationale

### Why ES was seriously considered

The domain has genuine audit requirements: users need to understand *why* the system promoted them, and the product team needs to debug past progression decisions. These are the canonical ES use cases. The question was whether the cost of ES was justified by the value it provides.

### Why ES was rejected for v1

**The sessions table IS the event log in disguise.** Every session row is an immutable record of a past training fact. No session is ever updated — mistakes are corrected by adding new sessions (the same semantic as an ES append). The `progression_events` table is likewise an immutable append-only record of advancement facts. The data model already provides ES-like properties without ES infrastructure.

**Temporal replay is free.** ES's primary superpower — "reconstruct state as of date X" — is achievable by filtering the `sessions` table by `logged_at`. The readiness signal computation is a pure function of session history; it can be applied to any date-filtered subset. No event store, projection rebuild, or snapshot machinery is needed.

**Complexity cost exceeds value at this scale.** Full ES would require: an append-only event store (or Postgres-as-event-store with explicit stream management), aggregate rehydration from event streams at read time (or snapshot management), event versioning contracts with upcaster pipelines, and projection rebuilds when read models change. For a solo developer building a v1 product at micro-scale (target: 50–1,200 users), this infrastructure does not pay for itself.

**CQRS is also deferred.** In v1, there is one read model per context (session history, readiness signal card). Separating write and read models would add a projection layer with no visible benefit until there are multiple distinct consumers of the same event stream — a v2+ concern.

### What this decision preserves for v2

- The `sessions` and `progression_events` tables are already append-only in practice. If v2 introduces a true event store, the migration path is: read existing rows as events (they are structurally equivalent), write new rows to the event store, and switch the system of record. No data loss.
- Domain events (`SessionLogged`, `ProgressionAdvanced`) are already defined. If v2 adds a message broker (e.g., Supabase Queue), these events can be published externally without changing the aggregate model.
- The readiness signal computation is already a pure function (no side effects, no state mutation). It maps directly to the ES "decide" function pattern. Migrating to ES-style aggregates in v2 requires only wrapping this function, not rewriting it.

---

## Consequences

### Positive

- Zero event store infrastructure to build or maintain.
- Temporal replay of readiness decisions is possible via date-filtered SQL queries — no additional tooling.
- Progression history and traceability are fully supported by the `progression_events` table and `qualifying_session_ids` citation.
- The Postgres schema is simple, well-understood, and portable.
- Solo developer can build and maintain the system without ES expertise.

### Negative

- If v2 introduces multiple view consumers of session data (e.g., analytics dashboard, social sharing, coach view), the lack of an event store means those views must be built as SQL queries against the `sessions` table rather than projections from events. This is manageable at the data volumes expected for v2 but does not scale to high fan-out.
- If the readiness rules change in a way that requires retroactive recomputation of all past advancement decisions, that recomputation must be run as a SQL batch job against `sessions`, not as a clean event replay. This is operationally more complex than a projection rebuild.
- Event versioning is manual. If the shape of a `SessionLogged` event changes, there is no upcaster pipeline — consumers of the published event must handle both old and new shapes themselves.

### Neutral

- `fn-readiness-engine` (Edge Function) receives a `session_id` and queries session history from Postgres. This is equivalent to loading an aggregate from an event store — the query IS the replay. The distinction is that the replay is done over relational rows rather than domain events.

---

## Revisit Trigger

Reconsider full Event Sourcing if any of the following occur in v2:

1. More than two distinct downstream consumers of session data need different projections of the same events (e.g., coach dashboard, social feed, analytics).
2. Retroactive recomputation of advancement decisions becomes a regular operational need (e.g., rules change requiring all past advancements to be re-evaluated).
3. A multi-device sync model is introduced where write conflicts on session data require true event-level conflict resolution (last-write-wins is no longer sufficient).
4. The team grows to include ES-experienced engineers and the product roadmap justifies the investment.
