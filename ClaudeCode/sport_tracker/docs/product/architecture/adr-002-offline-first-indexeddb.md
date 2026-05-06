# ADR-002: Offline-First with IndexedDB Queue

## Status: Accepted

---

## Context

System Constraint SC-01 (from DISCUSS wave, DIS-07) establishes that session logging must work without internet connectivity. This is a hard requirement, not a nice-to-have. The behavioral evidence (Signal D2) shows this user segment trains in gyms with unreliable or absent connectivity. If logging fails offline, users revert to their spreadsheet. One offline failure is sufficient to break the habit loop.

The system must decide between two approaches:
1. **Online-required with retry**: require connectivity to save; show error and retry UI if offline.
2. **Offline-first with local queue**: save to a local store immediately; sync to server when connectivity is restored.

The application is a PWA (Progressive Web App) deployed to Cloudflare Pages. It has a service worker and can use the Background Sync API, IndexedDB, and the Cache Storage API.

---

## Decision

Implement offline-first with an IndexedDB write queue:

1. On session save tap, the PWA first checks connectivity (navigator.onLine + a lightweight ping).
2. If **online**: write directly to Supabase PostgREST. On success, clear any queued items for this session.
3. If **offline**: write the session as a JSON document to an IndexedDB queue (key: `pending_sessions`, value: ordered array of session objects with a client-generated UUID and timestamp).
4. Show UI indicator: "Saved offline — will sync when connected. [N] sessions pending."
5. On reconnect, the service worker's Background Sync event fires (where supported — Chrome/Android). On browsers without Background Sync (Safari/iOS), a foreground reconnect handler (`window.addEventListener('online', ...)`) replays the queue.
6. Queue replay is ordered by `logged_at` ascending. Each session is POSTed to PostgREST sequentially. On each success, the item is removed from the queue.
7. After all queued sessions sync, `fn-readiness-engine` is called for the latest exercise to compute and display the pending readiness signal.

**Conflict strategy**: Last-write-wins keyed on `(user_id, exercise_id, logged_at)`. Single-device-per-user in v1 means true conflicts cannot occur. This strategy is explicitly scoped to the single-device constraint.

---

## Consequences

**Positive**:
- Session save never fails due to network conditions. The user experience in the gym is identical whether online or offline.
- IndexedDB is synchronous for reads and non-blocking for writes from the PWA's perspective — the 200ms offline save target (from US-01 acceptance criteria) is achievable.
- Queue depth is visible in the UI, giving the user confidence their data is safe.
- Service worker + IndexedDB is the established PWA offline pattern — Workbox (via vite-plugin-pwa) provides tooling for the service worker layer; the IndexedDB queue is a small custom module (~100 lines).

**Negative / trade-offs**:
- **Readiness signal is deferred offline**: the user sees "Saved offline — will sync when connected" rather than an immediate readiness signal. The signal appears only after sync. This is acceptable given the DISCUSS wave decision (DIS-07) that explicitly defers signal computation to post-sync.
- **Queue replay complexity**: if the user logs sessions across multiple exercise types offline, the queue replay must preserve per-exercise chronological order to ensure the readiness engine evaluates sessions in the correct sequence. Implementation must sort by `logged_at` before replay.
- **Background Sync API support gap**: Safari/iOS 15 does not support the Background Sync API. The foreground reconnect handler (`window.addEventListener('online')`) is the fallback — it works when the app is open but not when closed. This means an iPhone user who trains offline and closes the app must reopen it to trigger sync. This is a known PWA limitation on iOS, not a product defect.
- **IndexedDB data persistence**: IndexedDB is cleared if the user clears browser storage. A warning in the UI ("Clearing site data will delete unsynced sessions") mitigates accidental data loss. At v1 scale this is an acceptable edge case.
- **Multi-device conflict resolution deferred**: LWW is correct for single-device. If v2 introduces multi-device, the conflict resolution strategy must be revisited (vector clocks or operational transformation for concurrent session writes are significantly more complex).

---

## Alternatives Considered

### Option A: Online-required with retry toast

- Pro: no offline queue implementation, no sync complexity, no deferred signal UX.
- Con: violates SC-01. Gym connectivity is unreliable. Users who hit an offline failure during save will perceive the app as less reliable than their spreadsheet. Rejected — hard requirement violation.

### Option B: Service Worker Cache + Fetch intercept (no IndexedDB)

- Pro: simpler — intercept POST requests in the service worker, queue them in Cache Storage.
- Con: Cache Storage is designed for GET response caching, not write queuing. Queuing POST requests in Cache Storage requires non-standard serialization and does not provide a structured query interface for reading/modifying queue depth. IndexedDB is the correct browser primitive for mutable, queryable local data. Rejected due to misuse of Cache Storage API semantics.

### Option C: Fully client-side (local-only, no sync)

- Pro: zero sync complexity. App works fully offline always.
- Con: data is not backed up. Device loss or app reinstall loses all training history. Not viable for a product whose value proposition includes historical trend analysis (US-03) and progression event recording. Rejected.
