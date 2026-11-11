-- Use deterministic HTTP 409 for optimistic conflicts; 40001 is retried by PostgREST 14.
begin;
create or replace function public.cms_save_section(section_id uuid,expected_updated_at timestamptz,content jsonb)
returns public.page_sections language plpgsql security definer set search_path='' as $$
declare current_row public.page_sections; result public.page_sections;
begin
 if not private.is_cms_admin() then raise insufficient_privilege using message='CMS administrator required'; end if;
 select * into strict current_row from public.page_sections p where p.id=section_id for update;
 if current_row.updated_at is distinct from expected_updated_at then raise exception using errcode='PT409',message='Content changed; reload'; end if;
 if jsonb_typeof(content->'heading') is distinct from 'object' or jsonb_typeof(content->'body') is distinct from 'object'
 or jsonb_typeof(content->'settings') is distinct from 'object' or octet_length(content::text)>262144 then raise check_violation using message='Invalid section'; end if;
 update public.page_sections p set heading=content->'heading',body=content->'body',settings=content->'settings',status='draft',updated_at=clock_timestamp() where p.id=section_id returning * into result;
 return result;
end $$;

create or replace function public.cms_publish_section(section_id uuid,expected_updated_at timestamptz)
returns public.cms_publications language plpgsql security definer set search_path='' as $$
declare draft public.page_sections; result public.cms_publications; field jsonb;
begin
 if not private.is_cms_admin() then raise insufficient_privilege using message='CMS administrator required'; end if;
 select * into strict draft from public.page_sections p where p.id=section_id for update;
 if draft.updated_at is distinct from expected_updated_at then raise exception using errcode='PT409',message='Content changed; reload'; end if;
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
commit;
