-- READ ONLY. Run exclusively in gqsvoioccvklzfmdmexy SQL Editor.
-- Do not modify RLS until these results and the actual HTTP error are known.
select id, public from storage.buckets where id='member-content';
with expected(name) as (values ('journal/2026-11/nl.json'),
 ('journal/2026-11/fr.json'),('journal/2026-11/cartoon.webp'),('radar/current.json'))
select e.name, o.id is not null as object_exists, o.metadata->>'size' as bytes
from expected e left join storage.objects o on o.bucket_id='member-content' and o.name=e.name;
select policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname='storage' and tablename in ('objects','buckets');
select pg_get_functiondef(to_regprocedure('storage.allow_only_operation(text)'));
select pg_get_functiondef(to_regprocedure('public.member_has_access()'));
-- Metadata only, to find wrong folder/case/leading slash uploads; no object bytes.
select name, metadata->>'size' as bytes from storage.objects
where bucket_id='member-content' order by name;

