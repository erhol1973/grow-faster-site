# Member content on growfaster-test

The isolated project is `gqsvoioccvklzfmdmexy`. A publishable browser key authorizes neither schema changes nor private file provisioning. Use an existing Supabase operator login. Production has a separate release procedure.

## Apply the feature migration

With the current Supabase CLI, verify the target shown on stderr before confirming. The migration creates one private bucket, its authorization policies and a membership function. A pre-existing object with the same name aborts the transaction. Keep all previous CMS migrations and data in place.

```powershell
supabase db query --remote=gqsvoioccvklzfmdmexy --file supabase/migrations/20261112_member_content.sql
```

Alternatively, open the [test project SQL Editor](https://supabase.com/dashboard/project/gqsvoioccvklzfmdmexy/sql/new) and run the SQL from that file. Complete this step once. Use the existing release process to keep any active migration register synchronized.

If you already applied the development draft before it restricted signed URLs, run only `docs/member-test-existing-policy.sql` in the same test project. It replaces the read condition on the existing policy. The current migration includes this condition already. The test project needs the Storage helper `storage.allow_only_operation(text)`.

## Provision the isolated edition

Generate the Journal archive into a new working directory outside the checkout. Generate the Radar payload with its release script. From the checkout, pass the directory containing `nl.json`, `fr.json` and `cartoon.webp`, followed by the Radar JSON filename:

```powershell
node scripts/provision-member-test.cjs "$journalDirectory" "$radarFile"
```

The command checks the target bucket and read policy, uploads four explicit assets to the test project and compares downloaded bytes with SHA-256. A CLI version that supports `--remote=<project-ref>` is required. Provisioning uses the operator's CLI session and never writes credentials or private content into the public build.

With an authenticated Dashboard instead, open [test Storage](https://supabase.com/dashboard/project/gqsvoioccvklzfmdmexy/storage/buckets), then the private `member-content` bucket. Keep the directory structure: upload `nl.json`, `fr.json` and `cartoon.webp` under `journal/2026-11/`, and `current.json` under `radar/`. These uploads use exactly the same objects as the CLI. Verify real downloads as the regular test member.

## Check access through the deployed dev site

In the isolated project, open **Authentication → URL Configuration**. Allow the exact dev host and the `/account` callback used for signup confirmation and password recovery, including its `state` and `lang` query parameters. Scope any query wildcard to this path on `dev-member-access.grow-faster-site.pages.dev`. Send and follow an actual confirmation email and an actual recovery email from dev. Confirm that each returns to that host, retains the chosen language and rejects a reused or altered state.

Run the isolated gateway check from the checkout with a confirmed regular test account and the existing test administrator. Supply only email addresses as arguments. Enter passwords in the terminal's hidden prompts. The runner logs HTTP results and byte counts; its SHA-256 expectations identify the initial test edition. `--guest-only` runs just the anonymous side. The complete run checks the real membership and CMS role RPCs, the four objects and denied URL signing before closing the two sessions.

```powershell
node scripts/accept-member-test.cjs regular-test-email@example.com existing-test-admin@example.com
```

1. Open a private window and read the public Journal article and Radar sample. Inspect the network responses for premium content and visit former full-edition URLs directly.
2. Confirm a regular test member's email. Log in, open the full Journal in both languages, open the full Radar, and check that the account menu offers only member actions.
3. In a fresh private window request each protected object without a member session. Direct public and authenticated API paths must deny anonymous access. Check that a regular member cannot sign a shareable URL or enumerate the bucket. Log out of a member session and reload both pages.
4. Using the existing test administrator, verify the account menu opens the CMS and that a regular member entering the same URL cannot perform a CMS action.

The PostgreSQL policy suite uses the real migrations against local PGlite with simulated Supabase identities:

```text
node --test tests/member-authorization.test.cjs
```

## Download failure investigation — 13 November 2026

The reported HTTP 400 with 88 bytes does not establish whether an object is missing or hidden by RLS. The old runner discarded the Storage error body. It now reports bounded Storage error fields and the actual digest on a successful response with unexpected bytes. Guest-only output explicitly leaves object existence unverified. No remote policy change is justified by the available evidence.

The runner now also requires empty/denied bucket listings at the root and both product prefixes for guests, members and administrators. A successful empty list is an RLS-filtered result, not proof that the bucket is empty. Masked `Object not found` errors are explicitly marked ambiguous until both authenticated roles download the exact expected bytes. A non-JSON, malformed or unrelated gateway error cannot pass a denial check. Storage diagnostics exclude unknown fields and bound/control-strip the known error fields.

CMS checks use read-only `cms_versions?select=id&limit=1`: members must see no private history, and the administrator must see an existing version. The isolated project already has CMS publication-history evidence; if no history exists, this positive proof remains blocked rather than passing an empty result. No test draft is saved or published by this runner. Local policy regressions separately exercise denied member save/publish and self-promotion.

The operation name object.get_authenticated is documented by Supabase; do not broaden the policy to permit signing or listing as a workaround. Local PGlite policy coverage uses a simulated Storage helper and cannot establish the deployed helper implementation or object existence.

Run docs/member-test-diagnose.sql read-only in the SQL Editor of gqsvoioccvklzfmdmexy, then rerun the updated scripts/accept-member-test.cjs interactively with the two test accounts. Return the object_exists results, policy/helper definitions and sanitized failure line. A missing object requires provisioning the exact approved asset at the expected path; an existing object requires comparing deployed policies/helper and the actual gateway error before applying a targeted correction. Do not rerun the bucket-creation migration against an existing bucket.

Local validation: node --test tests/member-acceptance.test.cjs tests/member-authorization.test.cjs — 17 passed, 0 failed. This validates diagnostic classifications and simulated policy behavior; it does not establish deployed object presence or authenticated gateway rights. The previous remote attempt failed with UNABLE_TO_VERIFY_LEAF_SIGNATURE; no authenticated Supabase operator session was available then. No production changes, remote migration, upload, merge or deployment was performed by this diagnostic work.

## Orchestrated continuation — 13 November 2026

Resumed the existing checkout, retained the previous diagnostic changes, and fast-forwarded dev/member-access from 5f71e34 to the existing PR #76 head 7c84b23. No duplicate pull request. Roles: read-only root-cause investigator; implementation/security writer restricted to the acceptance runner, regression tests and diagnostic documentation; independent read-only QA; orchestrator integrates and commits.

Live anonymous evidence on all four paths: public GET HTTP 400 / 98 bytes, NoSuchBucket (Bucket not found); authenticated-object GET without a session and signing HTTP 400 / 88 bytes, NoSuchKey (Object not found). These are masked non-delivery responses, not evidence of object existence or correct member access. The actual member error remains unobserved here. Node --use-system-ca resolved the certificate trust error without disabling TLS verification; a later guest-only attempt hit UND_ERR_CONNECT_TIMEOUT. No logged-in operator/browser session or interactive account credentials were available. No remote corrective mutation is justified yet.

Validation on the current source: build and artifact security scan passed. Independent authorization/session/diagnostic tests: 30 passed. Full local unit suite: 177/179 passed; two failures were ECONNRESET in books.test.cjs and server.test.cjs. Initial local load: 432 requests, 16 timeouts, p95 1716ms (limit 1500ms); this overlapped other checks and is not a clean performance measurement. Local Lighthouse could not launch (spawn EPERM). Retain reports; none of these gates is marked passed.

Independent browser checks: both complete 15-sheet NL/FR layout cases passed using the existing protected-content fixture and the specified landscape viewport. This does not validate real Storage delivery. Radar skip-link focus passed in WebKit. Broader focused Chromium/mobile run: 34 passed, 8 failed, predominantly Journal page-load timeouts plus a missing translated CTA. A separate local port reproduced load timeouts; no proven product repair was inferred from those results. Existing registration browser tests use mocked Auth; real email confirmation and return remain outstanding.

Existing remote head 7c84b23: JavaScript security, Secrets history, CodeQL and BAEIS dev quality succeeded; Website quality gate failed at Lighthouse mobile and desktop medians. Production deployment/verification were skipped. These are results for the old remote head, not approval of this diagnostic commit.

Release decision: NO-GO. Required manual evidence, exclusively on gqsvoioccvklzfmdmexy:
1. Sign into the test-project Dashboard and run docs/member-test-diagnose.sql in SQL Editor; return bucket privacy, four object_exists rows and deployed policy/helper definitions. This is read-only. Do not rerun the creation migration.
2. In this checkout run node --use-system-ca scripts/accept-member-test.cjs jochenhollebosch1@gmail.com erlend.hollebosch@proximus.be. Enter each existing test password only at its hidden prompt. Return sanitized output, never passwords/tokens. If the installed Node version lacks --use-system-ca, use the normal command with a correctly configured trust store, never disable TLS validation.
3. On the dev host, start at a gated Journal article in the chosen language, register an unused test mailbox, open the actual confirmation email in the same browser context, and verify return to the requested article/page/language. User credential creation and email confirmation require manual interaction. Do not change production URL configuration.

Only after authenticated object/policy evidence identifies the cause should missing approved assets be provisioned or a specific policy defect repaired. No merge, deployment or publication is authorized.
