# ADR-011: IndexedDB Offline Queue Schema

**Status**: Accepted
**Date**: 2026-04-21
**Author**: Morgan (nw-solution-architect)
**Feature**: react-pwa-ui — UI-08 (Offline Session Logging)
**Resolves**: OQ-02 (IndexedDB schema for offline queue)
**Supersedes**: —
**Superseded by**: —

---

## Context

ADR-002 established the offline-first strategy: session saves go to an IndexedDB queue when offline
and are replayed to Supabase PostgREST on reconnect. OQ-02 asks whether the IndexedDB queue schema
should mirror the Postgres `sessions` table exactly, or use a different representation that is
transformed on sync.

The domain model (`src/types/index.ts`) defines `Session` as the canonical in-memory representation.
The Postgres `sessions` table uses snake_case column names (`user_id`, `logged_at`, `is_open`) with
slightly different shape. The `SessionRepository` already handles the `rowToSession()` mapping
between Postgres rows and domain `Session` objects.

The IndexedDB schema decision has implications for:
- Sync complexity (what transformation is required at sync time)
- Queue inspection (can the UI display pending session details?)
- Crash recovery (can the queue survive an app restart correctly?)

---

## Decision

The IndexedDB offline queue stores **domain `Session` objects with two additional fields**, using
the same TypeScript type as the in-memory domain model plus sync metadata:

```
IndexedDB store name: "offline_sessions"
Key path: "id"  (client-generated UUID, same as Session.id)

Object shape (TypeScript):
{
  // Standard Session domain fields (from src/types/index.ts)
  id: string;           // UUID — primary key, same as Postgres session id
  userId: string;
  entries: ExerciseEntry[];
  loggedAt: Date;       // IndexedDB stores Dates natively as timestamp
  syncedAt: null;       // always null in the queue — never synced yet
  isOpen: boolean;

  // Queue-specific metadata (not in Session type)
  queuedAt: Date;       // when the offline write was queued
  syncAttempts: number; // retry count — max 3, then moves to error state
}
```

**Schema rationale**: The queue stores domain objects, not Postgres row objects. This means:
1. No transformation is needed between the queue read and the Supabase upsert — the existing
   `SessionRepository.syncOne()` method already maps domain `Session` to the Postgres upsert payload.
2. The queue is readable by the UI layer using the same domain type — displaying pending session
   count, exercise names, and timestamps requires no additional mapping layer.
3. The `queuedAt` field enables chronological replay ordering independent of `loggedAt` (which is
   the user-declared workout date and could be set to a past date by the user).

**IndexedDB store configuration**:
- Database name: `calisthenics-tracker-v1`
- Store name: `offline_sessions`
- Key path: `id`
- Index: `by_userId` on `userId` field (for filtering by user without full scan)
- Index: `by_queuedAt` on `queuedAt` field (for chronological replay ordering)

**Sync replay order**: Sessions are dequeued in ascending `queuedAt` order (earliest queued first).
This preserves the correct chronological write order to Supabase, which matters for the readiness
engine's trailing session evaluation. Note: `queuedAt` is the server-side ordering anchor, not
`loggedAt`, because the user may have set `loggedAt` to a past date during offline use.

**Sync drain logic** (owned by `SyncCoordinator`):
1. Open cursor on `offline_sessions` store, ordered by `queuedAt` ascending.
2. For each session: call `SessionRepository.syncOne(session)`.
3. On success: delete the record from IndexedDB.
4. On failure (network error): increment `syncAttempts`. If `syncAttempts >= 3`, move to error state
   (do not delete — user must see it). This prevents infinite retry loops on permanent failures.
5. Update `syncStatusStore.pendingCount` after each deletion.

**Offline queue depth indicator**: The UI reads `pendingCount` from `syncStatusStore` (Zustand),
which is updated by `SyncCoordinator` as items are drained. No direct IndexedDB reads are needed
from UI components to display the sync badge.

---

## Alternatives Considered

### Alternative 1: Mirror Postgres Row Shape (snake_case)

Store objects in IndexedDB using the same shape as Postgres rows:
`{id, user_id, entries, logged_at, is_open, synced_at}`.

**Evaluation**:

