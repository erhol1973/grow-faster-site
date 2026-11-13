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

The initial stronger actual-font probe check found Windows Segoe UI and
Segoe UI Semibold. The recorded PostScript face identifies Semibold as the
weight variant, rather than evidence for changing the approved font stack.
The final check compares each role's actual face to an independent reference
at the same weight/style, including family name, PostScript name and custom
font status. It does not use an arbitrary font-name alias allowlist.

Source-only accessibility follow-up preserves the simulator's three CMS
identities while correcting H2-to-H4 jumps to H3. Its production table
renderers now expose row/column scopes, keep empty corners non-header cells
and preserve all numeric cells. Five source/delivery/semantic tests pass.
This follow-up still needs the orchestrator's final rebuilt-artifact checks.

These selected results do not establish complete route/state, cross-browser,
provider-form or release acceptance. Interrupted and failing earlier runs
remain diagnostic evidence.

## Live HTML book reading surfaces

The HTML book readers retain their 22/12 pages, fixed page aspect, English
publication content and animated flip navigation. Canonical type sizes can
make a page's text taller than that canvas, so each live `.pg` is a labelled,
focusable native scroll region. Page children cannot shrink to hide text;
long headings can wrap. A visible scroll hint and normal scrollbars explain
the interaction. Zoom keeps the page interactive, while stage dragging starts
only on its surrounding background.

While a page region is focused, vertical arrows, Page Up/Down, Home/End and
Space retain native reading-scroll behavior. Left/Right still turn pages.
Document-level Home/End still navigate to the first/last page, and existing
touch-friendly navigation buttons remain available. Decorative thumbnail
copies render at 600px page width and are visually scaled into their 92px
preview; they remain hidden from assistive technology and inert. This is a
rendering transform, not a smaller typography token.

