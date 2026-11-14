# Integrated decision journey quality candidate — 14 November 2026

The Executive Sponsor accepted the V3 local demonstration and authorized the
POs and their agents to close quality blockers for website integration. Production
must remain unchanged. This document records candidate evidence, not permission
to merge main, deploy, modify provider forms or change production data.

## One candidate and one contract

Local branch `integration/decision-journey-quality` combines member head
`3ccf89edcfc9edf8ce64d3939e572d2616d79f0c` and typography head
`9f3462a598ed96e271c112176590abce9b63fce4`. Both descend from verified current
main `b1831e2883d162b686b4183ad852e3c768b5b989`. Prior branch results do not
establish acceptance of this combination.

One approved family stack starts with Aptos and uses local Hanken Grotesk as a
fallback. Body17, H1clamp(40px,6vw,86px), H2clamp(32px,4vw,54px), H3=24px and
H4=20px supersede the member branch's competing Hanken-only/smaller-heading
policy. Supporting roles remain explicit: label12, metadata14, control15,
metric32. Existing positive and negative role checks remain required.

The accepted V3 exercise is integrated at `/decision-journey/`, reached through
an in-content Aanpak entry and returning to that entry in the selected NL/FR
language. Exercise models retain their accepted semantics. Only the language
travels in the URL. No account, CMS, CRM, analytics, storage, AI service or remote
submission is introduced to the exercise. Fictional examples and memory-only
editing remain visibly disclosed.

The new exercise app receives a separate70,000-byte transfer budget. This starts
from the accepted V3 app of66,766bytes plus its348-byte website/inert-copy adapter;
it does not change any existing website asset limit. The initial65KB estimate
was below the accepted source itself and was not an established release limit.
Exact baseline/candidate bytes and source deltas must be recorded with results.
The exercise layout CSS is25,343bytes, down from V3's27,273bytes after shared
typography consolidation, with a new26,000-byte limit. Exact hashes and source
classification are in `DECISION-JOURNEY-INTEGRATION.md`.

The source surface map precedes agent dispatch. LSE owns integration and ordinary
regressions; LDE owns exactly the canonical CSS, its design documentation and
exercise layout CSS. CPO owns this record, CI, agent governance and exercise
browser regressions. The independent reviewer owns no candidate source. Both
upstream Git histories and producer path receipts must remain reviewable.

## Authorization semantics

The actual SQL `member_has_access()` admits any active, confirmed,
non-anonymous Auth account. It is not a paid-membership table. An ordinary
confirmed CMS owner cannot normally have that RPC return false under this
policy. Do not manufacture an account state or change eligibility to satisfy
an impossible native-test premise.

Standalone `/admin` must authorize with `cms_is_admin` without invoking member
bootstrap or membership RPCs. Synthetic false-membership tests demonstrate
client independence; they are not evidence of a real account with that state.
Native owner login and native registration/recovery remain separately labelled
acceptance evidence, using growfaster-test only. The optional website member
bridge keeps its existing member and administrator checks.

The sponsor subsequently signed in at the actual integrated local `/admin`,
served separately on127.0.0.1:4214 without the synthetic CMS-test mask. The
existing loopback configuration selects growfaster-test; no environment change
was needed. Observed: "Contentstudio · TEST", login panel hidden, real workspace
visible, "Aangemeld", and "Kies een sectie" still selected. No section, save,
preview, upload, recovery or publish control was activated. Browser-computed
body uses the canonical family and17px. This is native owner-login UI evidence,
separate from synthetic transport tests. The browser inspection tool does not
expose network timing/requests; no native endpoint/status trace is asserted.
The no-membership-dependency claim additionally rests on reviewed unchanged
client flow and its explicit negative transport regression, not a manufactured
native false-membership account. Native end-to-end email registration/recovery
on the eventual hosted candidate remains distinct.

## Required quality evidence

