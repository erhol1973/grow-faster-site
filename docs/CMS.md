# Grow Faster Contentstudio

## Status and activation

Implementation prepared against GitHub main `895cd869761a37df543ecf1d9aa26bf2d7cd09da`.
The production Supabase schema was inspected on 8 November 2026: the existing
`home/hero` record is draft, the confirmed owner is allowlisted in
`private.cms_admins`, all eight public content tables have RLS, and the public
`media` bucket has no objects. Existing data is retained.

The additive migration and private `cms-media` bucket are now installed in
growfaster-prod. A transaction on the real database verified admin publication,
private drafts, preservation of the previous publication and anonymous/non-admin
denial, then rolled back all verification rows. No real editorial content was
published by the agent. The frontend is available as a branch preview; production
website release remains blocked by real login/media acceptance and release gates.

1. Completed: `supabase/migrations/20261108_cms_publications.sql` in growfaster-prod.
   It adds publication snapshots, administrator-only version history and two
   checked RPCs. It does not replace the existing schema or publish any record.
2. Completed: **private** `cms-media` bucket through Storage, maximum 25 MB,
   allow image/jpeg, image/png, image/webp, image/avif and video/mp4. Leave the
   existing public `media` bucket unchanged. Never upload private drafts there.
3. Verify Auth password login for the existing allowlisted administrator.
   Public account registration is unnecessary; disable it if enabled. Do not
   put passwords, service-role keys or secret API keys in frontend files.
4. Exercise real administrator login, draft save, private image/video upload,
   preview and publish. Independently verify anonymous and non-admin denial,
   including unsigned access to draft files and signing requests for unpublished
   files. Local PostgreSQL tests mock Auth/Storage metadata; they do not prove
   gateway configuration, byte delivery, MIME enforcement or real login.
5. Pass the protected-main quality, secret and JavaScript gates, merge the
   reviewed revision and deploy its tested artifact. Verify the live admin and
   public page. One initial deployment installs the CMS; later content changes
   use Supabase and do not require deployment.

Only the public publishable key is configured in `assets/cms-config.js`.

## Editing

Open `/admin.html`, sign in and choose a page. First selection creates a draft
record for pages not yet in `page_sections`; it never publishes that record.
NL and FR fields start from the existing translations. The existing home hero
heading/body are imported when no CMS field override is saved. A newline in the
home heading keeps its second part emphasised, without accepting HTML.

Save a concept, inspect the page preview in NL and FR, then publish. Publishing
updates a complete page's editable content atomically. A later draft leaves the
last published snapshot intact. New page requests read the publication using
`cache: no-store`. Already-open pages refresh on navigation/reload. Static HTML
remains the fallback if the content service is unavailable.

This first integration covers the home hero, plain headings, paragraphs and
list items, existing main-content images, and one optional video slot on each
of eleven pages: Home, About, Books, Approach, Coherence, Insights, Operating
Model, Process, Value, Transformation and Workshop. Nested rich-text/link
structures, navigation, calculators, ECA question logic, book/journal readers,
the published coherence commercial, metadata and legal pages remain source-managed. The editor does not create
new page layouts or accept arbitrary HTML. It is not a complete migration of
every string on the site.

Uploads use unique immutable paths in the private bucket. Draft URLs are signed
only for administrators; anonymous signing is allowed only for media referenced
by a current publication. Signed URLs last five minutes and may remain usable
until expiry. Uploads are never overwritten. Deletion and garbage collection
are intentionally unavailable in this editor. A file uploaded but not saved
may remain orphaned; review references before manual cleanup.

## Security and recovery

The authenticated role is insufficient: every privileged RPC checks the existing
private administrator allowlist. The UI checks membership, while PostgreSQL RLS
enforces it independently. Sessions stay in memory and are cleared on reload,
logout or expiry. There is no signup flow. The owner can request a first-password/recovery email and choose their own password through a verified recovery link. Recovery is disabled in configuration until the two exact preview/production redirect URLs are approved and saved in Supabase. Recovery tokens are removed from the address bar, checked against Auth and administrator membership, and kept only in memory. The agent has not sent a recovery email or chosen a password. Concurrent edits
use the server revision as a precondition; conflicts retain local text and
require reload, rather than overwriting somebody else's update.

The publication and history tables allow no direct browser writes. Publishing
locks the draft, validates both languages and uploaded references, appends a
history snapshot and atomically replaces the public snapshot. Version history
is retained in `cms_versions`; a restore button is not implemented. To recover
content, an administrator can copy a reviewed historical version into the draft,
preview it and republish. Do not directly delete a public snapshot as a substitute
for reverting content. Website-code recovery follows `docs/RELEASE.md`.

## Tests

`npm test` includes client contracts, catalog/source consistency and PGlite
PostgreSQL tests for real policies/RPCs with mocked Supabase Auth and Storage
schemas. Browser CMS tests use synthetic accounts and a mocked API boundary;
they cover login denial, private editing, save-before-publish, the actual-page
preview, safe text rendering, language switches, concurrent-edit errors and
automated accessibility. Real Supabase acceptance tests are separate.

Keep failure reports and follow all existing release gates. Never weaken a gate
or use a successful local mock as evidence of a production deployment.
