# Executive Radar and website navigation — isolated dev

The owner requested a dev implementation of the approved order: Home, Enterprise Coherence, Aanpak, Executive Radar, Executive Journal, Track Record, Samenwerken. French retains the product names and translates ordinary navigation/action labels. All existing submenu destinations, contact-to-top behavior and NL/FR remain. Mobile uses the same sequence with early responsive collapse and native accessible menu/disclosure controls.

Executive Radar is the commercial name of the fixed BAEIS demonstration. It does not become a live feed or an automated publisher. The canonical readable route is /executive-radar/; /baies-dev/ and its language/hash links remain compatible. Source-linked records, scores, executive contexts, downloads, review steps and the external publication block remain intact.

The supplied logo is the brand reference. The image producer records actual source/asset hashes, variant construction and limits. All rendered header/footer wordmarks use consistent assets, with a light/dark background variant and bar favicon. Do not replace editorial photographs, publication covers or historical screenshots with a wordmark.

## Agent coordination

Exclusive surfaces and charters are recorded in AGENT-SURFACES.md and agents/. Navigation, product and branding builders work concurrently without committing; an independent read-only reviewer audits their output. The orchestrator alone commits. The guard checks ownership coverage and runs attributed path receipts before combined commit. The preservation surface is never dispatched or modified. No CMS/HubSpot data mutation.

## Verification and publication

Build, unit/HTTP, security, browser/axe, local load and sequential Lighthouse gates retain their existing assertions/thresholds. CI also verifies secrets history, CodeQL and relevant language audit behavior. Retain failures and investigate; no retry-to-green or undocumented skips. Windows host measurements remain separate from canonical pinned Linux CI. Physical devices and actual spoken screen-reader use remain additional manual acceptance.

Source commits carry a Cloudflare skip marker until their exact PR revision passes gates. Only an isolated non-main dev-preview branch with an identical tested tree may be deployed after green checks. The PR remains draft; no merge into main, production deployment, account configuration change, public CMS write or HubSpot action is authorized by this task. Preserve the production baseline commit 9f3a0ddbd7fa0d3dc548a2ba17b66a816f946d10. Retain results under output/executive-radar-nav outside the public build.

A dev-only early performance job runs the navigation/axe browser subset and then the unchanged complete Lighthouse script on its own isolated runner, parallel to the full release workflow. It improves failure feedback after the measured logo-transfer regression; it never replaces the complete Website quality gate. Compact source-traced wordmarks and native lazy/low-priority loading reduce critical transfer. Native lazy loading can legitimately request the navy logo in the initial white desktop-header phase; regression coverage checks one cached request per variant, correct visible variants and preserved dimensions instead of assuming that phase never occurs.
