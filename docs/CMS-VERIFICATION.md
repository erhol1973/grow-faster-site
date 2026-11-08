# CMS verification — 8 November 2026

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
then repeatedly failed on CDP input and state requests; the native window
fallback also timed out. An additive SQL migration was prepared, but its Run
button was never activated. **No production migration, private bucket creation,
CMS content publication or website deployment has been performed.** Use the
versioned migration file, not any unexecuted SQL-editor buffer, for activation.

## Latest local artifact

- Build: 151 public files, including the administrator page and existing film.
- Unit/HTTP/client/PostgreSQL: **100 passed, zero failed/skipped** on Node 24.22.1.
  PostgreSQL coverage includes actual policies and RPCs under synthetic admin,
  ordinary authenticated and anonymous identities, concurrent edits, two
  successive publications, private drafts and media-reference restrictions.
- Artifact security heuristic: passed. This is not a penetration test or a
  substitute for dependency audit, CodeQL or secret-history scanning.
- Local load: **432 requests, zero errors/missing routes, p95 108.737 ms**, against
  the unchanged 1,500 ms limit. Eight workers, local preview only. This does not
  establish production capacity or Core Web Vitals.
- Targeted browser verification of the latest artifact: running; results will
  be recorded before this draft is considered for release.

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

1. Apply and verify the reviewed migration and create private `cms-media` in
   the existing growfaster-prod project.
2. Verify real CMS password login, non-admin denial, file byte delivery, MIME
   limits, private draft URLs, anonymous signing restrictions and actual
   save/preview/publish against the live service. Local mocks do not prove these.
3. Pass the complete protected-main browser, dependency, secret-history,
   CodeQL, load and Lighthouse gates on the final revision. Local Lighthouse
   medians and the full latest local browser matrix are not yet complete.
4. Only then merge/deploy the tested artifact and perform live smoke checks.

Physical-device testing, manual screen-reader testing and full rich-text/site
content migration have not been performed. The supported editorial surface is
656 fields across eleven pages; navigation, interactive models, ECA, legal
pages, book/journal readers, metadata and the existing commercial retain their
source-managed behavior. See `CMS.md` for the precise editing and recovery model.
