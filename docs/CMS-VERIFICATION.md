# Integration status — 9 November 2026

This section supersedes historical status statements below. Main a8fae016 was integrated on the existing CMS branch in commit 31f798b; both conflicts are resolved and the local index/tree matched the pushed GitHub tree. No production release was requested or performed.

The open real administrator session previously saved and previewed a temporary Books draft in NL/FR; the original text was restored. An older loaded editor unexpectedly published the original Books content. With explicit owner approval, only that publication (2026-11-09T15:23:06.867298Z) was withdrawn. A guarded transaction and independent checks verified unchanged draft/history. Do not repeat the withdrawal. Anonymous database-role checks confirmed zero visible drafts and no save/publish/history privilege. The private bucket was verified at 25 MiB with JPEG/PNG/WebP/AVIF/MP4 restrictions and zero objects. These observations are prior-session evidence, not a complete live Auth/Storage acceptance test.

Integration build (152 files), 109 unit/HTTP/database cases and artifact security passed locally. An incomplete local dependency setup ran Playwright 1.62.1 against a 1.64.1 lockfile; its interrupted browser run is not release evidence. The local load run failed (432 requests, 29 errors, p95 20611.98 ms); reports are retained. Dependencies were subsequently installed from the frozen lockfile without install scripts.

GitHub run 42649140522 on 31f798b passed build, unit, artifact security, dependency audit and secret-history scanning. CodeQL found a DOM-controlled preview URL suffix. The handler now selects a fixed NL/FR suffix, with a tampered-selector browser regression. No scanner exclusion or threshold was changed. The final revision requires fresh full CI; do not infer success from the earlier partial run.

Release remains NO-GO until complete final CI and real isolated Supabase Auth/Storage acceptance pass. No existing isolated Supabase configuration, local CLI or Docker executable was found in this workspace. Real non-admin login, storage byte delivery, expiring signatures and publication/history through the live gateway are not claimed. Do not run publication tests on growfaster-prod. The public site supports NL/FR; English source keys and English-language books do not imply an English website editor.

---
# CMS verification — 8–9 November 2026

Source baseline: `895cd869761a37df543ecf1d9aa26bf2d7cd09da` (main, protected).
The CMS was reapplied to this revision after the coherence commercial merged.
The commercial assets, captions, seeking support, layout and route tests were
retained. The original commercial remains source-managed; optional new videos
can be managed through the CMS slots.

## Verified production inventory

Read-only SQL in growfaster-prod confirmed the existing `home/hero` draft,
NL/FR heading/body, one confirmed account already in `private.cms_admins`, RLS
on all eight public content tables, the existing public `media` bucket and zero
Storage objects. At inspection, `cms_is_admin` was the only public `cms_*` RPC.
An anonymous API read of `page_sections` returned HTTP 200 with zero rows.
Other subsequent public endpoint probes timed out and are not claimed as passed.

The dashboard session expired and was restored by the owner. Browser control
repeatedly timed out, then recovered. The additive migration was executed and
returned success. The private `cms-media` bucket was created through Storage:
25 MB, JPEG/PNG/WebP/AVIF/MP4 only, with the three intended policies. The existing
public `media` bucket remains unchanged.

A transaction on the actual production PostgreSQL database verified admin
publication/save, hidden anonymous drafts/history, preservation of the published
snapshot during a later draft, and rejection of anonymous and ordinary-user
publication. The transaction returned PASS and rolled back its verification
rows. This is real database-policy evidence with controlled role/claim settings;
it does not substitute for authenticating a browser user through the Auth gateway.
No editorial CMS content or main website release has been published by the agent.

## Latest local artifact

- Build: 151 public files, including the administrator page and existing film.
- Unit/HTTP/client/PostgreSQL: **104 passed, zero failed/skipped** on Node 24.22.1, with test concurrency one.
  PostgreSQL coverage includes actual policies and RPCs under synthetic admin,
  ordinary authenticated and anonymous identities, concurrent edits, two
  successive publications, private drafts and media-reference restrictions.
- Artifact security heuristic: passed. This is not a penetration test or a
  substitute for dependency audit, CodeQL or secret-history scanning.
- Local load: **432 requests, zero errors/missing routes, p95 108.737 ms**, against
  the unchanged 1,500 ms limit. Eight workers, local preview only. This does not
  establish production capacity or Core Web Vitals.
- Targeted browser verification: **45 passed, zero failures/skips/retries** across
  Firefox, WebKit, mobile WebKit, Chromium and mobile Chromium. This covers the
  CMS plus the existing film, NL/FR playback/captions and approved page routes.