- One clean build, full unit/HTTP/security and dependency gates on the final head.
- All existing browser cases and five mandatory typography profile partitions;
  the original113 V3 cases plus website entry/return and shared-role regressions.
- Exact original54 Lighthouse samples plus6 for the new route, preserving
  performance>=90, LCP<=2500ms, CLS<=0.1 and TBT<=200ms.
- Unchanged real HTTP cache, CSP, media playback, private Journal/Radar payload,
  dictionary666-key retention and permanent internal-Radar publication guards.
- Public extraction/runtime contract review, with existing language findings
  retained open and no automatic baseline promotion or human-language claim.
- The same immutable artifact in every partition, with final hashes, file count
  and non-file checks. A fixture, earlier branch or partial pass cannot replace it.

## Status and remaining external evidence

Integration and targeted verification are in progress. No final candidate test
counts or GO decision are asserted yet.

First complete local unit run:329 cases,327 passed,2 failed,0 skipped. Both
failures exposed stale test fixtures: the protected immutable Radar reference's
cache version and an H4 assumed to exist in initially gated content. The source
reference remained unchanged; tests now retain its correct identity and use
explicit H1–H4 DOM probes with independent numeric expectations. The23 affected
cases then passed. A fresh complete run remains required.
The second complete local run passed329/329 with0 failures/skips. A subsequently
added CI-partition regression passed1/1 separately; exact-head CI must run all330.
Artifact security/public-content policy also passed at this checkpoint.
The subsequent complete local run passed330/330,0 failures/skips. That
203-file local package totalled52,469,703bytes; its canonical content-manifest
SHA-256 is `eb88a2e64fc88d4f43620a7bef4e0552c317183f627497defd8a726a9e3c70f8`.
The staged-change Gitleaks8.24.3 scan found0 secrets; pnpm11.25.0 dependency
audit found0 advisories. These do not replace final Git-history/CodeQL CI.
Final new-file newline normalization removes six bytes across app, logo and exercise HTML;
no interior code changes. The reviewed app-only extraction hash is refreshed,
HTML inline inventory remains identical and four pure models stay byte-identical
to V3. The previous receipt is retained; final artifact identity is recorded after
the last rebuild.
Final local public content identity:203 regular files,52,469,697bytes, canonical
manifest SHA-256 `2b772001d69f192e059836fb89042796bb678f28d04e1b93be63c7b472d240b0`.

The first128-case exercise run was interrupted after the new website-entry
fixture encountered the real cookie dialog. The fixture now performs an actual
refusal through the existing UI. A subsequent15-case selection passed13 and
failed2 Firefox cases at deferred-document readiness after navigation. The
correction explicitly awaits DOMContentLoaded after each real navigation,
retaining the45s test and5s assertion limits. Original direct-visit V3 cases
already await document load. Failed traces/results are preserved; no retry or
timeout was widened, and a fresh run is required.
The corrected Firefox entry/return/type selection then passed3/3. This does not
replace the mandatory full128-case integrated journey run.
The next complete integrated run finished127 passed/1 failed,0 skips/flaky:
desktop WebKit hit its32,767-physical-pixel screenshot limit after all tablet
functional assertions passed. The tablet capture now reuses the existing native
overlapping-tile helper, keeping viewport/DPR and every assertion/timeout. All3
desktop tablet reruns passed. Independent inspection confirms22 actual
1536x2048 PNG tiles cover all16,546CSS pixels without gaps. This is127/128 plus
3 targeted reruns, not one clean128-case run; CI still requires the complete set.

The exact registered browser inventory is2,838 unique cases. Independent list
comparison verifies a disjoint union:985 base,1,725 typography (345 per existing
profile) and128 journey cases. No missing, extra or duplicate cases remain.
A first comparison exposed740 duplicated mobile cases because project-level
tablet exclusions overrode global partition exclusions; the narrow inheritance
fix preserves the full inventory and tablet policy. The first list filenames
were overwritten during regeneration, so only its observed diagnostic receipt,
tool output and independent confirmations remain; original failed list JSONs
are not claimed retained.

