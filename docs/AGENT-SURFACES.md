# Navigation and Executive Radar agent surfaces

Current task (13 November 2026): remove the internal Executive Radar About link, view and obsolete public runtime copy in NL/FR, with regression coverage. The owner requests correction of the public production page. Radar is the only dispatched builder; reviewer is independent and read-only. Orchestrator alone commits and publishes through the protected PR and tested-artifact release gates after successful review. No CMS/HubSpot writes, hosting configuration changes or threshold relaxation. All builders report paths, verification and limitations. Other surfaces below remain preservation-only in this task. The former dev navigation task is retained in Git history.

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
