# Website typography contract

## Evidence and consolidation choices

The existing website stack is Aptos, Hanken Grotesk, Segoe UI, Helvetica,
Arial, sans-serif (`assets/site.css`; also recorded in
`docs/BAEIS-DESIGN-V2-A.md`). No new font is introduced. Aptos Display,
Georgia/Times journal styling, the homepage system stack, admin Inter and
reader Carlito are component divergences, now superseded by the one shared
stack. `assets/journal.css` explicitly assigned Georgia to `.career h2`
and `.career-list b`, explaining the supplied transformation screenshot.

`assets/typography.css` is the authoritative CSS source and is loaded after
component styles on every nonredirect HTML document, including the admin,
readers and executive radar. The build also copies the latter to its
existing `baies-dev` alias. PDF files and book-page images are unchanged
publication assets; their printed text is not website DOM typography.

| Semantic role | Size | Basis |
| --- | --- | --- |
| Ordinary body/prose | 17px | Existing global body |
| H1 | clamp(40px, 6vw, 86px) | Existing global hero consolidation |
| H2 | clamp(32px, 4vw, 54px) | Existing global section-heading consolidation |
| H3 | 24px | Consolidation choice; existing component rules disagreed |
| H4 | 20px | Consolidation choice; explicit lower level below H3 |
| Supporting label | 12px | Existing compact metadata/eyebrow convention |
| Supporting metadata | 14px | Existing compact secondary-text convention |
| Form control | 15px | Existing control convention |
| Highlighted numerical metric | 32px | Consolidation of existing metric components |

All headings and their nested spans/emphasis/links use the same role size.
There are no route- or language-specific heading exceptions. H1/H2 change
continuously with viewport width within their clamp bounds, identically on
every route. H1 reaches its upper bound at 1433.33px, H2 at 1350px; their
lower bounds end at 666.67px and 800px respectively. H3/H4/body do not vary
by breakpoint. Component spacing, colours, weights and intentional italics
remain separate concerns.

The shared sheet deliberately uses `!important` for font-family and semantic
size invariants. This is an explicit boundary over the existing unlayered,
high-specificity and inline component CSS, not an accidental specificity
contest. Components must not add their own important font declarations.
Existing component font-size priority flags were removed without changing
non-typographic priority. A permanent source guard rejects reintroducing
font-family/font-size/font shorthand priority outside the policy sheet.
Ordinary direct text defaults to the body role. Small labels, metadata,
controls, navigation and numerical metrics have finite explicit selectors
in the policy and the
independent test contract. A new supporting role can use
`data-typography-role="label"` or `"metadata"`; ordinary prose must not be
reclassified to hide a deviation. Genuine H1–H4 elements stay heading roles.

## Regression evidence and remaining coverage

`tests/typography-contract.json` records independent expected numeric sizes.
`scripts/typography-audit.cjs` enumerates actual built HTML rather than relying
on the incomplete sitemap. `tests/browser/typography.spec.cjs` visits every
nonredirect built document in NL/FR at 320, 390, 768 and 1366px, records visible
text family/size/weight/line-height with roles, fails on unexpected families,
heading/body/label sizes and document horizontal overflow, and preserves
route screenshots before any assertion. Chromium additionally records
platform-rendered font samples and controlled Latin probes, verifying one
effective family across normal, bold and italic in the test environment.
Old English preference/URL fallback is separately checked;
existing English publication assets remain English.

Run after `npm run build`:

```
npm run test:e2e -- tests/browser/typography.spec.cjs --project=chromium
```

`TYPOGRAPHY_WIDTHS` accepts comma-separated widths for expanded boundary and
320px reflow checks; it does not alter the expected contract. The permanent
tests include clamp boundaries, all five radar views, all 15 journal pages
in both languages and zoom, open navigation and consent, and nested prose/
heading/supporting-role specificity. A diagnostic measures all thirty
journal sheets before asserting fit, retaining every page's child geometry.
Journal role sizes require tighter margins, padding and line height within
the existing fixed landscape canvas; no font-size exception or publication
content/aspect-ratio change is introduced.
This is not a claim that every interactive state has been exercised.
Authenticated local CMS fixtures, complete form states, consent variants, real allowed test-account
states, complete breakpoint boundaries, cross-browser screenshots, axe,
load/performance and final-head CI still require their own recorded results.
Cross-origin forms cannot inherit a parent document stylesheet. CSS family
equality alone does not prove identical installed fonts or complete Unicode
coverage; inspect actual-font attachments and any glyph fallback separately.

No release, merge, deployment or zero-deviation claim is implied by these
files. Browser launch in the restricted local environment returned EPERM;
the first baseline attempt is failed environment evidence, not a passing
typography run. The orchestrator owns the final test record and release gate.

## Local measured progress, 13 November 2026

The final selected Chromium run recorded all thirty NL/FR journal sheets at
1366px and 1440px: sixty geometry measurements, all within the unchanged
one-pixel overflow/footer threshold. The original landscape canvas and
publication order remain intact. Wider four-card presentation, compact
editorial margins and chart labels recover space without reducing role
sizes. The nested heading/prose and explicit label/metadata regression also
passed. The three source/delivery guard tests passed.

The stronger actual-font probe check found two platform family names on the
selected transformation route. This remains an unresolved diagnostic until
the recorded faces and their relationship to the approved stack are reviewed;
matching computed stacks alone are insufficient. These selected results do
not establish complete route/state, cross-browser, provider-form or release
acceptance. Interrupted and failing earlier runs remain diagnostic evidence.
