# Member content on growfaster-test

The isolated project is `gqsvoioccvklzfmdmexy`. A publishable browser key authorizes neither schema changes nor private file provisioning. Use an existing Supabase operator login. Production has a separate release procedure.

## Apply the feature migration

With the current Supabase CLI, verify the target shown on stderr before confirming. The migration creates one private bucket, its authorization policies and a membership function. A pre-existing object with the same name aborts the transaction. Keep all previous CMS migrations and data in place.

```powershell
supabase db query --remote=gqsvoioccvklzfmdmexy --file supabase/migrations/20261112_member_content.sql
```

Alternatively, open the [test project SQL Editor](https://supabase.com/dashboard/project/gqsvoioccvklzfmdmexy/sql/new) and run the SQL from that file. Complete this step once. Use the existing release process to keep any active migration register synchronized.

## Provision the isolated edition

Generate the Journal archive into a new working directory outside the checkout. Generate the Radar payload with its release script. From the checkout, pass the directory containing `nl.json`, `fr.json` and `cartoon.webp`, followed by the Radar JSON filename:

```powershell
node scripts/provision-member-test.cjs "$journalDirectory" "$radarFile"
```

The command checks the target bucket and read policy, uploads four explicit assets to the test project and compares downloaded bytes with SHA-256. A CLI version that supports `--remote=<project-ref>` is required. Provisioning uses the operator's CLI session and never writes credentials or private content into the public build.

## Check access through the deployed dev site

1. Open a private window and read the public Journal article and Radar sample. Inspect the network responses for premium content and visit former full-edition URLs directly.
2. Confirm a regular test member's email. Log in, open the full Journal in both languages, open the full Radar, and check that the account menu offers only member actions.
3. In a fresh private window request each protected object without a member session. Direct public and authenticated API paths must deny anonymous access. Check that a regular member cannot sign a shareable URL or enumerate the bucket. Log out of a member session and reload both pages.
4. Using the existing test administrator, verify the account menu opens the CMS and that a regular member entering the same URL cannot perform a CMS action.

The PostgreSQL policy suite uses the real migrations against local PGlite with simulated Supabase identities:

```text
node --test tests/member-authorization.test.cjs
```
