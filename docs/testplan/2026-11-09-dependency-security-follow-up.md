## Dependency security follow-up, 9 November 2026

A targeted pnpm update of the transitive @sentry/node dependency within Lighthouse's existing supported range updates Sentry to 11.11.0, glob to 14.0.4 and minimatch to 11.0.5. Direct package versions, browser versions, audit thresholds and package-manager version remain unchanged; no override is introduced. Frozen-lockfile installation and Lighthouse import pass; pnpm audit reports zero advisories.

Three local Windows/system-Chrome homepage mobile samples after the update report accessibility 100 and SEO 100 each. Performance scores 83/82/88 (median 83), median LCP 2561.71 ms and median TBT 432 ms fail the existing limits; these results are retained and are not green release evidence. Full pinned Linux CI on the final head is still required. Live read-only Home/Books/Coherence continue to match main a8fae016; anonymous REST reveals no drafts/publications and denies history. No production writes occurred.
