# ADR-004: Payment Deferred to v2 with Forward-Compatible Schema

## Status: Accepted

---

## Context

The DISCUSS wave established a freemium model (SC-06, DIS-05): the readiness signal and plateau warning are paywalled features; session logger, tree navigator (read-only), and last 30 days of history are free. The paywall is explicitly not shown until the user has logged ≥3 sessions.

The DISCUSS wave also flagged a legal dependency (DIS-05 risk log): a CC BY-NC-SA commercial use legal opinion ($300–500) is required before the paywall goes live in production. This opinion has not yet been obtained.

The DESIGN wave must decide:
1. Whether to implement payment infrastructure in v1.
2. If not, how to ensure the schema and feature gate architecture remain forward-compatible with v2 payment implementation.

---

## Decision

**Payment infrastructure (Stripe, RevenueCat, or equivalent) is deferred to v2.** No payment SDK is integrated in v1.

v1 implements:
1. A `plan VARCHAR DEFAULT 'free'` column on the `users` table. All users are `'free'` in v1.
2. A `check_plan_gate(user_id, feature_key)` pattern in Edge Functions and client-side feature flag checks: functions check `users.plan` before executing paywalled logic. In v1, this check always returns `'free'` — the feature gate code path exists but the paywall UI is not rendered.
3. The readiness signal and plateau warning are computed and displayed to all users in v1 (walking skeleton pilot per DIS-05). The paywall UI trigger (≥3 sessions) is implemented as a feature flag (`VITE_PAYWALL_ENABLED=false` in v1) so it can be enabled without a code change.
4. No payment webhook handlers, no subscription state management, no Stripe customer objects.

**Schema forward-compatibility**:

```sql
-- users table in v1
users (
  id         UUID PRIMARY KEY,
  email      TEXT,
  plan       VARCHAR DEFAULT 'free',   -- 'free' | 'paid' in v2
  created_at TIMESTAMPTZ DEFAULT now()
)

-- v2 migration adds, without breaking v1:
ALTER TABLE users ADD COLUMN plan_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
```

The `plan` column is a VARCHAR (not a boolean) to support additional tiers in v2 (e.g., `'free'`, `'paid'`, `'team'`) without a schema migration. The column is set at the DB layer, not derived from a separate subscription table — this keeps the feature gate check a single column read, not a join.

---

## Consequences

**Positive**:
- **No legal risk at launch**: the CC BY-NC-SA commercial use question does not block v1 launch because v1 takes no payment. The $300–500 legal opinion is a v2 prerequisite, not a v1 prerequisite.
- **Simpler v1 implementation**: no Stripe integration, no webhook endpoint, no subscription lifecycle management, no payment failure UX. Estimated time saved: 1–2 weeks of development.
- **Pilot data is uncontaminated**: Sprint 3 pilot data measures user behavior with the product, not with the payment friction. Measuring conversion before validating the core value loop would confound the pilot's learning objectives.
- **Schema change in v2 is additive only**: the `plan` column exists in v1. v2 adds `plan_expires_at` and `stripe_customer_id` as nullable columns. No existing rows are invalidated. No application code reading `plan = 'free'` breaks.

**Negative / trade-offs**:
- **No revenue in v1**: the product generates $0 at launch. Accepted as a deliberate product decision to validate the core value loop before introducing monetization friction.
- **Feature gate code exists but is dormant**: the `check_plan_gate` pattern in Edge Functions adds ~10 lines per paywalled function that are never exercised in v1. This is acceptable technical overhead — the alternative (adding feature gates in v2 after the fact) is more disruptive.
- **Paywall UX is deferred**: the ≥3 session paywall prompt UI is not built in v1. When v2 enables `VITE_PAYWALL_ENABLED=true`, the paywall UI must be implemented from scratch. This is a known v2 task, not a v1 gap.
- **`users.plan` is not enforced at DB level in v1**: there is no DB constraint preventing a v1 bug from setting `plan = 'paid'` for a user who has not paid. In v1 with 0 paying users, this is not a risk. In v2, the Stripe webhook handler must be the only writer to `plan` — enforced by RLS policy that allows writes to `plan` only from service-role (used by webhook Edge Function).

---

## Alternatives Considered

### Option A: Implement Stripe in v1

- Pro: monetization-ready at launch; first users become paying customers immediately.
- Con: CC BY-NC-SA legal opinion blocks it. Stripe integration adds 1–2 weeks of development. Introduces payment failure UX, subscription lifecycle management, and webhook reliability concerns before the core product is validated. Rejected — legal dependency and complexity not justified at 5–50 user launch scale.

### Option B: Hard-code `plan = 'paid'` for all users in v1 (fully open)

- Pro: simplest — no feature gate code at all.
- Con: removes the ability to enable the paywall via feature flag in v2 without code changes. When the paywall is introduced, every paywalled code path must be found and updated. Rejected — the forward-compatible `plan` column and dormant feature gate pattern costs ~10 lines per function and saves significant v2 refactoring.

### Option C: Use a separate `subscriptions` table from day one

- Pro: normalized, supports multiple concurrent subscriptions, aligned with Stripe's data model.
- Con: every feature gate check becomes a join. The `subscriptions` table is empty in v1. Adds schema complexity with no v1 benefit. Rejected — the `users.plan` column is sufficient for a two-tier freemium model (free/paid) and is trivially extensible to three tiers in v2.