PageFlip 2.0.7's mouse/touch flip handlers are disabled (`useMouseEvents:
false`, `mobileScrollSupport: true`) because its global touch handling can
otherwise prevent native scrolling inside a page. Corner dragging is replaced
by the existing arrow controls and keyboard flips; the reading hint reflects
that tradeoff. The application also removes the engine's resize listener
before rebuilding a book, since that vendor version removes it only when its
mouse handlers were enabled. The vendored library and PDF assets are unchanged.

Native wheel/touch scrolling, every internal page and zoom state still require
the final browser regressions. The source-only changes do not imply that those
checks have passed.

The diagnostic heatmap has its own named, focusable horizontal scrolling region
so its columns remain reachable in natural-height mobile text view. Horizontal
keys stay in that chart while it has focus, rather than turning the book.
The book and page touch policies permit horizontal/vertical gestures and native
pinch zoom; the viewport does not restrict user scaling. Chapter badges occupy
their own row, leaving the full heading width available. English headings use
normal word boundaries and automatic hyphenation rather than arbitrary word
chopping. Book page footers/search metadata use the shared metadata role;
semantic small text, superscripts, subscripts and diagnostic labels use the
shared label role. Ordinary publication prose and real headings retain their
canonical sizes.

## SVG coordinate systems

An SVG `font-size` is measured in drawing units, which its `viewBox` can
enlarge or reduce. Assigning raw `12px` inside a 100-unit drawing rendered
436px wide produced approximately 52 physical base pixels in a book chart;
matching the raw computed value therefore did not prove consistent labels.

The shared `assets/typography.js` is the first deferred runtime. It scans
already-created inline book graphics and observes later application output.
For genuine SVG text and BPMN `foreignObject .bp-lbl` diagram labels, it
converts the common 12px label token into drawing units using the local
layout CTM's vertical basis length. Every layout read is batched before font
variable writes. Resize observation and narrowly filtered SVG coordinate
mutations cover added graphics, resizing, group transforms and changed
viewBoxes; the application's own style/marker writes are not observed.
Detached SVG viewports are unobserved. Outer book/user zoom remains effective
because it is not included in that layout conversion.

Each text-bearing drawing keeps a minimum canvas of 600px or its larger
authored viewBox width inside a named, focusable two-dimensional scrollport.
Existing BPMN scrollers are retained so animation-following controls still
operate on the same parent. The runtime does not reduce label tokens to fit
a box. Independent browser evidence must record raw drawing-unit size,
layout scale, effective base size and glyph/foreignObject bounds.

Before normalization, authored SVG font attributes remain in effect rather
than receiving a blanket 12 drawing-unit override. This preserves the original
graphic fallback if JavaScript is slow or unavailable; font-family remains
the common website family. This fallback is not represented as passing the
JavaScript-enhanced physical-size contract.

Windows Chromium does not automatically hyphenate every overwide English
heading. The verified overwide H1 word “Fragmentation” therefore includes
discretionary soft hyphens at syllable boundaries, retaining its H1 role and
size. The search normalizer removes U+00AD so an ordinary “Fragmentation” query
continues to match. This is typesetting, not a role or font-size exception.

## Diagram slots and fallback-font layout

BPMN labels keep the 12px physical token. Their normal/small/tall task boxes
are 82/54/104 drawing units high, providing 60/50/82-unit text slots. The
generic parallel service-task
shape has 12px more width. Both shape drawing and connection endpoints use
the same width function. Lane heights, node centres and the 1156×404 /
1210×660 canvases remain unchanged, guarded by independent coordinate fixtures.
Four real-diagram browser cases cover both diagrams in NL/FR at 390/1366px;
all 96 measured foreign-object labels passed physical-size, glyph-bound and
internal overflow assertions without retries or skips.
An additional forced-Arial diagnostic checked the same 96 labels and found no
clipped glyphs or internal overflow; it is retained separately from canonical
font-family acceptance. The 15 source/delivery/geometry regression tests pass.

A separate diagnostic with the already-approved Arial fallback reproduced the
Linux Dutch journal page 11 overflow of 27px. Allocating more width to its
longer legal-risk card and recovering card/chart spacing fixes the layout
without changing text, role sizes, line height or landscape aspect. All 120
diagnostic geometry measurements across normal/forced-Arial, NL/FR and
1366/1440px fit; forced Arial is diagnostic evidence, not a passing canonical
font-family contract. The canonical 60-sheet browser geometry regression also
passed. Final-head CI remains a separate required gate.

## Engine values and responsive reading layout

Firefox's native CSS viewport at the nominal 1349px test width resolves 6vw
and the independent H1 clamp to 80.875px, while arithmetic based only on
`innerWidth` predicts 80.94px. The audit therefore retains both analytic and
native evidence and evaluates the independent numeric contract through the
browser's own CSS engine. That reference is constructed only from contract
min/vw/max numbers, without production variables or styles. The strict 0.06px
threshold is unchanged. This is an engine used-value distinction, not a new
route or breakpoint exception.

Executive voice cards choose one, two or three columns from the actual book
content width, preventing mobile text-view clipping at the same body size.
Radar governance uses one reading column on tablets; workflow labels wrap at
spaces. The overwide Dutch compound “Voorbeeldredactiedossier” and English
“organisations” retain their heading roles, with discretionary breaks at
compound/syllable boundaries rather than smaller type. Dutch compound-boundary
breaks follow [Vlaanderen's spelling guidance](https://www.vlaanderen.be/team-taaladvies/spellingregels/woorden-afbreken/woorden-afbreken-1-regels).

Book search now maps normalized query indices back to original UTF-16 DOM
offsets. Snippets omit discretionary characters in their display copy, while
actual-page highlights preserve the source text and its soft hyphens. Pure
regressions cover both snippets and ranges, not merely finding a search hit.

## Cached asset coherence

Changed component assets and the shared typography/book-reading assets use
the explicit `v=20261113-typography` tag in every public HTML reference. The
finite source-and-build guard checks these versions without depending on Git
trust settings. The real HTTP warm-cache regression loads fresh HTML while
old component URLs remain cached, verifies new versioned asset requests, and checks
that the actual updated diagram geometry executes. Previous cached asset bytes
are synthetic markers; the new assets come from the tested build. This protects
bundle coherence without treating already-open old documents as refreshed.
