## Mobile cache compatibility and Lighthouse coverage, 9 November 2026

The temporary mobile cache-transition skip is removed. A retained local failure trace showed that the current wordmark in legacy navigation markup pushed the hamburger outside the mobile viewport. Wordmark dimensions now apply to both legacy and executive navigation; the existing cache scenario also asserts that the hamburger is in the viewport before opening it. No forced click, timeout increase or retry change is used.

Lighthouse now collects accessibility and SEO alongside performance for every existing route, mode and sample, and retains scores in JSON/HTML and median summaries. Existing performance thresholds and axe accessibility assertions remain unchanged. Accessibility/SEO scores are evidence for release review, not an automatic waiver of audit findings. Real isolated Supabase acceptance remains outstanding; no production writes or release are authorised.
