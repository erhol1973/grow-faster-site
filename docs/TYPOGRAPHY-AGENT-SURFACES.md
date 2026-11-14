# Typography task surfaces

| Agent | Class | Authority | Exclusive write surface | Review |
| --- | --- | --- | --- | --- |
| integrator | builder | autonomous | assets/**, **/*.html, scripts/typography-*.cjs, tests/typography*, tests/browser/typography*, docs/TYPOGRAPHY.md | css_auditor and visual_qa |
| inventory | reviewer | autonomous | none; read-only route inventory | orchestrator |
| css_auditor | reviewer | autonomous | none; read-only CSS and design evidence | orchestrator |
| visual_qa | reviewer | autonomous | none; read-only accessibility and release gate | orchestrator |
| orchestrator | coordinator | autonomous | all remaining paths; sole committer | visual_qa |

No agent commits, pushes, merges or deploys. Existing checkout and PRs 57/58/60 remain untouched. Baseline origin/main 1dc94c5. Local independent clone is used because managed worktree creation is still pending. Reviewers never edit producer files. Validate producer changed paths before committing. Typography contract must be independently checked against computed DOM output, not only derived from the implementation.

```roster
integrator builder installed autonomous
inventory reviewer installed autonomous
css_auditor reviewer installed autonomous
visual_qa reviewer installed autonomous
```

```surface:integrator
assets/**
**/*.html
scripts/typography-*.cjs
tests/typography*
tests/browser/typography*
!tests/browser/typography-states.spec.cjs
!scripts/typography-audit.cjs
!tests/browser/typography.spec.cjs
!tests/typography-contract.json
docs/TYPOGRAPHY.md
```

```surface:orchestrator
**
!assets/**
!**/*.html
!scripts/typography-*.cjs
!tests/typography*
!tests/browser/typography*
!docs/TYPOGRAPHY.md
!tests/browser/accessibility.spec.cjs
!.github/workflows/release.yml
!playwright.config.cjs
```

## Additional test producer

The state-test builder owns the explicit test/helper paths listed below.
Integrator explicitly excludes that file. Visual QA reviews both producers.

```roster
state_tests builder installed autonomous
```

```surface:state_tests
tests/browser/accessibility.spec.cjs
tests/browser/typography-states.spec.cjs
scripts/typography-audit.cjs
tests/browser/typography.spec.cjs
tests/typography-contract.json
```

The state-test producer additionally owns the audit helper, contract JSON and main typography browser spec; the integrator confirmed transfer before dispatch. CSS, HTML, typography delivery unit test and typography documentation remain with the integrator.

The existing accessibility browser spec is also assigned to the state-test producer for full built-route/actual-locale WCAG coverage; all other existing accessibility scenarios are preserved.

## CI partition producer

```roster
ci_checks builder installed autonomous
```

```surface:ci_checks
.github/workflows/release.yml
playwright.config.cjs
```

CI producer owns only the release workflow and browser partition configuration. Orchestrator verifies the case-set union and independent reviewer audits gate dependencies. Existing thresholds and protected check names remain authoritative.
