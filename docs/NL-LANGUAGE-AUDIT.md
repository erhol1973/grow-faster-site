# Daily Dutch language audit

The separate `Daily Dutch language audit` workflow runs at **08:07 Europe/Brussels** (DST-aware GitHub schedule), and supports Run workflow. GitHub schedules are best-effort, not an exact-time guarantee. Schedules start only after this file reaches the default branch. GitHub may disable schedules in inactive public repositories; check the Actions page if reports stop. This workflow never deploys, writes repository contents, edits CMS data, or calls ChatGPT/Library. It uses only `contents: read` and does not retain checkout credentials. Existing three release gates and protected main remain unchanged.

## Engine and reporting

An ephemeral own LanguageTool 6.6 server runs on loopback port 18081, using the official ZIP verified by SHA-256. No requests go to the free public API, and redirects and arbitrary engine hosts are rejected. Java is supplied by the GitHub Ubuntu runner. This is the open-source engine, without cloud AI/Premium rules. A paid API is **not implemented**; adding it requires an explicit authorised endpoint and secret configuration, not a fallback. The ZIP digest was calculated from the official HTTPS download, not a separate vendor signature.

Every run uploads `nl-language-audit-<run>-<attempt>` for 90 days, with JSON, Markdown, engine logs and, only after a complete scan, a candidate baseline. Setup failures also produce an artifact and job summary. `FAILED` means incomplete scan, `FINDINGS` means new machine suggestions, and `PASSED` means no new machine suggestions within the stated scope. Findings and failures fail the job, enabling normal GitHub Actions failure notifications according to the subscriber's notification settings. No email/issue is sent by this workflow.

LanguageTool is a detector, not an official language authority. Suggestions need assessment against official Taalunie spelling and accepted Belgian Standard Dutch. Machine receipts never create a human approval. A human review must identify reviewer, date, evidence/reference and exact content hash; a hash match by itself is insufficient.

## Scope and fail-closed coverage

Build `dist`, then discover **every built HTML file** and inspect its locally rendered Dutch DOM (including hidden NL content), full paragraph/headline/label context, alt/title/aria-label/placeholder, page title and description. Inline formatting stays inside its sentence. Also extract all Dutch values from runtime I18N/I18N_HTML and ECA dictionaries, including text not visible in the initial state. External requests are blocked: no analytics, forms or production requests. New pages are discovered automatically. Empty inventories, page errors, non-Dutch locale selection, missing Dutch dictionary values and disappearance of previously scanned pages fail the scan. DOM location plus page/kind is the block identity; dictionary identity is its key. DOM insertions can cause additional conservative rechecks.

All shipped `.js` files and inline scripts are covered by an exact, LF-normalised SHA-256 extraction contract in `language/nl-extraction.json`. Any addition/removal/change blocks scanning until extraction adapters and coverage tests are reviewed in a PR and the contract updated. This intentionally includes vendor/behaviour-only JS: a conservative failure is preferable to silently missing a newly introduced text path. Updating fingerprints is **not** language approval. Baseline history also records inventory coverage. Removed blocks retain historical findings and are never marked corrected.

Explicit exclusions: the dedicated French `journal-fr.html`, both English book readers under `boek/`, and legacy refresh redirects. PDFs, images, text inside book/journal page images, live CMS/HubSpot content, third-party form states, canvas text and interactive states not represented by the initial DOM/dictionaries are **not covered**. This is `rendered_local_nl_and_runtime_dictionaries`, not a claim of exhaustive `source_nl_inventory` or live-site coverage. Runtime-only JS text outside those states is protected by the extraction-change guard, not exhaustively extracted. Extending scope requires fixtures for the new adapter/state. Noscript text is excluded.

### Reviewed coverage extension, 11 November 2026

