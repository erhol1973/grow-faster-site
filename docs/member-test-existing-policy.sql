-- TEST ONLY: run in growfaster-test (gqsvoioccvklzfmdmexy), never production.
-- Follow-up for an already-applied 20261112_member_content.sql.
-- Mirrors 20261113_member_download_info.sql; apply either file, not both.
-- Allows the authenticated metadata precheck used by the download gateway.
-- No table content, bucket visibility, signing, listing or write policy is changed.
begin;
alter policy member_content_read_guard on storage.objects
using (bucket_id <> 'member-content' or
       (name ~ '^(journal|radar)/.+' and (select public.member_has_access())
        and ((select storage.allow_only_operation('object.get_authenticated'))
             or (select storage.allow_only_operation('object.get_authenticated_info')))));
commit;
