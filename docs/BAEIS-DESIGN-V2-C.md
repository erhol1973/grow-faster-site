# BAEIS Design System v2.0 — werkpakket C

Isolated dev continuation of the tested blue palette (PR #71), based on source commit 12f22f6cf1fa7f6088e5fd8c53957df4b36fabab / identical preview tree cc50ec796f665386563887817e42e29656154db7. No main merge, production publishing, shared CSS, CMS data or external write integration.

## Experience

- Home distinguishes the product introduction from the executive workspace. Snapshot counters describe the five fixed references and three primary publishers rather than suggesting live business KPIs.
- Executive Dashboard adds a native sixth route, role-derived reference/publisher/evidence-type counts, a decision agenda, evidence details, local TXT download and an explicit role handoff to Radar.
- Radar retains role/sector/search and adds deterministic priority/date/source sorting, reset, management questions and expandable methodological limits. Search includes French claim text as well as Dutch.
- Evidence Register replaces the narrow five-column table with semantic source cards, metadata, claim, expandable limits, details and combined source/type/search filters with reset and empty states. Existing claim IDs, original URLs and factual source data are unchanged.
- Both languages, review state machine, disabled external publication, newsletter interaction, history, native links and keyboard navigation remain available. The source/confidence detail explicitly distinguishes editorial confidence from scientific verification.

## Regression and release evidence

Existing source-validation, publication blocking, review, consent, branding, navigation and contrast cases are retained. Table-row assertions now target semantic evidence cards; the new Dashboard is included in route and NL/FR axe coverage. The mobile menu now expects six links and its next keyboard target is the new primary Dashboard action.

New independent fixtures assert sort order, French claim search and input immutability. Browser cases cover both-language Dashboard counts and role retention, full local download contents, role handoff, sort order, combined filters, empty/reset states, caveat disclosure, dialog focus/axe and all four workspaces at 320/768/1440px.

BAEIS Lighthouse coverage expands from the landing page to overview, Dashboard, Radar and Evidence Register in both languages and both mobile/desktop profiles: three sequential cold samples per route/profile (48 total). Existing score/LCP/CLS/TBT thresholds remain unchanged. Load scans remain local and continue to exercise all BAEIS resource paths; hash routes share one HTTP document.

Release reports are collected outside the source checkout in output/baeis-c. Source commits skip Cloudflare publication until all four GitHub gates pass. A separate short dev-preview branch may deploy only an identical tested tree. General CI also runs the full repository browser, unit/HTTP, security, audit, load and performance suites.

Physical-device checks and actual screen-reader speech remain manual. Existing moderate-only development dependency findings remain outside this BAEIS-only change; high/critical audit gates stay in force.