After integrating main's Contentstudio changes, the inventory also reads the committed `GF_CMS_CATALOG` as strict JSON data: Dutch text and nonempty media-alt defaults, with route/section/field provenance. It does **not** authenticate, open the editor, read drafts or fetch live publication overlays. `admin.html` is explicitly excluded. Source fallback and committed CMS defaults may differ from the currently published CMS content; no live-CMS language coverage is claimed. CMS auth, recovery, save/publish, upload and media-signing requests remain blocked. The browser accepts only local GET/HEAD; inert script parsing blocks all network requests.

Dutch email templates in `data-mail-nl` contribute decoded subjects and complete body paragraphs without clicking mail links or sending messages. Malformed URI encodings and duplicate subject/body components fail the scan. SVG text labels are inventoried separately instead of concatenated into fictitious words. Other counter-fragment composition and exhaustive ECA interaction-state checks remain outside this extension.

New finding IDs hash an unambiguous JSON tuple. Exact prior findings retain their existing IDs; no previous finding is deleted or marked corrected because extraction changes or text disappears. Historical extractor-noise findings remain traceable in the ledger.

`language/nl-triage.json` contains advisory agent triage of the original 2,221 locations / 760 text-rule combinations, not human approval or a suppression list. Only three Dutch euro-spacing values (including matching static CMS defaults) and two Dutch month-name occurrences were corrected initially, supported by [Taaladvies.net](https://taaladvies.net/euro-of-eur-of-euroteken/) and [Team Taaladvies](https://www.vlaanderen.be/team-taaladvies/spellingregels/hoofdletters/hoofdletters-09-namen-van-dagen-feestdagen-periodes-en-historische-gebeurtenissen). Brand terms, contextual false positives and disputed suggestions stay open. Human review fields are not invented.

## Versioned baseline and register

The earlier ChatGPT Library baseline and register were not accessible as attachments, repository files or connected tools. No reviews or findings from that register have been guessed or overwritten. The repository starts a separate machine baseline with an explicit provenance note. Import the earlier register by a reviewed PR when its actual file is available; preserve its original evidence and distinguish human review from machine results.

Baseline schema 1 records exact text, content hashes, machine-engine receipts, optional evidence-bound human reviews, coverage, historical findings and an append-only parent digest chain. Source commits must exist in the full checkout and be ancestors of the scanned revision. Unknown/divergent commits, malformed blocks, duplicate IDs, broken receipts or unsupported review claims fail closed. An unchanged block skips machine rechecking only because of a prior successful machine receipt, not because it was officially approved. Engine-version changes recheck all blocks. Without a baseline the first scan checks everything. New/changed blocks are sent whole, sequentially; identical full text is checked once per run. Oversized blocks fail, never truncate.

The scan does not persist automatically. To promote a **complete** scan on a branch:

1. Review the JSON report and candidate. New suggestions can remain open; promotion is not language approval.
2. Run `node scripts/nl-promote.cjs reports/nl-audit/candidate-baseline.json`.
3. Review the resulting diff and submit it through protected-main PR checks. The command rejects stale parent digests, divergent history, removed/altered findings and newly invented human approvals. Failed scans emit no new candidate. Never use artifacts from untrusted forks as a trusted baseline.

Until a candidate is promoted, the same differences remain pending and will be rechecked/reported. No automatic write-back, hidden cache, expiring artifact or previous green workflow is a source of approval. The register in Git survives artifact expiration. Close or adjudicate findings only through a reviewed register change with evidence; disappearance/deletion alone is not resolution.

## Verification

Regression tests cover full sentence context, hidden Dutch text, exclusion of French, metadata, changed/unchanged/deleted blocks, missing review evidence/receipts, divergent history, public API rejection, malformed/failed/oversized engine requests, stale promotion and preserved findings. The independent daily workflow also exercises the real local engine and browser inventory on PRs touching its files. Existing build/unit/security/browser/load/performance and CI release gates remain required before any publication. No production publication is part of this change.

Sources: [GitHub scheduled workflow semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [LanguageTool public API automation restriction](https://dev.languagetool.org/public-http-api.html), [own LanguageTool server](https://dev.languagetool.org/http-server).
