# Current member development integration

Scope: dev/member-access only. Integrate approved main fb0c9b8 (#75 navigation/logo, #77 removed internal Radar About, #80 permanent publication boundary) into member correction195744d. No main merge, production deployment, production Supabase or CMS/CRM writes. CEO pilot PR78 and broader typography PR79 remain independent drafts.

Navigation producer preserved all15 approved ordinary source headers, member account links, admin authorization, NL/FR private Journals. Radar producer prepared approved main-based private edition, scanned decoded template/copy/data against the permanent content boundary and bound the browser to both exact template and payload hashes. References are excluded from public artifacts. Guest French logo return and demo-copy accuracy corrected. Root and producers independently reviewed each other's integration surfaces.

New test Radar payload: reports/member-content/radar/current.json,42586bytes, SHA25608b1f5a9ea12117f424fb9c0a0df0871a84f5c3ef8248aab0dcdc87945842d3b. The acceptance runner expectation matches. The test Storage asset must be replaced before live acceptance; old successful access evidence does not validate the changed payload.

The previously shared immutable member preview5ca5b0d7 still serves removed internal roadmap/runtime keys in assets/baies-dev-app.js (read-only policy scan confirmed). Do not claim withdrawal complete until that development deployment is retired. Earlier retirement of3126e2e7 must not be undone. New canonical/legacy NL/FR routes and copied/runtime payloads must pass policy checks.

Validation in progress: merged build186files passes public policy; Radar22unit cases pass; full unit/browser/load/performance/security and final dev smoke remain pending. Performance work is based on actual baseline/CI attribution, with unchanged quality thresholds and approved typography. Real registration/confirmation/recovery requires a suitable test mailbox and user credential entry. Current member registration does not enroll a newsletter; no newsletter/HubSpot write is performed or claimed.

Status: active implementation and verification. Browser operator session and test mailbox requested; work independent of those inputs continues. Final verified dev URL and final-head gates will be recorded after completion.


## Performance changes under verification

Baseline and failed experiments are retained separately. Removing font preload and deferring startup layout did not improve three-run results and were reverted. No unproved font/render changes are included. The dev Cloudflare header response confirms Content-Encoding:br for i18n; the local performance preview previously offered gzip only. Added real Brotli/gzip/identity quality negotiation, unchanged decoded bytes, Vary and an encoded-byte-only cache invalidated by stat. Brotli quality7 measured around20ms for the translation bundle, avoiding expensive default quality11 on cold local requests. HTTP regressions cover decoding, q-values, identity/406, HEAD, extensionless routes and rebuilt cache invalidation. This changes local delivery parity, not quality thresholds or content. Tiny approved typography CSS is inlined exactly at build to remove an extra render-blocking request, with closing-style injection rejection coverage. Hosted public CSS/font semantics are unchanged.


## Integrated local validation

Rebuilt current source after fixing real strict-CSP typography regression (account/admin retain original external stylesheet; no CSP relaxation). Full unit/integration run:199passed,0failed,0skipped. Artifact security and public-content policy scan passed. Local load passed with no recorded failures. Minimal navigation browser smoke:4/4passed on Chromium desktop/mobile. Critical sequential suite:28/28passed including actual loaded-font/size checks across ordinary/member/admin routes and both viewports. The earlier complete Radar local browser attempt was explicitly interrupted under transport stalls:59passed,7timeouts,134notcompleted; raw evidence retained and not reclassified as passing. Complete browser/performance matrices remain required on final-head GitHub CI.

Test operator access is now available. Auth user search confirmed erlendhollebosch@gmail.com is absent and may serve as the new registration account; the two existing member/admin accounts remain unchanged. Test Auth URL Configuration was still localhost:3000 with no redirect allowlist. Two exact-dev account callback patterns are prepared but not saved pending explicit approval because these add an authentication destination. No production setting was touched.

Latest approved main b1831e2 (#81 browser-runtime verification) arrived during integration and is included before final-head CI. This adds only the reviewed verification runtime/workflow/docs and its tests; the member preview remains development-only.
