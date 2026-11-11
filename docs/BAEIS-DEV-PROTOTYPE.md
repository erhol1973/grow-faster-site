# Belgian AI Economic Intelligence System — four-sprint dev prototype

**Scope:** isolated, public-code demonstration only. **Do not merge into main or deploy to production.**

## Four prototype increments

1. **S1 — Navigation / Product foundation:** separate `baies-dev.html` route, premium blue design, mobile layout, NL/FR switching, five prototype sections, accessible controls.
2. **S2 — Trusted evidence:** five traceable primary source records from Statbel, VLAIO/ECOOM and NBB; claim IDs, dates, limitations, proof categories, record validation and allowlisted source domains.
3. **S3 — Editorial workflow:** deterministic four-stage local simulation. Metadata checks before review, challenge before internal preview approval, audit history in memory only. **It is not an actual independent agent runtime.**
4. **S4 — Executive experience:** CEO/CFO/CIO/COO lens, sector and search filtering, evidence dialog, local sample brief download, no-send signup consent simulation.

## Boundaries

- No Supabase, CMS, GitHub production, HubSpot, API, telemetry or external write connection exists in this app.
- The only outbound links are user-invoked links to the original research sources.
- No personal information is stored. The form is a consent UX simulation and explicitly discards entered values.
- Robots directives: `noindex,nofollow,noarchive` (not an access control). Preview deployments may be publicly reachable. Never include secrets or customer data.
- `canPublishExternally()` is hardwired to false, and the publishing control is disabled in HTML and JavaScript.
- The in-browser review buttons simulate handoffs; they **do not** perform scientific verification or grant formal publication approval.
- Priority scores are editorial assumptions, *not* statistical predictions of ROI or AI causality.
- Original site routes, CMS content/history, production domain and PR #57 are untouched.

## Reference evidence (static snapshot: 11 November 2026)

| Claim ID | Primary publisher | Date | Reference |
| --- | --- | --- | --- |
| BE-AI-001 | Statbel | 2025-12-02 | AI usage in Belgian enterprises (34.5% in the ICT survey) |
| BE-AI-002 | VLAIO / ECOOM | 2026-03-18 | Flemish AI barometer 2025 (58.8%; 2,915 answers) |
| BE-EC-003 | NBB | 2026-06-12 | June 2026 macroeconomic projections (forecast) |
| BE-EC-004 | NBB | 2026-10-29 | 2026 Q3 GDP flash estimate (preliminary) |
| BE-SME-005 | Statbel | 2026-09-23 | 2024 structural business statistics (non-financial market economy) |

Original URLs and caveats are maintained in `assets/baies-dev-data.js`.

## Verification

- `node --test tests/baies-dev.test.cjs`
- `npm run build` (the branch additionally packages `baies-dev.html`; JS/CSS are copied by the existing assets whitelist)
- `npm test`, `npm run security`, `npm run test:e2e`, `npm run test:load`, `npm run test:performance` and the unchanged repository CI gates before a public preview can be described as fully validated.
- New browser scenarios: `tests/browser/baies-dev.spec.cjs` (Chromium desktop and mobile via existing config).
- Local exploratory smoke checks were exercised separately on desktop 1440, tablet 768 and mobile 390 viewport with browser-injected static assets; this does not substitute for a real deployed URL/HTTP/browser build check.

## Deployment strategy

Push to a **new dev-only branch** and use the linked Cloudflare Pages GitHub check to identify an isolated branch/PR preview. Do not merge to `main`, update DNS, alter Pages production, modify the CMS release PR or use production credentials. The full original live site is outside this prototype scope.

## Technical follow-up (not in MVP)

- Real multi-agent orchestration and independent verifier identities
- Public data ingestion/crawling with terms-of-use and content licensing
- Server-side audit log, RBAC and CMS integration
- Authenticated human editorial approval with content-hash bound decisions
- HubSpot integration with GDPR compliant opt-in and unsubscribe
- Accessibility tooling, actual screen-reader/device validation and security review
- Persistent data model, job retries/idempotency and monitoring