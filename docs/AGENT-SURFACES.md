# Dev navigation and Executive Radar agent surfaces

Task scope: isolated dev only. No main merge, production deploy, CMS/HubSpot writes or hosting configuration changes. Orchestrator alone commits. All builders report paths, verification and limitations. Independent reviewer never edits.

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
scripts/verify-production.cjs
```

```surface:radar
baies-dev/**
executive-radar/**
assets/baies-dev*
scripts/baies-dev*
scripts/build.cjs
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
!img/**
!favicon.ico
!docs/AGENT-SURFACES.md
!docs/agents/**
!scripts/agent-guard.mjs
!.github/workflows/dev-agent-surfaces.yml
!.github/workflows/baies-dev-quality.yml
!docs/EXECUTIVE-RADAR-NAV-DEV.md
```

Navigation owns the ordinary site header and shared locale/rendering code, and updates existing menu/test contracts. Radar owns its dedicated product and legacy-compatible canonical route. Branding owns brand image files, including existing BAEIS image paths, without editing HTML. Repository is a non-dispatched preservation surface; it may not change in this task. Reviewer audits every producer independently. Root HTML includes admin only if its actual brand/header needs consistency; do not change CMS behavior.
