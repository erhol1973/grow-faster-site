-- Readers share a private editorial library. CMS administration is independent.
begin;

create function public.member_has_access() returns boolean
language sql stable security definer set search_path = ''
as $$
 select exists (
   select 1 from auth.users u
   where u.id = (select auth.uid())
     and u.email_confirmed_at is not null
     and u.is_anonymous is false
     and u.deleted_at is null
     and (u.banned_until is null or u.banned_until <= now())
 )
$$;
revoke all on function public.member_has_access() from public, anon;
grant execute on function public.member_has_access() to authenticated;

-- A name collision aborts the whole migration instead of adopting existing content.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('member-content', 'member-content', false, 26214400,
        array['application/json', 'application/pdf', 'image/webp']);

create policy member_content_read on storage.objects for select to authenticated
using (bucket_id = 'member-content' and name ~ '^(journal|radar)/.+'
       and (select public.member_has_access()));

-- Restrictive rules also protect this dedicated bucket if another policy is permissive.
create policy member_content_no_guest on storage.objects as restrictive for all to anon
using (bucket_id <> 'member-content') with check (bucket_id <> 'member-content');

create policy member_content_read_guard on storage.objects as restrictive for select to authenticated
using (bucket_id <> 'member-content' or
       (name ~ '^(journal|radar)/.+' and (select public.member_has_access())
        and (select storage.allow_only_operation('object.get_authenticated'))));

create policy member_content_no_insert on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'member-content');
create policy member_content_no_update on storage.objects as restrictive for update to authenticated
using (bucket_id <> 'member-content') with check (bucket_id <> 'member-content');
create policy member_content_no_delete on storage.objects as restrictive for delete to authenticated
using (bucket_id <> 'member-content');

-- A browser user must not be able to make the private bucket public, even with
-- an unrelated permissive rule for other buckets. Storage administrators provision it.
create policy member_bucket_no_insert on storage.buckets as restrictive for insert to anon, authenticated
with check (id <> 'member-content');
create policy member_bucket_no_update on storage.buckets as restrictive for update to anon, authenticated
using (id <> 'member-content') with check (id <> 'member-content');
create policy member_bucket_no_delete on storage.buckets as restrictive for delete to anon, authenticated
using (id <> 'member-content');

commit;
