# ECA voluntary HubSpot integration

Portal 149675328 / eu1 / form 97bca96a-12a6-4542-a5a1-e915d4371a2b. The existing form was updated on 1 November 2026 with the twelve existing contact properties as hidden, non-required fields. The original integration added no properties. The owner subsequently authorized English and French native form variants to remove mixed-language capture. Native marketing subscription `Marketing Information` remains optional and unchecked; storage/processing consent remains native. No workflow was added.

Anonymous scoring makes no HubSpot requests and never stores answers or results. The ECA can read the existing site-language preference; it writes no browser storage. The optional button loads HubSpot only after a sufficient profile exists. The displayed profile is frozen while the form is open; reload starts a new assessment. The form stays invisible and inert until all required fields exist and every assigned value has been read back. Timeout, script failure, missing/rejected properties and native submission failures preserve the anonymous profile. Our code never submits a form or writes a contact through a separate API.

## Property contract checked against the live editor

| Property | Value |
| --- | --- |
| enterprise_coherence_score | Displayed integer score, 0–100 |
| strategic_coherence_score | Strategic dimension, rounded to two decimals |
| operating_model_coherence_score | Operating dimension, rounded to two decimals |
| decision_governance_coherence_score | Governance dimension, rounded to two decimals |
| ai_enablement_coherence_score | AI dimension, rounded to two decimals |
| capability_value_coherence_score | Capability dimension, rounded to two decimals |
| primary_coherence_risk | Unique lowest dimension using CRM enum below; multiple_constraints on ties |
| coherence_maturity_band | fragmented / constrained / partially_aligned / coherent / highly_coherent |
| assessment_source | Valid utm_source, otherwise eca |
| assessment_campaign | Valid utm_campaign when present; otherwise omitted |
| assessment_completed | UTC date in YYYY-MM-DD format (existing property is a date) |
| diagnostic_interest | interested (existing dropdown; not marketing permission) |

Risk enum: strategic → strategic_coherence; operating → operating_model_value_streams; governance → decision_rights_governance; ai → data_technology_ai_enablement; capability → capabilities_incentives_value. The existing single-select property and the same form now also include multiple_constraints (label: Multiple dimensions (tied)). This explicit value replaces a previous unique risk when a returning contact submits a tied profile, without arbitrarily naming a winner. All five scores and the complete tied profile remain available.

Only utm_source, utm_medium, utm_campaign, utm_term and utm_content identifiers matching 1–100 ASCII letters/digits/underscore/dot/tilde/hyphen are accepted. Additional UTM identifiers go into native submission metadata. Full URLs, referrers, arbitrary query parameters, PII, individual answers, N/A selections and answer counts are not mapped. HubSpot itself may load its own telemetry after the visitor opens the optional form.

Uses the supported [HubSpot form events and instance API](https://developers.hubspot.com/docs/api-reference/latest/marketing/forms/global-form-events). Native field writes settle asynchronously: bounded read-back polling prevents exposing a partially populated form. Fields hidden through the editor retain their native property type.

## Language, accessibility and live evidence

The assessment questions, instructions, results, recommendations and integration feedback support EN/NL/FR. A URL language takes precedence over the existing site preference and browser language. Changing language preserves selected answers and the result. The language selector is frozen once the optional form opens, so its submitted snapshot cannot become stale. The native HubSpot form follows the selected assessment language through the three authorized variants. Home and Enterprise Coherence include direct, ungated assessment links.

The optional loader allows up to 60 seconds for HubSpot cross-frame initialization and acknowledgements, including throttled background tabs. It remains invisible/inert until ready; a provider that never becomes ready and late events after failure have explicit regression coverage. No threshold in the release gates was relaxed.

- All 58 unit/HTTP tests passed in an unrestricted local Windows execution using the same Node 24 runtime. Earlier restricted-environment ECONNRESET reports remain in unit-history; a passing later run is not claimed as a proven root-cause fix.
- Fourteen desktop/mobile cases passed for three-language accessibility of questions/results, privacy, optional capture, preservation across language changes and the site reading route. The additional timeout/late-event regression passed on Chromium; all cases also enter CI.
- The existing published-form read-only smoke passed with multiple_constraints. It verifies field read-back and visibility. It submits nothing by default. --submit requires an explicitly approved identity.
- A live returning-contact test was completed through the native form using the owner's approved test identity. First submission: overall 65, strategic 25, other dimensions 75, risk Strategic coherence. Second submission on the same contact: overall and all dimensions 75, maturity Coherent, risk Multiple dimensions (tied). The contact properties were read directly after each submission. Source/campaign were return-smoke / eca-repeat. Marketing remained unchecked and processing consent was explicit. No duplicate form, contact property or workflow was created; one enumeration option was added to the existing risk property. No CAPTCHA or anti-bot control was bypassed.
- Full GitHub Website quality gate, JavaScript security gate and Secrets history gate passed for revision 0e23e92b42964103d78d48af63c3ca1a5fb160d1, including the complete browser matrix, load and sequential Lighthouse. The final localization/tie revision must pass the same gates before merge. A local Firefox framebuffer failure is not treated as a passing matrix result; CI supplies the cross-browser evidence.

Personal test identity and screenshots remain outside the public build and are not committed. PR #17 passed every gate and was released from protected main (d6d1324). Subsequent corrections follow the same pull-request and tested-artifact release procedure.


## Questionnaire corrections and native language variants

The owner explicitly authorized two additional language variants. Dutch retains 97bca96a-12a6-4542-a5a1-e915d4371a2b; English uses cc190a9a-fae1-4e6d-8ddc-110bb019538b; French uses 1544528d-0ea2-4a27-b368-9fe1e594a036. Both variants were cloned from the existing form, retain all twelve hidden/non-required properties and native separate processing/marketing consent, and have no workflows. Labels, native validation language, introduction, confirmation and all five consent/privacy texts were reviewed in the corresponding language. The browser freezes the selected language and uses its matching form ID for population and submission events. Read-only native contract checks verify each published variant without creating submissions.

Every question now requires an explicit valid score or N/A, in both UI and scoring model. N/A remains excluded from scoring; at least three numeric responses per dimension remain necessary. Missing answers show a localized error and focus the first missing question. Legends use normal weight; answer options show text without a numeric prefix and compact padding with a 44px minimum touch target. The discussion link opens the real contact section; historical #executiveDiagnostic arrival links forward there instead of targeting a hidden result. Anonymous results remain ungated and individual answers are never sent.
