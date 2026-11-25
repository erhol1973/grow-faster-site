# Grow Faster project instructions
## Productgovernance en productiepoort (verplicht)

Lees vóór nieuwe productfuncties, architectuurinvesteringen, automatiseringen of releasebeslissingen de canonieke instructies in [docs/governance/CONTROL-TOWER.md](docs/governance/CONTROL-TOWER.md), [docs/governance/OPERATING-MODEL.md](docs/governance/OPERATING-MODEL.md), [docs/governance/DECISION-REGISTER.md](docs/governance/DECISION-REGISTER.md) en [docs/governance/CPO-PRODUCT-INVESTMENT-CRITERIA.md](docs/governance/CPO-PRODUCT-INVESTMENT-CRITERIA.md). Controleer bestaande GitHub-werkitems vóór nieuw werk, en respecteer de onafhankelijke review en de twee actieve hoofdwerkstromen.

**Een productierelease vereist altijd voorafgaande expliciete GO van de Executive Sponsor.** Als mergen naar `main` automatisch productiedeployment veroorzaakt, vereist ook die merge vooraf dezelfde GO, ongeacht of het om code of documentatie gaat. Toestemming om PR's te mergen is geen algemene productieautorisatie. Alle bestaande CI-, security- en acceptatiegates hieronder blijven ongewijzigd van kracht. Orion heeft eigen bindende Poort 0 en bouwstop; wijzig die niet via deze repository.


Read `docs/TESTPLAN.md` and `docs/RELEASE.md` before changing release or test behaviour.

Keep tests in version control. Every bug fix and new user flow must include appropriate lasting regression coverage. Extend the relevant unit, HTTP integration, browser/end-to-end, load or performance layer; do not duplicate a scenario in every layer merely to increase counts. Preserve useful positive and negative cases. Remove obsolete or redundant tests only with an explanation.

The complete main menu must match `tests/navigation-cases.json`. Keep HTTP navigation checks, browser route cases, local load coverage and page-size budgets consistent when changing menu routes. Contact menu links open the top of `about.html`; intentional in-content `#contact` shortcuts remain valid.

Before release, run the built-artifact checks: `npm run build`, `npm test`, `npm run security`, `npm run test:e2e`, and `npm run test:load`. The GitHub workflow also audits dependencies, scans history for secrets and runs CodeQL. All required gates must pass. Do not disable a check, delete a failing case or weaken a threshold merely to publish. Investigate failures and retain the reports.

Also run `npm run test:performance` before release. Flaky retries and undocumented skips block CI. Keep actual model logic shared with production and independent hand-calculated fixtures. Cache tests use real HTTP caching without routing mocks. Run Lighthouse samples sequentially, retain individual samples and medians, and keep physical-device/screen-reader limitations explicit.

Publish through the protected-main pull-request workflow using the tested artifact. Load and intrusive security tests target the local preview only. Transfer budgets and local-response latency are not Core Web Vitals or proof of production capacity. For navigation changes, perform a limited live smoke check and account for older cached HTML in existing browser tabs.

## Permanent public-content boundary

Internal Executive Radar About/sprint-roadmap information must never be published: this includes the old About view/navigation, four-sprint product-owner roadmap and obsolete runtime translations, on canonical, legacy and copied pages. Keep the shared non-public policy in scripts/baies-dev-public-policy.cjs wired into build, artifact security and post-release checks. Do not remove or weaken these guards or their negative fixtures to make a build pass. Ordinary company About pages and legitimate public discussion of sprints remain allowed.

Removing content from current source does not remove immutable historical previews. When withdrawing internal content, inventory previously shared deployment URLs and branch aliases, retire confirmed unsafe preview deployments, and verify fresh canonical/legacy NL/FR responses. Do not claim withdrawal complete while a known old preview still serves the content. Do not resurrect a retired preview or redeploy its unsafe historical source. Preserve the separate sponsor acceptance/production gate for unreleased product editions.
