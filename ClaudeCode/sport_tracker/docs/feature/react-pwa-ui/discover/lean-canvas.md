# Lean Canvas — react-pwa-ui

## Metadata

- Feature: react-pwa-ui
- Date: 2026-04-21
- Phase: 4 — Market Viability
- Scope: v1 personal tool + beta (1-3 users)

---

## Canvas

### 1. Problem

Top 3 validated problems (in customer words):

1. **Tool fragmentation**: "I use pen and paper, a clock app, Reddit, the RR wiki, and a Google Sheet — all during one session."
2. **Missed progression windows**: "I was already past the threshold and I didn't know. I only noticed because I felt bored and stagnant."
3. **In-workout context switching**: "I had to search — Reddit, the RR wiki, and a separate Google Sheets reference."

Existing alternatives (what users do today):
- Pen and paper (primary logging)
- Separate clock/timer app (rest timing)
- Reddit + RR wiki + Google Sheets (progression lookup)

---

### 2. Customer Segments

Segmented by job-to-be-done, not demographics:

**Primary**: Self-training RR practitioners who track their own progression
- The user himself — solo training, outdoor park, offline
- Decision-maker and user are the same person

**Beta cohort**: More-advanced RR practitioners (1-3 friends)
- Will stress-test the progression chain and exercise library
- Separate accounts, separate data
- Channel: direct PWA install link

**Not in scope**: Social training partners, beginners without any prior tracking habit, gym-goers with equipment constraints

---

### 3. Unique Value Proposition

**One app that covers logging, readiness, rest timer, and progression chain — built for RR, works offline.**

Supporting statements:
- Replace 4 tools with 1
- Surface the progression rule at the right moment — not retroactively
- Outdoor park ready — no wifi needed
- Fast enough to use between sets

---

### 4. Solution

Top features for top 3 problems:

| Problem | Feature |
|---------|---------|
| Tool fragmentation | Single PWA: log + timer + readiness + history |
| Missed progression windows | Readiness card with rep-range threshold display + proactive nudge |
| In-workout context switching | In-app exercise library with "what comes next" per exercise |
| Rest timer (4th problem) | 90-second configurable rest timer, triggered from session log |

**MVP screen set** (v1):
1. Session log entry — name + sets + reps + qualitative note
2. Readiness card — current volume vs. threshold, plateau warning
3. Exercise history — grid view (exercises x sessions, mirrors paper format)
4. Progression chain view — next exercise with notes
5. Rest timer — 90s preset, countdown, visual

Deferred to v2: settings/profile, social features, notifications, analytics dashboard

---

### 5. Channels

**Current**: Direct link share (PWA install — no app store)
- User sends a link to friends; they install on home screen
- No store review, no distribution friction
- Works on iOS and Android via browser install

**Future (not v1)**: Word of mouth within RR community (Reddit, RR wiki communities)

---

### 6. Revenue Streams

None in v1.

Rationale: Personal tool built for the developer's own use. Beta is free for friends. No payment infrastructure needed. ADR-004 (docs/product/architecture/adr-004-no-payment-v1.md) documents this decision formally.

Future consideration: If beta validates value for a broader RR audience, a freemium model (free: basic logging; paid: progression analytics, plateau detection) is the natural path.

---

### 7. Cost Structure

$0 for v1.

| Resource | Cost |
|----------|------|
| Cloudflare Pages (hosting) | Free tier |
| Supabase (auth + database + edge functions) | Free tier |
| Domain | $0 (if using pages.dev subdomain) |
| Development time | Solo developer, personal project |

Constraints: Free tier only — Supabase free + Cloudflare Pages free (CLAUDE.md).

---

### 8. Key Metrics

| Metric | Why it matters |
|--------|---------------|
| Daily active sessions logged | Core engagement — are users actually training with the app? |
| Time-to-log per session | Must be faster than pen and paper (under 60 seconds) |
| Progression decisions made via app | Did the readiness card fire? Did the user act on it? |
| External lookup rate (beta observation) | Are users still opening Reddit/wiki/spreadsheet mid-session? |
| Rest timer displacement | Are users closing the separate clock app? |

---

### 9. Unfair Advantage

- **Built by a practitioner**: Developer follows RR himself — domain knowledge is intrinsic, not researched
- **Backend already implemented and tested**: ReadinessEngine, SyncCoordinator, PlateauDetector are in production (see docs/scenarios)
- **Exercise library is domain expertise**: RR progression chains are well-defined and the developer understands them
- **Personal use = immediate feedback loop**: Developer IS the primary user — every bug is felt directly

---

## 4 Big Risks Assessment

| Risk | Question | Evidence | Status |
|------|----------|----------|--------|
| Value | Will users want this? | 4 confirmed problems with behavioral evidence; workarounds proven | GREEN — confirmed by interview |
| Usability | Can users use it mid-workout? | Phone already in use between sets; habitual phone behavior confirmed | YELLOW — not yet tested with prototype; beta will confirm |
| Feasibility | Can we build this? | Backend services already built and tested; React PWA + Supabase is the established stack | GREEN — architecture validated, ADRs in place |
| Viability | Does the business model work? | $0 cost, $0 revenue, personal tool — no model risk in v1 | GREEN — explicitly scoped as personal tool, no monetization required |

**G4 Gate decision**: All 4 risks are GREEN or YELLOW. Yellow (usability) is addressed by beta testing as the next step. PROCEED to build.
