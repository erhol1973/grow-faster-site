# Release test plan

Every change runs Node document/asset integration tests and browser regression tests. Browser coverage includes desktop and mobile, four saved languages, article selection/history/deeplinks, cookie rejection and focus restoration, navigation smoke, process layout and simulator controls/message-source rejection. Tests use local preview only. Failed assertions block release; reports and failure traces must be retained.

## Commands

- `npm test`: Node source/integration tests.
- `npx playwright test`: browser smoke, integration, regression and end-to-end scenarios.
- `node scripts/security.cjs`: heuristic secret and dangerous URL checks.
- `node scripts/load.cjs`: starts and closes its own preview on an ephemeral local port, issuing 240 requests with eight concurrent workers. Errors block; latency is diagnostic because CI hardware varies.

## Positive and negative coverage

Positive: every local link resolves, all article targets exist, valid saved language persists, reject/save closes consent and unlocks scroll, simulator responds to controls. Negative: unknown article hash falls back safely, optional analytics/fonts stay unrequested when rejected, a message from the wrong source cannot resize the iframe, missing assets and duplicate IDs fail integration checks.

## Release evidence and follow-up suites

Use browser HTML/JUnit reports, screenshots and retained traces to investigate failures. Tests validate the built dist deployment artifact, including executable syntax, assets and fragments. The privacy `#cookies` anchor is a documented exception: runtime redirects it to a language-specific anchor rather than a literal source ID. Add a dedicated browser assertion before changing this convention.

The performance suite enforces measured artifact budgets: CSS 125KB; site.js 55KB; translations 260KB; content.js 23KB; ux.js 15KB; each raster image 700KB. The largest current raster is 616,868 bytes. These limits constrain transfer-size regressions; they do not measure Core Web Vitals. Lighthouse mobile/desktop timing remains a follow-up with three-run median baselines. Local load measurements describe the preview server, not GitHub Pages capacity. Dependency auditing and a dedicated secret scanner complement the artifact heuristic scan. Passive DAST must target the local preview; do not run production attack/load tests. A heuristic scan is not a security guarantee.

Unit/component coverage tests the real preview server (GET, HEAD, MIME, unknown resources, denied write methods, malformed URLs, NUL/backslash and traversal), and the exported security detector using positive and negative synthetic fixtures. Static document checks are integration tests, not unit tests. There is no extracted simulator business module. Do not copy inline simulator code into tests or claim artificial unit coverage. A future safe extraction should add hand-calculated straight, parallel and back-loop fixtures. Consent schema hardening (boolean types and future timestamps) and checking analytics withdrawal stops already-installed listeners remain follow-up work.

Browser suites additionally cover malformed/expired consent, unsupported language fallback, keyboard skip navigation and dialog focus containment, accessible button naming, and Value alignment in every language. These targeted accessibility checks do not replace axe scanning or manual screen-reader/contrast review. Full Chromium desktop/mobile suites run alongside small Firefox/WebKit smoke projects; browser downloads are needed in CI. Mobile intentionally skips desktop-only 3x2/alignment assertions.

## Local verification, 28 October 2026

Node: 11 tests passed. Artifact security scan passed. Local load: 240 requests, zero errors, 1,791ms total and 112ms p95 in this run (diagnostic values). Desktop/mobile Playwright executed through installed Edge using TEST_BROWSER_EXECUTABLE; Firefox/WebKit projects are configured for CI and have not been executed locally. The browser report is the authoritative current result; local Edge execution is not a claim of Firefox/WebKit validation.
