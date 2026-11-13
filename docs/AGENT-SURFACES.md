# Navigation and Executive Radar agent surfaces

Current task: integrate approved main navigation/branding and permanent Radar publication boundary into dev/member-access, preserve member authorization and sanitized private editions, repair mobile performance, validate one current dev preview. No main merge/deployment, production database or CMS/CRM writes. Root commits; producers do not. Reviewer audits producers after implementation. Prior retired unsafe previews remain retired. CEO pilot stays draft and outside this integration.

This map coordinates this task and checkout only. It does not reserve shared project files against other workstreams. Review shared HTML, build and asset changes against current main and typography PR79 before any future integration; keep stable CMS IDs and fail-closed environment selection.

```roster
navigation builder installed autonomous
radar builder installed autonomous
branding builder installed autonomous
repository builder installed autonomous
performance builder installed autonomous
reviewer reviewer installed autonomous
```

```surface:navigation
*.html
!index.html
!coherence.html
!insights.html
!about.html
assets/navigation.css
assets/i18n.js
assets/coherence-layout.js
tests/**
!tests/baies-dev.test.cjs
!tests/browser/baies-dev.spec.cjs
!tests/brand-logo.test.cjs
!tests/typography.test.cjs
!tests/performance-fonts.test.cjs
!tests/performance.test.cjs
!tests/journal-editorial.test.cjs
!tests/coherence-film-release.test.cjs
!tests/hero-image.test.cjs
!tests/browser/navigation-accessibility.spec.cjs
!tests/server-compression.test.cjs
!tests/first-paint.test.cjs
!tests/browser/first-paint.spec.cjs
!tests/browser/radar-access.spec.cjs
!tests/radar*
scripts/load.cjs
scripts/performance.cjs
```

```surface:radar
baies-dev/**
executive-radar/**
assets/baies-dev*
scripts/baies-dev*
scripts/radar-release.cjs
scripts/radar-reference/**
assets/radar-access.js
tests/browser/radar-access.spec.cjs
tests/radar*
scripts/security.cjs
scripts/verify-production.cjs
tests/baies-dev.test.cjs
tests/browser/baies-dev.spec.cjs
```

```surface:branding
img/**
!img/hero-executive-meeting-*.avif
!img/hero-*.avif
!img/author-retouched-*.avif
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

```surface:performance
tests/performance.test.cjs
tests/coherence-film-release.test.cjs
coherence.html
insights.html
about.html
img/hero-*.avif
img/author-retouched-*.avif
tests/journal-editorial.test.cjs
index.html
img/hero-executive-meeting-*.avif
tests/hero-image.test.cjs
tests/browser/navigation-accessibility.spec.cjs
scripts/build.cjs
scripts/member-navigation.cjs
scripts/typography-build.cjs
assets/site.js
tests/first-paint.test.cjs
tests/browser/first-paint.spec.cjs
assets/site.css
assets/home-hero.css
assets/books.css
assets/journal.css
assets/typography.css
assets/fonts/**
tests/typography.test.cjs
tests/performance-fonts.test.cjs
```

```surface:repository
**
!*.html
!assets/site.css
!assets/home-hero.css
!assets/books.css
!assets/journal.css
!assets/typography.css
!assets/fonts/**
!assets/radar-access.js
!scripts/radar-release.cjs
!scripts/radar-reference/**
!assets/navigation.css
!assets/site.js
!assets/i18n.js
!assets/coherence-layout.js
!tests/**
!scripts/load.cjs
!scripts/performance.cjs
!scripts/verify-production.cjs
!baies-dev/**
!executive-radar/**
!assets/baies-dev*
!scripts/baies-dev*
!scripts/build.cjs
!scripts/member-navigation.cjs
!scripts/typography-build.cjs
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
tests/server-compression.test.cjs
```

Navigation owns the ordinary site header and shared locale/rendering code, and updates existing menu/test contracts. Radar owns its dedicated product and legacy-compatible canonical route. Branding owns brand image files, including existing BAEIS image paths, without editing HTML. Repository surface is handled by the orchestrator for acceptance-runner hashes, provisioning and registration verification; no credentials are stored. Performance owns the listed CSS/font files and the temporarily reassigned shared site renderer plus first-paint tests. Reviewer audits every producer independently. Root HTML includes admin only if its actual brand/header needs consistency; do not change CMS behavior.
