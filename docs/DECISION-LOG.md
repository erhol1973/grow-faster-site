# Integration decisions

## D001 — identify the public exercise at its entry links

14 November 2026. CPO decision; Design concurs. Scope: DEV discoverability only.

- A (recommended): name the fictional decision journey in every common CTA.
- B: retain the generic fictional-example label, which does not identify the destination on Journal and Radar.

Resolved A: NL **Open de fictieve beslisreis →**; FR **Ouvrir le parcours de décision fictif →**. Keep the explanatory context, existing locale-only destination, private edition boundaries and return route. No new UI or functionality. Normal wrapping at the canonical control typography must be verified at320/390 and desktop. Production remains unchanged.

## D002 — preserve older markup while updating changed assets

14 November 2026. CPO decision after inspecting the first implementation.

- A (recommended): finite cache-version updates for changed asset references plus compatibility with older Approach and Journal markup.
- B: reuse old cache URLs and assume every visitor loads new HTML and assets together.

Resolved A. Retain legacy Approach localization when component attributes are absent. Keep the original four-row reader default and scope the fifth row to the explicit new reader marker. Use the existing HTTP cache fixture for lasting old-markup/current-asset and version-transition evidence; do not substitute request mocks for cache behavior. No generic versioning framework, private edition change or increased budget. The interrupted first native run remains incomplete evidence; rebuild and test the corrected artifact.

## D003 — investigate mobile visual findings before final acceptance

14 November 2026. Independent image review of the unchanged DEV artifact observes Radar logo/account overlap at320 and390, and compressed first-sheet content in one mobile-WebKit Dutch guest Journal capture.

- A (recommended): finish the running frozen-artifact suite, compare the retained baseline/current states, and correct a demonstrated layout defect with bounded host CSS and lasting geometry coverage.
- B: accept component-only bounds and leave the observed page behavior unexplained.

Resolved A for the header after the six-state baseline comparison: the exact same overlap exists in the earlier CI artifact at320 and390. Apply only bounded public host wrapping at480 and below, with actual overlap checks; keep account access, type sizes and protected template unchanged. The guest reader also shows the same settled compression in both artifacts (natural width13,506px; physical H1 below1px). Its subsequent causal evidence and authorized fit correction are recorded below. The original195-case run remains192 passed/3 failed and is retained; test repairs address the demonstrated load lifecycle and explicit two-link Journal contract without weaker deadlines or assertions. Production remains unchanged.

Reader proposal authorized after per-pass evidence and independent review: early callbacks measured unstyled content and repeatedly counted the same intrinsic-image overflow, poisoning the cached width. Later styled callbacks found no overflow but retained that width. A readiness latch before all fit reads waits for window load followed by the current font-readiness promise; the already-loaded branch uses the same promise synchronously registered. Then fit the current sheet with the unchanged algorithm. Preserve resize/image callbacks, fonts, aspect, zoom, content and private access/integrity behavior. The subsequent corrected-case22/22 run covers delayed styles, stable real container resizing, late bootstrap, paging, zoom and genuine content overflow. Earlier failures remain retained; this is no network-failure or global release guarantee.

## D004 — stabilize the actual decision-journey anchor landing

14 November 2026. A new viewport-before-focus test exposed four genuine320px Chromium landing failures. Fixed A/B tests in both locales isolate the upstream deferred-layout estimates: the original target stays outside the viewport, while calculating the real preceding section heights lands correctly without focus, manual scrolling or changed deadlines.

- A (recommended): reuse the existing visible/no-intrinsic policy only for the two preceding sections while the decision-journey entry is the active fragment target.
- B: disable deferred layout generally or add a separate imperative scroll mechanism.

Resolved A. The target-scoped body:has selector changes only the existing stylesheet; JavaScript, fonts, route data and general layout policy stay. Cold entry, same-document fragment changes, ordinary-target policy and native Back/Forward pass the subsequent25-case five-profile run without test-driven scrolling. Build4 differs from build3 only in site.css; all203 other public files remain exact. Final build5 removes exactly one CR byte, with independently verified inverse proof. The original four failures and blank captures are retained. Full-head CI and remaining native acceptance conditions remain separate. Production remains unchanged.
