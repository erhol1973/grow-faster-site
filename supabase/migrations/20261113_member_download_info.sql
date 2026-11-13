-- The Storage download gateway also checks authenticated object metadata.
-- Keep signed URLs, listing, anonymous reads and writes outside this allowlist.
begin;

alter policy member_content_read_guard on storage.objects
using (bucket_id <> 'member-content' or
       (name ~ '^(journal|radar)/.+' and (select public.member_has_access())
        and ((select storage.allow_only_operation('object.get_authenticated'))
             or (select storage.allow_only_operation('object.get_authenticated_info')))));

commit;
