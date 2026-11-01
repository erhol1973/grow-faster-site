# ECA voluntary HubSpot integration

Portal 149675328 / eu1 / form 97bca96a-12a6-4542-a5a1-e915d4371a2b. The existing form was updated on 1 November 2026 with the twelve existing contact properties as hidden, non-required fields. No duplicate form or new properties were created. Native marketing subscription `Marketing Information` remains optional and unchecked; storage/processing consent remains native. No workflow was added.

Anonymous scoring makes no HubSpot requests and uses no browser storage. The optional button loads HubSpot only after a sufficient profile exists. The displayed profile is frozen while the form is open; reload starts a new assessment. The form stays invisible and inert until all required fields exist and every assigned value has been read back. Timeout, script failure, missing/rejected properties and native submission failures preserve the anonymous profile. Our code never submits a form or writes a contact through a separate API.

## Property contract checked against the live editor

| Property | Value |
| --- | --- |
| enterprise_coherence_score | Displayed integer score, 0–100 |
| strategic_coherence_score | Strategic dimension, rounded to two decimals |
| operating_model_coherence_score | Operating dimension, rounded to two decimals |
| decision_governance_coherence_score | Governance dimension, rounded to two decimals |
| ai_enablement_coherence_score | AI dimension, rounded to two decimals |
| capability_value_coherence_score | Capability dimension, rounded to two decimals |
| primary_coherence_risk | Unique lowest dimension using CRM enum below; empty on ties |
| coherence_maturity_band | fragmented / constrained / partially_aligned / coherent / highly_coherent |
| assessment_source | Valid utm_source, otherwise eca |
| assessment_campaign | Valid utm_campaign when present; otherwise omitted |
| assessment_completed | UTC date in YYYY-MM-DD format (existing property is a date) |
| diagnostic_interest | interested (existing dropdown; not marketing permission) |

Risk enum: strategic → strategic_coherence; operating → operating_model_value_streams; governance → decision_rights_governance; ai → data_technology_ai_enablement; capability → capabilities_incentives_value. The existing property is single-select and has no tie option. The full tied profile remains visible to the visitor; clearing the CRM risk avoids inventing a winner or leaving a previous risk in the form.

Only utm_source, utm_medium, utm_campaign, utm_term and utm_content identifiers matching 1–100 ASCII letters/digits/underscore/dot/tilde/hyphen are accepted. Additional UTM identifiers go into native submission metadata. Full URLs, referrers, arbitrary query parameters, PII, individual answers, N/A selections and answer counts are not mapped. HubSpot itself may load its own telemetry after the visitor opens the optional form.

Uses the supported [HubSpot form events and instance API](https://developers.hubspot.com/docs/api-reference/latest/marketing/forms/global-form-events). Native field writes settle asynchronously: bounded read-back polling prevents exposing a partially populated form. Fields hidden through the editor retain their native property type.

## Evidence and remaining release gates

- Final build, artifact security scan and 288-request local load check passed (0 errors; p95 128ms). All nine ECA unit cases passed. Final full unit/integration run: 52/54 passed; the contact-navigation and extensionless-route tests encountered ECONNRESET. An earlier complete 53-test run passed. These resets remain unresolved and block claiming a clean release; reports are retained in unit-history.
- ECA desktop/mobile Chromium browser contracts passed. External HubSpot is stubbed in regression tests; these test the integration contract, not HubSpot's implementation.
- `node scripts/verify-eca-hubspot.cjs` passed against the actual published form: all mapped fields were assigned and verified. It never submits or fills contact information. Screenshot/report are in reports/eca-live-form.png and reports/eca-live-contract.json.
- Local full browser matrix was attempted but aborted after Firefox failed to launch: RenderCompositorSWGL failed mapping default framebuffer, launch timeout. This remains an unresolved local environment limitation; it is not a passing matrix result.
- Dependency audit reports two moderate findings; no high findings. Full CI, CodeQL, history secret scan, browser matrix and Lighthouse release gates remain required. Existing broader ECA acceptance items in PR #17 remain open.
- Actual contact persistence and optional-marketing submission still require a controlled voluntary end-to-end submission with an approved test identity, followed by checking the resulting contact and subscription. No test contact was created in this work.

PR #17 must remain Draft and must not merge to main until all release gates and remaining acceptance criteria pass.
