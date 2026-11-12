-- growfaster-test follow-up for an already-applied draft of 20261112_member_content.sql.
-- Applies the final SELECT condition to that existing policy; no table content is touched.
begin;
alter policy member_content_read_guard on storage.objects
using (bucket_id <> 'member-content' or
       (name ~ '^(journal|radar)/.+' and (select public.member_has_access())
        and (select storage.allow_only_operation('object.get_authenticated'))));
commit;
