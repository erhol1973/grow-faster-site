# BAEIS Design System v2.0 — Work package B

Isolated development only. Baseline: Work package A / PR #64, commit `da86b1aee1840b5915b34b601a4a6cc62c655f85`. Derived branch: `dev/baeis-design-v2-workpackage-b`. Target the Work package A dev branch; never merge into main or publish production.

## Header and navigation

- Separate navy Grow Faster brand header using the approved transparent white-wordmark SVG, with explicit native-language NL/FR buttons and a clear selected language.
- Separate BAEIS product navigation. Desktop shows all five destinations; mobile uses an accessible disclosure with the current section, 44px-or-larger targets, localized labels, Escape/focus restoration, outside-click and focus-out dismissal, and responsive focus recovery.
- All five destinations are ordinary fragment links: `#overview`, `#radar`, `#evidence`, `#editorial`, `#about`. The roadmap remains available under Over BAEIS / À propos de BAEIS, including all four sprint explanations and the no-send consent prototype.
- `?lang=nl` and `?lang=fr` make locale-specific screen links shareable. Back/Forward and reload restore the route/locale. Unknown hashes or unsupported languages fall back safely to overview/NL. Navigation updates the document title, active link and destination-heading focus.
- Switching sections or locale preserves in-memory filters, review stage and form values. URL state contains only the locale and section; no form data is added, stored or sent.
- With JavaScript disabled, all static sections and native navigation links remain readable. Interactive filters and translation require JavaScript and are identified as such.

## Scope

Only `baies-dev/index.html`, `assets/baies-dev.css`, `assets/baies-dev-app.js`, the two BAEIS test files and this document change. Logo files, the evidence dataset/core, production pages/CSS, CMS data, HubSpot, shared workflows and thresholds remain unchanged. The actual four-sprint model and publishing prohibition are preserved.

## Verification

Retain the full general gate and the existing dedicated BAEIS gate. New browser regressions cover direct FR screen links, Back/Forward/reload, filters, explicit locale state, review/form preservation, mobile touch/keyboard operation, focus when resizing, menu axe scanning, invalid routes/locales and no-JavaScript reading. Existing functional and locale/axe cases remain, with navigation helpers updated to operate the real mobile disclosure and native links.

The first local regression caught loss of keyboard focus when CSS hid an active desktop link before the media-query event. Navigation remembers its last focused control and restores focus to the visible control on the new layout. The unchanged assertion verifies both directions. A separate Windows Firefox startup resize timeout happened before app navigation and is retained as diagnostic evidence; it is not a passing run or a reason to increase timeouts.

Before a dev preview, require green build, unit/HTTP, browser/axe, security/audit/history/CodeQL, local-load and repeated Lighthouse gates on the source commit. Implementation commits use the Cloudflare-specific CF-Pages-Skip prefix. Activate only an isolated branch preview of the validated tree and perform a limited read-only smoke check afterward. No main merge, production publishing, HubSpot or external application publication is authorised.

Physical-device and real screen-reader speech checks remain manual limitations. Local load and Lighthouse lab measurements do not prove field performance or production capacity. Preserve reports and failures under `work/baeis-b-*` and GitHub artifacts.

The expanded mobile coverage also checks 320px reflow. A long pre-existing Dutch hero word made the grid exceed that width; BAEIS-only mobile grid sizing and normal word wrapping now prevent horizontal page overflow without reducing text size. The last local Chromium desktop/mobile run passed all 22 cases. Screenshots at 320/390/768/1440 confirm the header and translated navigation layouts. Dedicated Linux CI remains authoritative for the complete five-profile, axe, load and performance gates.

The app owns history scroll restoration so Back/Forward places the focused destination heading below the sticky product navigation instead of restoring a stale scroll offset from another section. A scrolled-route regression checks this with preserved filters.

Native skip activation preserves the selected product screen and focuses main content without adding a history entry. Route changes close any transient evidence dialog before restoring the destination focus. Header/navigation links use tabindex=0 (no positive order) so keyboard links remain reachable under the existing WebKit browser configuration. A regression exercises skip and history with an open evidence dialog.