The latest additional recovery/navigation run passed **25 cases across all five browsers, zero failures/skips/retries**. This covers owner-initiated email, verified recovery, non-admin denial, disabled credential submission without JavaScript and immediate French Coherence next-page navigation. API recovery tests use synthetic identities and do not establish live email delivery. A prior fixture run failed because its public key mock was missing; its reports are retained. The corrected run passed.

CI at revision 4d859dd passed 581 browser cases, with 14 existing skips, but correctly failed its gate for one flaky Firefox French Coherence route. Its trace exposed smooth scrolling during pointer activation. A regression failed before the CSS fix; native immediate scrolling on Coherence now passes the targeted regression in all five browser projects. The final full CI run is still required.

The earlier implementation on c288be4 passed 95 unit/HTTP/database cases and ten
focused Chromium desktop/mobile CMS cases. Early failures found an obstructing
status toast and a missing cookie-dialog interaction in the test; both were
corrected, and the focused rerun passed without retries. Those old counts are
not the latest artifact's acceptance result.

A 576-case broader local run on the earlier source was stopped after multiple
Firefox navigation/popup/reload timeouts. Its partial traces and screenshots
are retained at `work/cms-current/reports/cms-full-browser-interrupted` in the
workspace. A temporary context-routing fixture was also removed because it
disabled real browser caching; ordinary browser tests now disable only the
external CMS connection through an explicit local-server configuration. Cache
tests retain real HTTP headers, with no browser-routing mocks.

Several restricted-context HTTP runs had ECONNRESET failures. Full successful
unit runs used the same explicit Node 24.22.1 runtime outside that restricted
network context. Reports are retained in each source directory's
`reports/unit-history`; success does not erase those failures or prove that the
local environment is stable.

## Release blockers

1. Verify real CMS password login, non-admin denial, file byte delivery, MIME
   limits, private draft URLs, anonymous signing restrictions and actual
   save/preview/publish against the live service. Local mocks do not prove these.
2. Pass the complete protected-main browser, dependency, secret-history,
   CodeQL, load and Lighthouse gates on the final revision. Local Lighthouse
   medians and the full latest local browser matrix are not yet complete.
3. Only then merge/deploy the tested artifact and perform live smoke checks.

The first CI secret scan flagged 114 false positives: the public publishable key and public field identifiers. The current .gitleaks.toml retains default rules and narrowly scopes inherited generic-api-key allowlists to the public key value/config path and the exact public catalog field-ID format/catalog path. No general path skip or rule disable is used. Secrets history, CodeQL and JavaScript security passed at 4d859dd. The final revision must pass them again.

Preview: https://feature-secure-supabase-cms.grow-faster-site.pages.dev/admin . The first-password UI is implemented, but recoveryEnabled remains false pending approval and verification of the two exact Supabase redirect URLs. The owner has no CMS password yet; no recovery email has been sent by the agent.

The local Lighthouse run did not complete: reports/lighthouse/summary.json is
failed and partial samples are retained. Its partial home-page measurements
are not claimed as full performance acceptance. A wider earlier local Firefox
run also failed and was stopped, as described above. Neither is treated as green.

Physical-device testing, manual screen-reader testing and full rich-text/site
content migration have not been performed. The supported editorial surface is
656 fields across eleven pages; navigation, interactive models, ECA, legal
pages, book/journal readers, metadata and the existing commercial retain their
source-managed behavior. See `CMS.md` for the precise editing and recovery model.

## Isolated acceptance and conflict fix, 9 November 2026

Actual test-project evidence (gqsvoioccvklzfmdmexy only): ordinary account denial was shown by the owner; the authorised administrator session saved a Books NL/FR marker, both actual-page previews displayed it, and anonymous publications stayed empty before confirmation. A confirmed publication produced one snapshot and one history version for section d24e0505-b003-4288-8c31-c83f80834ef2. Anonymous page/API delivery showed the published marker; a later private draft did not replace or leak into it. The first interrupted confirmation attempt left no publication.

A real stale-revision save timed out with SQLSTATE 40001 on PostgREST 14. Supabase documents its retry loop: https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b . Follow-up migration 20261109_cms_conflict_http409.sql preserves both RPC definitions and changes only business-conflict SQLSTATE to PT409. Applied only to growfaster-test; the same stale browser save then returned the actionable conflict message and retained its local text. PostgreSQL regression coverage checks both stale save and stale publish use PT409.

