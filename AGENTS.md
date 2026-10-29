# Grow Faster project instructions

Read `docs/TESTPLAN.md` and `docs/RELEASE.md` before changing release or test behaviour.

Keep tests in version control. Every bug fix and new user flow must include appropriate lasting regression coverage. Extend the relevant unit, HTTP integration, browser/end-to-end, load or performance layer; do not duplicate a scenario in every layer merely to increase counts. Preserve useful positive and negative cases. Remove obsolete or redundant tests only with an explanation.

The complete main menu must match `tests/navigation-cases.json`. Keep HTTP navigation checks, browser route cases, local load coverage and page-size budgets consistent when changing menu routes. Contact menu links open the top of `about.html`; intentional in-content `#contact` shortcuts remain valid.

Before release, run the built-artifact checks: `npm run build`, `npm test`, `npm run security`, `npm run test:e2e`, and `npm run test:load`. The GitHub workflow also audits dependencies, scans history for secrets and runs CodeQL. All required gates must pass. Do not disable a check, delete a failing case or weaken a threshold merely to publish. Investigate failures and retain the reports.

Publish through the protected-main pull-request workflow using the tested artifact. Load and intrusive security tests target the local preview only. Transfer budgets and local-response latency are not Core Web Vitals or proof of production capacity. For navigation changes, perform a limited live smoke check and account for older cached HTML in existing browser tabs.