CI now requires a separate journey partition over the same frozen artifact,
alongside all five typography partitions, before Website quality gate proceeds.
Every partition retains final artifact hash/count/type checks. This avoids
duplicated work and preserves the45-minute job limit; it does not promise a
runtime or constitute a completed CI pass.

Actual NL/FR HubSpot iframe text was previously measured outside the approved
type contract. Website CSS cannot establish compliance inside that iframe.
After the sponsor signed in, read-only account UI inspection confirmed the
published Dutch ECA form `97bca96a-12a6-4542-a5a1-e915d4371a2b` in portal
`149675328`. Share > Embed code generates the same current
`js-eu1.hsforms.net/forms/embed/149675328.js` plus `hs-form-frame` markup.
The adjacent Developer code (Advanced) tab visibly carries a padlock and cannot
be selected, while the standard Embed code tab works. Thus the requested
developer renderer is unavailable through this account UI; a generated developer
embed was not obtained. No exact subscription tier or upgrade price is inferred.
No form/consent schema is guessed. No form was submitted and no editor, provider
setting, subscription or production configuration was changed. Synthetic provider
fixtures prove host flow only. The actual provider-font divergence remains open.

The sponsor's V3 acceptance is recorded as product-demo acceptance. It does not
establish task-observation scores, cross-executive validation or real business
value. Those remain separate from technical integration quality.

Read-only GitHub inspection confirmed main still at `b1831e2`, protected. Its
14 November scheduled Dutch scan `43570124284` started at07:14:06Z and failed
before extraction/measurement: "JavaScript extraction contract changed: review
adapters and regenerate contract via PR". Downloaded artifact `14104067393`
contains FAILED with unknown block/new-finding counts, not a completed empty
scan. The reviewed candidate contract addresses this existing dependency as well
as new exercise sources; that repair still needs a fresh complete scan.

Production remains on its existing release. No main merge or deployment is
authorized by this candidate.

## First exact-head CI and scoped repair

Draft PR82 head8787006 completed run43580965630. Build preparation, Secrets
history gate, JavaScript security gate and the complete128-case journey passed.
Each of the five typography profiles passed324 and failed the same21 cases;
the mandatory Website quality gate correctly blocked before base/performance.
The failed run is retained rather than retried as acceptance.

Eight cases classified two explanatory case-card paragraphs as their ancestor
button's15px control text. The approved prose role is17px; the finite scoped
body selector preserves that role and nearer control/metadata precedence.
Thirteen deep Journal/Radar cases lacked a synthetic member entitlement after
the content became gated. Only those deep-content tests now use the existing,
previously public historical publication fixture through ordinary fetch,
integrity validation and rendering. Anonymous inventory, real cache and access
denial tests remain separate and unchanged. The typography checkout retrieves
full history for that already-pinned archive. No public style or access rule is
changed. All21 repaired cases plus the strengthened existing nested-role case
passed in Chromium;15 targeted units passed. Inventory remains2,838; fresh full
CI on the repair commit is required.

Independent artifact comparison verified the original CI tar checksum and203
manifest entries. CI is52,469,693bytes; local v3 is52,469,697bytes. Four files
each have exactly one local CRLF versus CI LF: member-menu.js,
member-registration.css, bundled models.js and radar-preview.css. Their
normalized bytes/hashes match exactly;199 other raw hashes match. Local v3 is
not claimed raw-byte-identical to CI. CI's own immutable-artifact checks remain
authoritative for release.

The complete local Dutch scan on8787006 checked441 changed/new blocks without
engine/extraction errors. It reports108 new identities:65 match old text/rule/
offset/length tuples at new locations,43 are new tuples requiring context or
editorial review. All3,668 prior finding records remain exactly unchanged in
the3,776-record candidate. No register promotion or human review is invented.
