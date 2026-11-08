-- Additive migration for the inspected growfaster-prod schema. Run once.
-- Existing page_sections and media data are retained. No content is published here.
begin;
create table public.cms_publications (
 section_id uuid primary key references public.page_sections(id) on delete restrict,
 page_slug text not null,
 section_key text not null,
 content jsonb not null,
 published_at timestamptz not null default now(),
 unique(page_slug,section_key)
);
create table public.cms_versions (
 id bigint generated always as identity primary key,
 section_id uuid not null references public.page_sections(id) on delete restrict,
 content jsonb not null,
 published_by uuid not null references auth.users(id),
 published_at timestamptz not null default now()
);
alter table public.cms_publications enable row level security;
alter table public.cms_versions enable row level security;
revoke all on public.cms_publications,public.cms_versions from public,anon,authenticated;
grant select on public.cms_publications to anon,authenticated;
grant select on public.cms_versions to authenticated;
create policy published_read on public.cms_publications for select to anon,authenticated using(true);
create policy admin_read on public.cms_versions for select to authenticated using((select private.is_cms_admin()));

create function public.cms_save_section(section_id uuid,expected_updated_at timestamptz,content jsonb)
returns public.page_sections language plpgsql security definer set search_path='' as $$
declare current_row public.page_sections; result public.page_sections;
begin
 if not private.is_cms_admin() then raise insufficient_privilege using message='CMS administrator required'; end if;
 select * into strict current_row from public.page_sections p where p.id=section_id for update;
 if current_row.updated_at is distinct from expected_updated_at then raise exception using errcode='40001',message='Content changed; reload'; end if;
 if jsonb_typeof(content->'heading') is distinct from 'object' or jsonb_typeof(content->'body') is distinct from 'object'
 or jsonb_typeof(content->'settings') is distinct from 'object' or octet_length(content::text)>262144 then raise check_violation using message='Invalid section'; end if;
 update public.page_sections p set heading=content->'heading',body=content->'body',settings=content->'settings',status='draft',updated_at=clock_timestamp() where p.id=section_id returning * into result;
 return result;
end $$;

create function public.cms_publish_section(section_id uuid,expected_updated_at timestamptz)
returns public.cms_publications language plpgsql security definer set search_path='' as $$
declare draft public.page_sections; result public.cms_publications; field jsonb;
begin
 if not private.is_cms_admin() then raise insufficient_privilege using message='CMS administrator required'; end if;
 select * into strict draft from public.page_sections p where p.id=section_id for update;
 if draft.updated_at is distinct from expected_updated_at then raise exception using errcode='40001',message='Content changed; reload'; end if;
 if jsonb_typeof(draft.settings->'fields') is distinct from 'object' then raise check_violation using message='No website fields'; end if;
 for field in select value from jsonb_each(draft.settings->'fields') loop
  if field->>'type'='text' then
   if jsonb_typeof(field->'nl') is distinct from 'string' or jsonb_typeof(field->'fr') is distinct from 'string' or btrim(field->>'nl')='' or btrim(field->>'fr')='' then raise check_violation using message='Dutch and French text required'; end if;
  elsif field->>'type'='media' then
   if coalesce(field->>'path','') !~ '^[a-f0-9-]+\.(jpg|png|webp|avif|mp4)$' or not exists(select 1 from storage.objects o where o.bucket_id='cms-media' and o.name=field->>'path') then raise check_violation using message='Upload missing'; end if;
  else raise check_violation using message='Unknown field type'; end if;
 end loop;
 insert into public.cms_versions(section_id,content,published_by) values(draft.id,to_jsonb(draft),auth.uid());
 insert into public.cms_publications(section_id,page_slug,section_key,content) values(draft.id,draft.page_slug,draft.section_key,to_jsonb(draft))
 on conflict on constraint cms_publications_pkey do update set content=excluded.content,published_at=clock_timestamp() returning * into result;
 return result;
end $$;
revoke all on function public.cms_save_section(uuid,timestamptz,jsonb),public.cms_publish_section(uuid,timestamptz) from public,anon;
grant execute on function public.cms_save_section(uuid,timestamptz,jsonb),public.cms_publish_section(uuid,timestamptz) to authenticated;

-- Create PRIVATE cms-media bucket through the Storage dashboard/API before use:
-- 25 MB limit; image/jpeg,image/png,image/webp,image/avif,video/mp4 only.
-- No overwrite/delete policy: published URLs remain immutable.
create policy cms_private_insert on storage.objects for insert to authenticated
 with check(bucket_id='cms-media' and (select private.is_cms_admin()) and name ~ '^[a-f0-9-]+\.(jpg|png|webp|avif|mp4)$');
create policy cms_private_admin_read on storage.objects for select to authenticated
 using(bucket_id='cms-media' and (select private.is_cms_admin()));
create policy cms_public_media_read on storage.objects for select to anon,authenticated
 using(bucket_id='cms-media' and exists(select 1 from public.cms_publications p,jsonb_each(p.content->'settings'->'fields') f where f.value->>'type'='media' and f.value->>'path'=name));
commit;
