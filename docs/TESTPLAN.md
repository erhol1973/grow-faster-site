# Release test plan

Every change runs Node document/asset integration tests and browser regression tests. Browser coverage includes desktop and mobile, four saved languages, article selection/history/deeplinks, cookie rejection and focus restoration, navigation smoke, process layout and simulator controls/message-source rejection. Tests use local preview only. Failed assertions block release; reports and failure traces must be retained.

## Commands

- `npm test`: Node source/integration tests.
- `npx playwright test`: browser smoke, integration, regression and end-to-end scenarios.
- `node scripts/security.cjs`: heuristic secret and dangerous URL checks.
- `node scripts/load.cjs`: starts and closes its own preview on an ephemeral local port. It issues 288 requests with eight concurrent workers, exercising all eight menu destinations, the simulator, shared CSS/JS and an expected 404. Wrong responses, untested required routes and local p95 latency above 1,500ms block release. The JSON report is retained with the other quality artifacts.

## Positive and negative coverage

Positive: every local link resolves, all article targets exist, valid saved language persists, reject/save closes consent and unlocks scroll, simulator responds to controls. Negative: unknown article hash falls back safely, optional analytics/fonts stay unrequested when rejected, a message from the wrong source cannot resize the iframe, missing assets and duplicate IDs fail integration checks.

## Release evidence and follow-up suites

Use browser HTML/JUnit reports, screenshots and retained traces to investigate failures. Tests validate the built dist deployment artifact, including executable syntax, assets and fragments. The privacy `#cookies` anchor is a documented exception: runtime redirects it to a language-specific anchor rather than a literal source ID. Add a dedicated browser assertion before changing this convention.

The performance suite enforces measured artifact budgets: CSS 125KB; site.js 55KB; translations 260KB; content.js 23KB; ux.js 15KB; each raster image 700KB. The largest current raster is 616,868 bytes. These limits constrain transfer-size regressions; they do not measure Core Web Vitals. Lighthouse mobile/desktop timing remains a follow-up with three-run median baselines. Local load measurements describe the preview server, not GitHub Pages capacity. Dependency auditing and a dedicated secret scanner complement the artifact heuristic scan. Passive DAST must target the local preview; do not run production attack/load tests. A heuristic scan is not a security guarantee.

Unit/component coverage tests the real preview server (GET, HEAD, MIME, unknown resources, denied write methods, malformed URLs, NUL/backslash and traversal), and the exported security detector using positive and negative synthetic fixtures. Static document checks are integration tests, not unit tests. There is no extracted simulator business module. Do not copy inline simulator code into tests or claim artificial unit coverage. A future safe extraction should add hand-calculated straight, parallel and back-loop fixtures. Consent schema hardening (boolean types and future timestamps) and checking analytics withdrawal stops already-installed listeners remain follow-up work.

Browser suites additionally cover malformed/expired consent, unsupported language fallback, keyboard skip navigation and dialog focus containment, accessible button naming, and Value alignment in every language. These targeted accessibility checks do not replace axe scanning or manual screen-reader/contrast review. Full Chromium desktop/mobile suites run alongside small Firefox/WebKit smoke projects; browser downloads are needed in CI. Mobile intentionally skips desktop-only 3x2/alignment assertions.

## Local verification, 28 October 2026

Node: 11 tests passed. Artifact security scan passed. Local load: 240 requests, zero errors, 1,791ms total and 112ms p95 in this run (diagnostic values). Desktop/mobile Playwright executed through installed Edge using TEST_BROWSER_EXECUTABLE; Firefox/WebKit projects are configured for CI and have not been executed locally. The browser report is the authoritative current result; local Edge execution is not a claim of Firefox/WebKit validation.

## Regression policy and Contact coverage, 29 October 2026

Tests are versioned in this repository and automatically discovered by the release workflow on pull requests and main pushes. Deployment requires all quality and security gates to pass. Add a regression scenario for each fixed defect or new user flow; update the appropriate layers rather than duplicating every scenario across every layer. Do not remove a failing assertion or loosen a budget merely to release. Retire obsolete cases only with an explanation and replacement coverage where needed.

The navigation case list is shared by HTTP integration, browser end-to-end, HTML performance budgets and local load tests. When a menu route is added or changed, update this list and its acceptance criteria in the same pull request.

Contact scenarios cover every one of the eight menu destinations, at the top and after scrolling, including clicking Contact again from the contact section. The 16 route cases run on Chromium desktop/mobile and Firefox/WebKit desktop. Four additional cases per project exercise keyboard activation, browser history, the footer link and saved NL/FR/EN/DE language. That is 80 Contact end-to-end cases across four projects. The 32 Chromium desktop/mobile route cases reproduce the manual live matrix. Each uses the real menu, including the mobile toggle.

HTTP integration checks all 12 ordinary pages for complete menu links and Contact targets without fragments, while preserving intentional in-content contact-section shortcuts. Load-policy unit tests cover expected negative responses, unexpected errors, timeouts, invalid timings, missing routes and the percentile threshold. Menu HTML documents have an 85KB budget alongside the existing asset budgets. The 1,500ms local-response p95 limit is deliberately generous compared with the historical 112ms baseline to allow CI variation; it detects severe local regressions, not a public-site speed SLA.

Previously cached pages and browser back/forward storage can retain an old HTML link. Fresh artifact tests cannot invalidate existing visitors' caches. After a navigation change, perform a limited live smoke check from the affected routes and distinguish old cached HTML from the released artifact. Do not report these artifact and local-load checks as Core Web Vitals or production capacity tests.
