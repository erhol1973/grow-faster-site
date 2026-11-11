# BAEIS Design System v2.0 — Work package A

Dev only. Based on PR #63, commit `4c7f3ebf14f22bf4bb75a69f020f2bbf95c503f4`, branch `dev/baies-mvp-four-sprints-20261111`. The derived branch must never merge into main.

## Implementation

- Four rising bars, flat #2189E1, exact mixed-case Grow Faster wordmark. Transparent SVG and 3x RGBA PNG versions with navy #0B2545 or white text. Matching SVG/32px PNG favicon.
- Assets are prefixed `img/baies-dev-`; only the isolated BAEIS HTML references them. Shared production logos remain untouched.
- The isolated stylesheet uses Grow Faster's existing approved stack: Aptos, Hanken Grotesk, Segoe UI, Helvetica, Arial, sans-serif. Body 17px, navigation 15px, cards 16px, metadata 12–13px. Responsive header wrapping and AA text contrast.
- No changes to evidence data, app logic, editorial gates, downloads, consent simulation, CMS, HubSpot or production routes. NL/FR and all four sprints remain available.

## Regression coverage

`tests/baies-dev.test.cjs` checks exact solid asset colours, four bars, wording, transparent PNG format, favicon linkage and font tokens. `tests/browser/baies-dev.spec.cjs` checks delivered SVG, typography, 390/768/1440 layouts, both locales and axe AA on all five views in desktop/mobile Chromium, alongside the three existing functional cases.

## Release boundary

The initial commit uses the Cloudflare-specific `[CF-Pages-Skip]` prefix, so review/CI can run before any new public preview. Existing thresholds and CI definitions are unchanged. A preview must only be deployed after required gates pass; no production release or main merge is authorised.

Local evidence is retained in the parent workspace under `work/baeis-a-*.log`, and standard reports remain under ignored `reports/`, `test-results/` and `playwright-report/`. The Windows system default Node 20 is below the project minimum; verification uses the already-installed Node 24.22.1. Browser binaries come from the existing `.playwright-browsers` directory. Initial setup failures and contrast failures are retained in the logs.

Physical devices and actual screen-reader speech remain manual validation limitations; axe does not prove complete WCAG conformity.

## Dedicated dev gate

`.github/workflows/baies-dev-quality.yml` adds a BAEIS-only Linux gate. `playwright.baies-dev.config.cjs` runs the existing BAEIS flow/branding/axe cases on all five browser profiles. `scripts/baies-dev-load.cjs` and `scripts/baies-dev-performance.cjs` use the repository harness implementation with only BAEIS routes and a separate report directory. They retain eight workers, at least 288 requests, p95 <= 1500ms, three cold sequential samples per mode, score >= 90, LCP <= 2500ms, CLS <= 0.1 and TBT <= 200ms. The shared workflow, scripts and production routes are unchanged.

A Windows-only initial-scroll experiment did not resolve variable mobile blocking time and was discarded. Local Windows clipboard CRLF mismatch, load timeouts and failed performance samples remain evidence, not passing gates. The dedicated Linux job verifies BAEIS independently of concurrent desktop work.