Pros: the sync path is trivially a direct PostgREST POST with the stored object — no field mapping
required.

Cons: the IndexedDB layer would import Postgres-specific field names into the client-side queue.
The existing `SessionRepository` already performs the domain-to-row mapping at upsert time
(`syncOne()` maps `Session` domain fields to Postgres column names). Storing Postgres row shapes
in IndexedDB would skip the domain layer, making the queue object incompatible with the `Session`
type used everywhere else in the application. UI components reading the queue for display would
need to handle two different object shapes (domain `Session` vs. Postgres row). This violates
the hexagonal architecture boundary: the queue is internal to the application, not a Postgres
replica.

**Rejection rationale**: Mixes infrastructure representation (Postgres snake_case) into the domain
layer. Breaks the existing `Session` type contract used by all services and hooks.

---

### Alternative 2: Normalized Queue Entries (operations log)

Store individual write operations rather than complete session objects:
`{opId, opType: 'create'|'addEntry'|'close', payload, queuedAt}`.

**Evaluation**:

Pros: more granular replay — each individual mutation (create session, add entry, close session)
is replayed independently. Aligns with an event-sourcing-like approach.

Cons: significantly more complex replay logic. A user who logs 3 sets offline would have 7 operations
in the queue (1 create + 3 addEntry + 1 close + ... = varying). Replaying operations sequentially
requires maintaining operation ordering per session AND across sessions. If any operation fails
mid-replay, the queue is left in a partially-applied state requiring rollback logic. For a v1 system
with a single-device constraint and LWW conflict resolution, this complexity is not justified. The
existing `SessionRepository` already represents a complete session as a single upsert — the normalized
operations approach would force a redesign of the sync path.

**Rejection rationale**: Complexity-benefit ratio is inverted for v1. The complete-session approach
enables a single upsert per session with the existing `isRemoteNewer()` LWW check. An operations
log would require multi-step replay with rollback, which is v2 territory if multi-device support
is ever added.

---

### Alternative 3: Use Cache Storage API instead of IndexedDB

Intercept `POST /rest/v1/sessions` requests in the service worker using Cache Storage.

**Evaluation**:

Pros: no IndexedDB code — the service worker handles queueing transparently.

Cons: already rejected in ADR-002 (Option B). Cache Storage is designed for GET response caching,
not POST write queuing. POST requests cannot be keyed and retrieved from Cache Storage in a
structured way without non-standard serialization. IndexedDB is the correct browser primitive
for mutable, queryable local write queues.

**Rejection rationale**: ADR-002 already rejected this approach. Reconfirmed — no change.

---

## Consequences

**Positive**:
- Zero new mapping code needed: `SyncCoordinator` reads `Session` objects from IndexedDB and passes
  them directly to `SessionRepository.syncOne()`, which already handles the domain-to-Postgres
  mapping.
- UI components can display pending session details (exercise name, date, entry count) by reading
  the `Session` objects from `syncStatusStore` without a separate IndexedDB query.
- The `queuedAt` index makes chronological drain ordering a single indexed cursor traversal —
  no in-memory sort required.
- Crash recovery is automatic: IndexedDB is durable storage. An app restart before sync completes
  leaves the queue intact. `SyncCoordinator.start()` checks queue depth on boot and resumes drain.

**Negative**:
- `Date` objects: IndexedDB serializes JavaScript `Date` objects correctly in modern browsers, but
  the `SyncCoordinator` must deserialize them correctly on read (IndexedDB returns native `Date`
  objects for `Date` values — no JSON.parse() date string conversion needed). The crafter must
  test this deserialization path explicitly.
- `syncAttempts` field is not in the `Session` domain type — it is queue-only metadata. The
  `SyncCoordinator` reads it from IndexedDB but never passes it to services or stores. This is a
  minor type boundary concern the crafter must handle with a `QueuedSession` type that extends
  `Session`.

**Neutral**:
- IndexedDB storage budget: each session object is ~200–500 bytes. 100 offline sessions = ~50 KB.
  IndexedDB quota on modern mobile browsers is ≥50 MB per origin. The queue is not a storage concern
  at any plausible v1 usage level. ADR-002's R-05 risk remains theoretical.
