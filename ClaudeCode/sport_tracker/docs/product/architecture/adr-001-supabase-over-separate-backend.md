# ADR-001: Supabase PostgREST + Edge Functions over a Separate Backend Server

## Status: Accepted

---

## Context

The product requires:
- User authentication (Google OAuth + email/password)
- Authenticated CRUD API for session data (sessions, progression state, exercise registry)
- Server-side business logic (readiness engine, Claude API proxy)
- Row-level data isolation between users
- A solo developer with React experience and no prior Supabase experience
- Production-only deployment (no staging environment)
- Cost ceiling of $0 at launch (5–50 users), <$100/month at 10K users

The default architecture choice for a React app requiring these capabilities would be a separate backend service — typically an Express/Fastify Node.js server deployed to Railway, Render, Fly.io, or similar.

---

## Decision

Use Supabase as the full backend stack:
- **Supabase PostgREST** for all CRUD operations (session writes, exercise registry reads, progression state)
- **Supabase Auth** for authentication (JWT issuance, Google OAuth, email/password)
- **Supabase Edge Functions** (Deno runtime) for server-side business logic requiring either a secret (Claude API key) or compound DB queries not expressible as simple CRUD (readiness engine)
- **Postgres RLS** as the sole mechanism for multi-tenant data isolation — no application-level tenant filtering

No separate REST API server is deployed. There is no Node.js backend, no Express, no API server container.

---

## Consequences

**Positive**:
- Zero server management. No Dockerfile, no process supervision, no deployment pipeline for an API server. Reduces infrastructure surface area from 3 components (frontend + backend + DB) to 2 (frontend + Supabase).
- Free tier covers launch through ~1,200 users with no architectural changes: 500 MB Postgres, 50K MAU auth, 500K Edge Function invocations/month.
- RLS at the database level is more secure than application-level tenant filtering: a bug in the application cannot expose another user's data because Postgres rejects the query before it returns rows.
- PostgREST auto-generated API eliminates the CRUD boilerplate that makes up ~60% of a typical REST API server. The developer writes schema migrations, not route handlers.
- Supabase JS client (`@supabase/supabase-js`) handles JWT refresh, realtime subscriptions, and storage — tested, maintained library replacing custom auth middleware.
- Edge Functions cold-start (~150ms on free tier) is acceptable for blocking on-demand calls (readiness signal, Claude API) given the 2–3 second latency budget established in requirements.

**Negative / trade-offs**:
- **Vendor lock-in**: migrating away from Supabase requires rewriting auth integration, RLS policies into application-level middleware, and replacing PostgREST with route handlers. Estimated migration effort at 10K users: 2–3 engineer-weeks. Accepted because: (1) Supabase is open-source (can self-host), (2) the underlying Postgres schema is portable, (3) at micro-scale the productivity gain outweighs the lock-in risk.
- **Edge Function constraints**: 50ms CPU time limit per invocation (Supabase free tier), 150MB memory, Deno runtime (not Node.js). The readiness engine must complete in <50ms CPU time — achievable because it reads at most 10–15 rows and applies deterministic rules. If the engine ever exceeds this, it must move to a Postgres stored function.
- **No custom middleware**: rate limiting, request logging, and circuit breakers that a traditional API server provides via middleware must be implemented differently — rate limiting in Edge Functions via DB state, logging via Supabase's built-in log tail, circuit breakers not applicable at this scale.
- **Developer learning curve**: Supabase is new to the developer. Estimated ramp time: 1–2 days to understand RLS, PostgREST auto-generated API, and Edge Function deployment. Mitigated by Supabase's quality documentation and the `supabase start` local dev environment.

---

## Alternatives Considered

### Option A: Express/Fastify on Railway or Fly.io

- Pro: familiar Node.js, full control over middleware, no vendor constraints.
- Con: ~$5–10/month minimum even at 0 users (Railway/Fly.io sleep-to-save is unreliable for a PWA expecting instant response). Adds a third component to manage. Requires custom auth middleware. Estimated +3 weeks development time for auth + CRUD + deployment pipeline. Rejected due to cost and complexity at micro-scale.

### Option B: Next.js API Routes on Vercel

- Pro: co-located with frontend, developer may know Next.js.
- Con: requires migrating frontend from React + Vite to Next.js (framework overhead). API Routes are serverless functions — same constraints as Edge Functions but with more framework ceremony. Vercel free tier limits: 100 GB bandwidth, 10s function timeout (insufficient for Claude API 60s timeout on Pro plan only). Rejected due to Vercel's function timeout constraint on the free tier.

### Option C: Supabase PostgREST only (no Edge Functions)

- Pro: even simpler — pure CRUD via PostgREST, no business logic server.
- Con: cannot call Claude API server-side (key would be exposed in client bundle). Readiness engine would run entirely client-side (acceptable for v1 but makes server-side re-validation on sync impossible). Rejected because the Claude API proxy requirement mandates a server-side execution context.
