# Executive Radar agent surfaces

Task 13 November 2026: one researched current CEO pilot edition in isolated dev. Sponsor retains content acceptance and production go/no-go. NO main merge, auto-merge, production deploy, external sending, paid services, hosting or CMS changes. Orchestrator alone commits and prepares gated dev preview. Research/radar write disjoint paths; reviewer is read-only. Other surfaces are preservation-only.

```roster
navigation builder installed autonomous
radar builder installed autonomous
research builder installed autonomous
branding builder installed autonomous
repository builder planned escalates
reviewer reviewer installed autonomous
```

```surface:navigation
*.html
assets/navigation.css
assets/site.js
assets/i18n.js
tests/**
!tests/baies-dev.test.cjs
!tests/browser/baies-dev.spec.cjs
!tests/brand-logo.test.cjs
!tests/executive-radar-edition.test.cjs
scripts/load.cjs
scripts/performance.cjs
scripts/verify-production.cjs
```

```surface:research
assets/executive-radar-edition.js
docs/EXECUTIVE-RADAR-RESEARCH.md
```

```surface:radar
baies-dev/**
executive-radar/**
assets/baies-dev*
scripts/baies-dev*
scripts/build.cjs
tests/baies-dev.test.cjs
tests/browser/baies-dev.spec.cjs
tests/executive-radar-edition.test.cjs
```

```surface:branding
img/**
favicon.ico
tests/brand-logo.test.cjs
```

```surface:orchestrator
docs/AGENT-SURFACES.md
docs/agents/**
scripts/agent-guard.mjs
.github/workflows/dev-agent-surfaces.yml
.github/workflows/baies-dev-quality.yml
docs/EXECUTIVE-RADAR-NAV-DEV.md
docs/EXECUTIVE-RADAR-PILOT.md
```

```surface:repository
**
!*.html
!assets/navigation.css
!assets/site.js
!assets/i18n.js
!tests/**
!scripts/load.cjs
!scripts/performance.cjs
!scripts/verify-production.cjs
!baies-dev/**
!executive-radar/**
!assets/baies-dev*
!scripts/baies-dev*
!scripts/build.cjs
!img/**
!favicon.ico
!docs/AGENT-SURFACES.md
!docs/agents/**
!scripts/agent-guard.mjs
!.github/workflows/dev-agent-surfaces.yml
!.github/workflows/baies-dev-quality.yml
!docs/EXECUTIVE-RADAR-NAV-DEV.md
!docs/EXECUTIVE-RADAR-PILOT.md
!assets/executive-radar-edition.js
!docs/EXECUTIVE-RADAR-RESEARCH.md
```

Research owns the dated edition and research evidence. Radar owns product rendering and regression tests. Reviewer independently audits facts, NL/FR parity and behavior, never edits. Orchestrator owns release evidence and sponsor acceptance handover. No other site/CMS/brand changes are dispatched.
