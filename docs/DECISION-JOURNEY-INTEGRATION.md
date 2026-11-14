# Website and decision journey integration — 14 November 2026

This candidate combines member `3ccf89edcfc9edf8ce64d3939e572d2616d79f0c` and typography `9f3462a598ed96e271c112176590abce9b63fce4`, with main `b1831e2883d162b686b4183ad852e3c768b5b989` as their common base. Sponsor approval permits quality fixes and integration; it does not permit a production release. Original V1/V2/V3 demo source trees remain unchanged.

## Route and data boundary

`approach.html#decision-journey-entry` opens `/decision-journey/?lang=nl` or `?lang=fr`. The journey's `#site-return` returns to `../approach.html?lang=<nl|fr>#decision-journey-entry`. Only this language code enters the URL. The six-stage fictional exercise remains local, without persistence, member bootstrap, analytics, AI calls, CRM or backend. Its own CSP keeps connections disabled. Member eligibility, RLS, owner access to the standalone CMS and the private Journal/Radar boundary remain separate contracts.

The app adapter adds URL language initialization and the fixed return link. Two Dutch/French selection counters became inert literal `{n}` templates with ordinary string replacement so the static language adapter never executes application code. Model, roadmap, value review and case files are byte-identical to accepted V3.

## One typography and delivery contract

The approved typography branch is authoritative: Aptos primary, locally supplied Hanken Grotesk fallback, body 17px and the existing responsive heading scale. Member pages use this same policy. The former member-specific inline typography helper is superseded, rather than shipped as a parallel policy. The accepted native scrolling, cache and member publication behavior is retained.

Small allowlisted component styles retain exact bytes at their authored cascade positions. CSP documents, additional stylesheet attributes, relative resources, imports and styles over 16KB retain external delivery. Closing-style injection is rejected. The finalizer rejects duplicate or behavior-bearing canonical type links and puts one external versioned canonical policy last. It preserves component order and CSP text. Journey/account/admin CSP metadata precedes scripts and styles.

## Coherence runtime and retained dictionary

The original 666 retained keys remain the unchanged prefix, SHA-256 `86d82e745e11fb30056fb0b4a25d35c2a5065b97e72cff9d71350833802d6017`. Neither the count nor its oracle was relaxed. The runtime family is explicitly: site, models, consent, ux, refinements, coherence-film, coherence-layout, cms-config, cms-client, cms-public, member-auth, member-menu and typography JS.

Existing dynamic translation and escape handling remains pinned by the runtime contract. The merged site runtime adds bounded literal Dutch/French journey-entry copy, not a computed translation lookup. Typography normalizes SVG role sizes and scroll regions; it reads existing title/ARIA text and has one literal Diagram fallback. It introduces no translation API or computed dictionary key. Member auth/config and bundled controller guards retain their fail-closed behavior. Contract hashes were refreshed only after this source classification; negative fixtures still reject new family members, changed runtime, escaped/unretained keys and a reduced original prefix.

The Dutch audit inventories every emitted JavaScript file, including all five journey modules, and inline HTML scripts. Its inert journey adapter extracts the three committed NL interface declarations, literal overlays and literal language notices only. It rejects missing branches, executable values, lookalike anchors and unsupported mutations. Initial rendered DOM and these interface labels do not prove coverage of every case, generated plan/report or user-entered state. Private publication bodies remain excluded. The extraction inventory was regenerated from the parent's fresh 203-file build: 36 JS files and 37 HTML inline-script inventories. This is distinct from language approval or baseline promotion.

Relative to the previous extraction contract, six JS entries are new: typography and all five journey modules. Two JS entries change: site (bounded NL/FR entry labels and link) and the private-runtime interface module baies-dev-app (existing translation boundary preserved, scroll region enhancement added). No JS entry is removed. Four journey model/case entries match accepted V3 exactly; the app changes are bounded above. Twenty-five existing HTML inline inventories change and one journey HTML is added; no HTML entry is removed. These inventories cover member controller/menu bundling and added empty external-script elements as parsed by DOMParser, not stylesheet text. External scripts are separately inventoried. Full old/new hashes are recorded in `reports/integration-extraction-delta.json`; unexpected later changes still block scanning. The inert parser aborted every network request and did not load any application route. Its first restricted launch failed with EPERM; the authorized native parser launch succeeded. No baseline file was written.

The scheduled main audit on 14 November failed at extraction-contract validation before block extraction/LanguageTool. That failure supplies no new language finding count. The existing 3,668-finding register (9,176 blocks, zero human reviews) remains unchanged. No finding is silently accepted or removed.

## New route transfer budgets

These are new-route limits approved by the CPO; existing website asset limits and performance thresholds remain unchanged. Original V3 source bytes and integrated bytes were measured directly, without minification or a new dependency.

| Asset | Original V3 bytes / SHA-256 | Integrated bytes / SHA-256 | New limit |
| --- | --- | --- | --- |
| app.js | 66,766 / `6589de43fdf9213b86b41d6665bf4e7b999b3bb178be5ed4ac31d5f784f7f69f` | 67,114 / `c468e4cc2d1e668acb3b2a276c884045f587a080a877795ec1da141c4c88e1d0` | 70,000 |
| canvas.css | 27,273 / `64d81cd623ccbd5de508a592ed6b4f112675006051c0e2f297ee215b4de4eefa` | 25,343 / `e72acb73826ffb4ba4acd682804dedba928d2476e82b7b0eae534e230b90df23` | 26,000 |

The app delta is +348 bytes for the bounded website/inert-copy adapter after removal of one extra EOF newline. The final formatting pass changed no interior script bytes or behavior; the extraction contract's app hash alone was refreshed. Journey HTML inline-script inventory remained identical. Design consolidation removes duplicated typography from the journey CSS, a -1,930 byte delta. The earlier 65KB app/22KB CSS estimates were below the accepted layout and were never existing release contracts. Limits leave a small explicit margin above the reviewed actual assets.

Pure-module SHA-256 equality with V3:

| File | Bytes | SHA-256 |
| --- | --- | --- |
| model.js | 8,095 | `394343a4ed16e5cfe51e6832837acd27d5d7102e1ccc0a9973ac903dbe5bac20` |
| roadmap.js | 18,110 | `ccf0cf1bb4480fb25d98dfe3c2198d8a566114569a76904811fc32e92954bea7` |
| value-review.js | 20,113 | `0d7a56d1fd16e8a0115d3bf17e7aa40e8ab5cd97483e49d8a8aada9eabb14cb4` |
| cases.js | 15,707 | `3aa323883079187402334b0ee7decf45b4b83dcdf649246ca5bb59319e825c81` |

## Verification boundaries

The software producer's targeted merged suite passed 115 tests, zero failures or skips (`reports/integration-targeted-unit.xml`). The builder emitted 203 files and the heuristic artifact security check passed at that checkpoint. These are targeted implementation receipts, not release approval.

All original 54 Lighthouse samples remain; the new route adds six at the same thresholds (score 90, LCP 2,500ms, CLS .1, TBT 200ms). Parent integration verification owns the frozen-build full unit, browser, real HTTP cache, load, 60-sample performance and language runs. Original 113 V3 browser cases are retained, with 15 website-entry/type cases added. Tablet cases remain registered only in the three desktop engines through explicit mobile project exclusions. Browser assertions, retries and timeouts were not weakened. Provider-native roles, credentials and public deployment verification require actual evidence and cannot be inferred from fixtures. Production remains unchanged.
