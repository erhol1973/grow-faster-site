# Release activation

The workflow is prepared, but deployment is deliberately disabled. Existing GitHub Pages branch publication remains outside this workflow until its source is changed.

After explicit owner approval:
1. Run pnpm install --frozen-lockfile using pnpm 11.25.0 and all checks. The committed pnpm-lock.yaml pins the complete browser-test dependency tree.
2. Review and pin official Actions tags to verified full commit SHAs. Tags are used here because no unverified SHA should be invented.
3. In Settings > Pages, change Source to GitHub Actions. Preserve the custom domain and HTTPS setting.
4. Protect main with required Website quality gate, JavaScript security gate and Secrets history gate checks, pull request review as chosen by the owner, and restricted force pushes/bypass rights.
5. Restrict the github-pages environment to main. Set repository variable PAGES_RELEASE_ENABLED=true only after all checks pass.
6. Run the workflow and verify its deployment URL, domain, principal pages and assets. Keep the preceding known-good commit for a revert and rerun through the same gate.

The same dist artifact tested by the checks is published. PR jobs never deploy. Only deploy receives Pages/OIDC write permissions. No production load test runs.

CodeQL blocks on unsuppressed findings, rather than merely uploading alerts. The local security script supplies heuristic secrets checks; the separate Gitleaks job scans full Git history after checkout with fetch-depth: 0. Gitleaks comments and artifact upload are disabled to avoid posting messages or distributing sensitive reports. The action uses the default GitHub token; a personal-account repository does not require a Gitleaks organization license. Both CodeQL and Gitleaks are prepared for GitHub execution and have not been run locally. Confirm code-scanning availability and policy before activation. Node 24.21.0 was verified in current official npm package publication metadata; Playwright 1.62.1 matches the installed local runtime and lockfile.

Tests run against a loopback server, not the GitHub CDN. Passing local checks cannot certify production infrastructure capacity or guarantee absence of security vulnerabilities. Post-publication read-only smoke checks and account/DNS protections remain necessary.