Real private JPEG upload succeeded at 62e2d7fb-8caa-40b2-9103-da8eae457143.jpg; actual-page preview loaded its signed URL (naturalWidth 1152). Anonymous unsigned download and anonymous signing both returned Object not found. Signed URL expiry, direct gateway MIME/size rejection, and later publication of uploaded media remain unverified. The upload remains in the test bucket; the browser retains unsaved local conflict text/media. No production writes, deletions, merges or deployments occurred. Production still requires the follow-up migration as a separately reviewed release step. Full CI must pass on the new head; release remains NO-GO.

## Signed URL expiry and CI startup failure, 9 November 2026

The same real test-object signed URL was fetched from an independent anonymous HTTP client before and after expiry. Before expiry: HTTP 200, Content-Type image/jpeg, 517586 bytes. Its signed lifetime was 300 seconds. At 2026-11-09T18:25:43.506Z (19:25:43 Brussels), 13 seconds after expiry, the same URL returned HTTP 400, code InvalidJWT, with exp claim timestamp check failed. The token itself is deliberately not recorded. This completes actual expiry verification for the private draft image, superseding the earlier unverified note.

Final-code run 42671236939 failed before scheduling any jobs: GitHub annotation Internal server error, correlation 6bf87167-3a9b-47ff-88a2-3158b6eeb222. Zero jobs and no test artifacts were produced. The retry endpoint returned HTTP 403 This workflow run cannot be retried. Cloudflare successfully built cba537c; this is not CI acceptance. This evidence-only commit preserves all implementation, tests and thresholds and starts a new full run; the initial infrastructure failure is retained.

Still unverified: direct authenticated gateway MIME and 25 MiB size rejection; publication and anonymous delivery of the uploaded media after resolving the intentionally stale editor revision; full CI on the final head. A file-chooser attempt to test an invalid SVG encountered a browser-tool timeout and is not pass evidence. No production data or configuration was changed and no records were deleted.

## Real isolated Storage gateway runner

`scripts/accept-cms-storage.cjs` is a standalone Node 22+ interactive acceptance runner, fixed to growfaster-test (gqsvoioccvklzfmdmexy). Run `node scripts/accept-cms-storage.cjs` locally and enter the test administrator password in the hidden terminal prompt. No environment override, production project, privileged key, password argument or token logging is supported. Its own Auth session is signed out with scope=local; other sessions are not revoked. It uploads one valid synthetic PNG and directly tests forbidden SVG MIME plus a 26214401-byte PNG payload against the unchanged bucket limit. It also verifies both rejected paths cannot be signed. Objects are unique and no overwrite/delete operation is performed. The valid test-object path and sanitized results are printed. Real results remain pending until the owner enters the credential locally. Unit coverage rejects permission/service failures as false positive bucket enforcement. Existing browser session and previous evidence do not substitute for this gateway test. No production baseline/migration/merge/deployment is authorised until this gate and all remaining gates pass.

## Main integration and real gateway result, 10 November 2026

The owner ran the committed standalone Storage runner against growfaster-test from 09:56:07Z to 09:56:18Z. Reported results: real administrator Auth and allowed PNG upload passed; forbidden MIME returned HTTP 400 InvalidMimeType; a 26214401-byte payload returned HTTP 400 EntityTooLarge; both rejected paths had no signable object. Valid test object: 91499af0-9305-4ec5-9168-3db046147e05.png. This is owner-executed evidence, not an agent rerun. It supersedes the earlier pending direct-gateway notes.

Main 30077526 (approved PR60 homepage release) is integrated. index.html retains its approved hero photograph, responsive markup, headline/subheadline and CTA destinations; CMS hooks are reapplied without changing that markup. Three text fields removed by the approved layout are removed from the editor catalog only; remaining homepage groups cover all 49 current fields. New NL/FR defaults follow main, and preview/public heading rendering preserves the minimal hero line break without the former emphasis element. Existing browser regression retains safe rendering, both lines and explicit publication confirmation, now checking the actual approved br structure. All regression tests from main are retained. No database content was deleted or production migration applied.

The previous website gate passed 113 unit/integration tests, 624 browser cases (12 profile-specific skips), load and Lighthouse; CodeQL passed. Secret-history flagged the runner's publicly documented sb_publishable key. The existing generic-api-key rule is retained with one additional AND-constrained exception: the exact scripts/accept-cms-storage.cjs path and exact verified public test key only. No secret/service-role keys or unexpected strings match this exception. Full CI on the integration head remains required.

Local integration checks verify exact preservation of main markup after removing additive CMS hooks, catalog/DOM key equality and uniqueness, complete field-group coverage, and script parsing. The earlier Windows git checkout is unavailable in the active cloud workspace; local unknown changes were not overwritten. Remaining gate: publish uploaded test media via the editor and verify anonymous byte delivery, plus final-head CI. The preserved stale editor session will need an explicit recovery/re-authentication before further saves.
