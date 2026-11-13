# Navigation and Executive Radar agent surfaces

Current task: prevent internal Executive Radar sprint/About content from ever entering new public artifacts and retire the confirmed old Cloudflare dev preview3126e2e7. Radar owns policy/build/security/live-check source and regression tests; reviewer is read-only. Orchestrator alone commits. The CEO pilot PR78 remains draft with sponsor acceptance and production Go/No-go OPEN; do not publish that edition. No hosting-wide settings, CMS/HubSpot writes or gate relaxation.

```roster
navigation builder installed autonomous
radar builder installed autonomous
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
scripts/load.cjs
scripts/performance.cjs
```

```surface:radar
baies-dev/**
executive-radar/**
assets/baies-dev*
scripts/baies-dev*
scripts/build.cjs
scripts/security.cjs
scripts/verify-production.cjs
tests/baies-dev.test.cjs
tests/browser/baies-dev.spec.cjs
```

```surface:branding
img/**
favicon.ico
tests/brand-logo.test.cjs
```

```surface:orchestrator
docs/AGENT-SURFACES.md
AGENTS.md
docs/RELEASE.md
docs/TESTPLAN.md
docs/agents/**
scripts/agent-guard.mjs
.github/workflows/dev-agent-surfaces.yml
.github/workflows/baies-dev-quality.yml
docs/EXECUTIVE-RADAR-NAV-DEV.md
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
!scripts/security.cjs
!img/**
!favicon.ico
!docs/AGENT-SURFACES.md
!AGENTS.md
!docs/RELEASE.md
!docs/TESTPLAN.md
!docs/agents/**
!scripts/agent-guard.mjs
!.github/workflows/dev-agent-surfaces.yml
!.github/workflows/baies-dev-quality.yml
!docs/EXECUTIVE-RADAR-NAV-DEV.md
```

Navigation owns the ordinary site header and shared locale/rendering code, and updates existing menu/test contracts. Radar owns its dedicated product and legacy-compatible canonical route. Branding owns brand image files, including existing BAEIS image paths, without editing HTML. Repository is a non-dispatched preservation surface; it may not change in this task. Reviewer audits every producer independently. Root HTML includes admin only if its actual brand/header needs consistency; do not change CMS behavior.
