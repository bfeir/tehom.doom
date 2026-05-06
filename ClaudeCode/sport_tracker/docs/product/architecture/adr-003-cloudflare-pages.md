# ADR-003: Cloudflare Pages for PWA Hosting

## Status: Accepted

---

## Context

The product is a React + Vite PWA consisting entirely of static assets: HTML, JavaScript bundles, CSS, service worker, and a web manifest. It requires a static hosting platform with:
- Global CDN edge distribution (low latency asset delivery for mobile users)
- Automatic HTTPS
- GitHub Actions integration (auto-deploy on push to main)
- Free tier viable at launch scale (5–50 users)
- Service worker support (must serve assets with correct `Cache-Control` and `Service-Worker-Allowed` headers)
- No function compute needed (backend is fully on Supabase)

The primary candidates are Cloudflare Pages, Vercel, and Netlify.

---

## Decision

Deploy the PWA static assets to **Cloudflare Pages**.

Configuration:
- Build command: `npm run build` (Vite)
- Output directory: `dist/`
- Auto-deploy trigger: push to `main` branch via GitHub integration
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set in Cloudflare Pages dashboard (these are public-safe anon credentials — the secret is RLS, not the anon key)
- Custom headers via `_headers` file: set `Service-Worker-Allowed: /` and appropriate `Cache-Control` per asset type

---

## Consequences

**Positive**:
- **Cloudflare Pages free tier has no bandwidth or request limit for static assets** (as of 2026). Vercel free tier caps bandwidth at 100 GB/month and function invocations at 100K/month. Netlify free tier caps bandwidth at 100 GB/month. For a PWA where the service worker caches assets aggressively, actual CDN requests are low — but the absence of an artificial cap removes a future billing surprise.
- **300+ edge locations globally**: Cloudflare operates one of the largest CDN networks. Initial PWA load (~500 KB gzipped) is served from the nearest edge node, minimizing first-load latency for users outside North America.
- **Zero configuration for HTTPS, HTTP/2, Brotli compression**: all enabled by default. No nginx config, no certificate management.
- **GitHub integration is native**: push to main triggers build and deploy automatically. Build logs are available in the Cloudflare Pages dashboard.
- **No Cloudflare Workers required**: the PWA is purely static; no serverless function capability is needed from the hosting layer. This avoids Cloudflare Workers' 10ms CPU time limit (stricter than Supabase Edge Functions' 50ms limit).

**Negative / trade-offs**:
- **Cloudflare Pages analytics are less detailed than Vercel**: Vercel's dashboard provides per-function latency metrics, error rates, and build duration charts. Cloudflare Pages provides basic request counts and geographic distribution. For v1 at micro-scale, this is acceptable. Application-level analytics will be implemented separately (Supabase's built-in log tail + a lightweight analytics event table).
- **Preview deployments are available but not used**: the decision to use production-only environments means Cloudflare Pages preview URLs (auto-generated per PR) are not leveraged in the CI/CD workflow. This is a workflow constraint, not a platform limitation.
- **Developer familiarity**: the developer has React experience but may not have used Cloudflare Pages before. The setup is ~15 minutes (connect GitHub repo, set build command and output directory, add environment variables). Cloudflare Pages documentation is adequate.

---

## Alternatives Considered

### Option A: Vercel

- Pro: excellent developer experience, per-deployment preview URLs, detailed analytics dashboard, tight Next.js integration.
- Con: 100 GB bandwidth cap on free tier (surprising bill risk if viral moment). Free tier serverless functions have a 10s timeout — would conflict with the 60s Claude API call if the product were ever restructured to route through Vercel Functions. The product does not use Next.js, so the primary Vercel differentiator does not apply. Rejected primarily due to bandwidth cap and timeout constraints.

### Option B: Netlify

- Pro: similar feature set to Vercel, generous free tier historically.
- Con: 100 GB bandwidth cap on free tier. Netlify's build minutes limit (300/month free) is sufficient but adds a ceiling. Netlify Functions have the same 10s timeout issue as Vercel. No meaningful differentiator over Cloudflare Pages for a static PWA. Rejected — Cloudflare Pages has no bandwidth cap and equivalent functionality.

### Option C: GitHub Pages

- Pro: free, zero configuration, native GitHub integration.
- Con: no CDN (serves from GitHub's servers, not edge locations). No environment variable support (would expose Supabase URL in build config in the repository). Does not support custom headers (required for `Service-Worker-Allowed` header for service worker scope). Rejected due to missing PWA-required header support and lack of CDN.
