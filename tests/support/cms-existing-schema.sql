-- Grow Faster CMS v1 | 2026-11-08
-- Run ONCE in a NEW/REVIEWED Supabase project. Existing tables are never dropped.
-- Transaction rolls back on conflict or error. Not a migration for the earlier manual table.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create table private.cms_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.cms_admins enable row level security;
revoke all on private.cms_admins from public, anon, authenticated;

create function private.is_cms_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from private.cms_admins a where a.user_id = (select auth.uid())) $$;
revoke all on function private.is_cms_admin() from public;
grant execute on function private.is_cms_admin() to authenticated;

create function public.cms_is_admin() returns boolean
language sql stable security invoker set search_path = ''
as $$ select private.is_cms_admin() $$;
revoke all on function public.cms_is_admin() from public;
grant execute on function public.cms_is_admin() to authenticated;

create function private.localized_text(value jsonb) returns boolean
language sql immutable set search_path = '' as $$
 select case when jsonb_typeof(value) <> 'object' then false else
   value ? 'nl' and value ? 'fr'
   and not exists(select 1 from jsonb_each(value) v where jsonb_typeof(v.value) <> 'string')
 end
$$;
revoke all on function private.localized_text(jsonb) from public;
grant execute on function private.localized_text(jsonb) to authenticated, service_role;

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
revoke all on function private.touch_updated_at() from public;

create table public.media_assets (
 id uuid primary key default gen_random_uuid(),
 storage_path text not null unique check (storage_path <> '' and storage_path !~ '^/'),
 alt_text jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(alt_text)),
 credit text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

-- contacts holds PUBLIC business contact details only; never incoming inquiries.
create table public.contacts (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('organisation','person')),
 display_name text not null check (btrim(display_name) <> ''),
 role_title jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(role_title)),
 email text,
 phone text,
 address jsonb not null default '{}' check (jsonb_typeof(address) = 'object'),
 links jsonb not null default '{}' check (jsonb_typeof(links) = 'object'),
 portrait_media_id uuid references public.media_assets(id) on delete restrict,
 status text not null default 'draft' check (status in ('draft','published','archived')),
 published_at timestamptz,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (status <> 'published' or published_at is not null)
);

create table public.site_settings (
 id smallint primary key default 1 check (id = 1),
 site_name text not null default 'Grow Faster',
 default_language text not null default 'nl' check (default_language in ('nl','fr')),
 tagline jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(tagline)),
 logo_media_id uuid references public.media_assets(id) on delete restrict,
 default_hero_media_id uuid references public.media_assets(id) on delete restrict,
 primary_contact_id uuid references public.contacts(id) on delete restrict,
 navigation jsonb not null default '[]' check (jsonb_typeof(navigation) = 'array'),
 ui_labels jsonb not null default '{}' check (jsonb_typeof(ui_labels) = 'object'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.services (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title jsonb not null check (private.localized_text(title)),
 summary jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(summary)),
 body jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(body)),
 cover_media_id uuid references public.media_assets(id) on delete restrict,
 status text not null default 'draft' check (status in ('draft','published','archived')),
 published_at timestamptz,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (status <> 'published' or (published_at is not null and btrim(title->>'nl') <> '' and btrim(title->>'fr') <> '')),
 icon_key text
);

create table public.testimonials (
 id uuid primary key default gen_random_uuid(),
 quote jsonb not null check (private.localized_text(quote)),
 person_name text not null check (btrim(person_name) <> ''),
 person_role jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(person_role)),
 organisation_name text,
 portrait_media_id uuid references public.media_assets(id) on delete restrict,
 service_id uuid references public.services(id) on delete set null,
 status text not null default 'draft' check (status in ('draft','published','archived')),
 published_at timestamptz,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (status <> 'published' or (published_at is not null and btrim(quote->>'nl') <> '' and btrim(quote->>'fr') <> ''))
);

create table public.case_studies (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title jsonb not null check (private.localized_text(title)),
 summary jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(summary)),
 body jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(body)),
 cover_media_id uuid references public.media_assets(id) on delete restrict,
 status text not null default 'draft' check (status in ('draft','published','archived')),
 published_at timestamptz,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (status <> 'published' or (published_at is not null and btrim(title->>'nl') <> '' and btrim(title->>'fr') <> '')),
 client_name text,
 sector text,
 service_id uuid references public.services(id) on delete set null,
 results jsonb not null default '[]' check (jsonb_typeof(results) = 'array')
);

create table public.blog_posts (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title jsonb not null check (private.localized_text(title)),
 summary jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(summary)),
 body jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(body)),
 cover_media_id uuid references public.media_assets(id) on delete restrict,
 status text not null default 'draft' check (status in ('draft','published','archived')),
 published_at timestamptz,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (status <> 'published' or (published_at is not null and btrim(title->>'nl') <> '' and btrim(title->>'fr') <> '')),
 author_contact_id uuid references public.contacts(id) on delete set null,
 service_id uuid references public.services(id) on delete set null,
 tags text[] not null default '{}',
 sources jsonb not null default '[]' check (jsonb_typeof(sources) = 'array'),
 seo_title jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(seo_title)),
 seo_description jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(seo_description))
);

-- Editable hero, footer, editorial paragraphs, CTA labels, legal pages, etc.
create table public.page_sections (
 id uuid primary key default gen_random_uuid(),
 page_slug text not null check (page_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 section_key text not null check (section_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 heading jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(heading)),
 body jsonb not null default '{"nl":"","fr":""}' check (private.localized_text(body)),
 media_id uuid references public.media_assets(id) on delete restrict,
 settings jsonb not null default '{}' check (jsonb_typeof(settings) = 'object'),
 status text not null default 'draft' check (status in ('draft','published','archived')),
 published_at timestamptz,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(page_slug,section_key),
 check (status <> 'published' or published_at is not null)
);

alter table public.media_assets enable row level security;
revoke all on public.media_assets from public, anon, authenticated;
grant select on public.media_assets to anon, authenticated;
grant insert, update, delete on public.media_assets to authenticated;
grant all on public.media_assets to service_role;
create trigger set_updated_at before update on public.media_assets
 for each row execute function private.touch_updated_at();
create policy cms_admin_all on public.media_assets for all to authenticated
 using ((select private.is_cms_admin())) with check ((select private.is_cms_admin()));
create policy public_read on public.media_assets for select to anon, authenticated using (true);

alter table public.site_settings enable row level security;
revoke all on public.site_settings from public, anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
create trigger set_updated_at before update on public.site_settings
 for each row execute function private.touch_updated_at();
create policy cms_admin_all on public.site_settings for all to authenticated
 using ((select private.is_cms_admin())) with check ((select private.is_cms_admin()));
create policy public_read on public.site_settings for select to anon, authenticated using (true);

alter table public.contacts enable row level security;
revoke all on public.contacts from public, anon, authenticated;
grant select on public.contacts to anon, authenticated;
grant insert, update, delete on public.contacts to authenticated;
grant all on public.contacts to service_role;
create trigger set_updated_at before update on public.contacts
 for each row execute function private.touch_updated_at();
create policy cms_admin_all on public.contacts for all to authenticated
 using ((select private.is_cms_admin())) with check ((select private.is_cms_admin()));
create policy published_read on public.contacts for select to anon, authenticated
 using (status = 'published' and published_at <= now());
create index contacts_publication_idx on public.contacts(status, published_at, sort_order);

alter table public.services enable row level security;
revoke all on public.services from public, anon, authenticated;
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
create trigger set_updated_at before update on public.services
 for each row execute function private.touch_updated_at();
create policy cms_admin_all on public.services for all to authenticated
 using ((select private.is_cms_admin())) with check ((select private.is_cms_admin()));
create policy published_read on public.services for select to anon, authenticated
 using (status = 'published' and published_at <= now());
create index services_publication_idx on public.services(status, published_at, sort_order);

alter table public.testimonials enable row level security;
revoke all on public.testimonials from public, anon, authenticated;
grant select on public.testimonials to anon, authenticated;
grant insert, update, delete on public.testimonials to authenticated;
grant all on public.testimonials to service_role;
create trigger set_updated_at before update on public.testimonials
 for each row execute function private.touch_updated_at();
create policy cms_admin_all on public.testimonials for all to authenticated
 using ((select private.is_cms_admin())) with check ((select private.is_cms_admin()));
create policy published_read on public.testimonials for select to anon, authenticated
 using (status = 'published' and published_at <= now());
create index testimonials_publication_idx on public.testimonials(status, published_at, sort_order);

alter table public.case_studies enable row level security;
revoke all on public.case_studies from public, anon, authenticated;
grant select on public.case_studies to anon, authenticated;
grant insert, update, delete on public.case_studies to authenticated;
grant all on public.case_studies to service_role;
create trigger set_updated_at before update on public.case_studies
 for each row execute function private.touch_updated_at();
create policy cms_admin_all on public.case_studies for all to authenticated
 using ((select private.is_cms_admin())) with check ((select private.is_cms_admin()));
create policy published_read on public.case_studies for select to anon, authenticated
 using (status = 'published' and published_at <= now());
create index case_studies_publication_idx on public.case_studies(status, published_at, sort_order);

alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from public, anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;
create trigger set_updated_at before update on public.blog_posts
 for each row execute function private.touch_updated_at();
create policy cms_admin_all on public.blog_posts for all to authenticated
 using ((select private.is_cms_admin())) with check ((select private.is_cms_admin()));
create policy published_read on public.blog_posts for select to anon, authenticated
 using (status = 'published' and published_at <= now());
create index blog_posts_publication_idx on public.blog_posts(status, published_at, sort_order);

alter table public.page_sections enable row level security;
revoke all on public.page_sections from public, anon, authenticated;
grant select on public.page_sections to anon, authenticated;
grant insert, update, delete on public.page_sections to authenticated;
grant all on public.page_sections to service_role;
create trigger set_updated_at before update on public.page_sections
 for each row execute function private.touch_updated_at();
create policy cms_admin_all on public.page_sections for all to authenticated
 using ((select private.is_cms_admin())) with check ((select private.is_cms_admin()));
create policy published_read on public.page_sections for select to anon, authenticated
 using (status = 'published' and published_at <= now());
create index page_sections_publication_idx on public.page_sections(status, published_at, sort_order);

create index blog_posts_tags_idx on public.blog_posts using gin(tags);
create index page_sections_page_idx on public.page_sections(page_slug,sort_order);
create index case_studies_service_idx on public.case_studies(service_id);
create index blog_posts_service_idx on public.blog_posts(service_id);
create index testimonials_service_idx on public.testimonials(service_id);
create index blog_posts_author_idx on public.blog_posts(author_contact_id);

-- Safety: existing Storage policies are permissive/OR-combined. Do not silently
-- add a restrictive-looking policy next to a broad pre-existing upload policy.
do $$ begin
 if exists(select 1 from pg_policies where schemaname='storage' and tablename='objects') then
  raise exception 'Existing Storage policies found. Review them before applying this fresh-project script; no policies have been deleted.';
 end if;
 if exists(select 1 from storage.buckets where id='media' and
  (file_size_limit is distinct from 26214400 or allowed_mime_types is distinct from
    array['image/jpeg','image/png','image/webp','image/avif','video/mp4','application/pdf'])) then
  raise exception 'Existing media bucket limits differ. Review its configuration before setup.';
 end if;
 if exists(select 1 from storage.buckets where id='media' and not public) then
  raise exception 'Existing media bucket is private. Do not automatically expose it.';
 end if;
end $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('media','media',true,26214400,array['image/jpeg','image/png','image/webp','image/avif','video/mp4','application/pdf'])
 on conflict(id) do nothing;
-- Public download needs no SELECT policy: public files are public by URL.
-- Admin SELECT is needed for management/listing and upsert.
create policy cms_media_admin_select on storage.objects for select to authenticated
 using (bucket_id='media' and (select private.is_cms_admin()));
create policy cms_media_admin_insert on storage.objects for insert to authenticated
 with check (bucket_id='media' and (select private.is_cms_admin()));
create policy cms_media_admin_update on storage.objects for update to authenticated
 using (bucket_id='media' and (select private.is_cms_admin()) and not exists
   (select 1 from public.media_assets m where m.storage_path=storage.objects.name))
 with check (bucket_id='media' and (select private.is_cms_admin()) and not exists
   (select 1 from public.media_assets m where m.storage_path=storage.objects.name));
create policy cms_media_admin_delete on storage.objects for delete to authenticated
 using (bucket_id='media' and (select private.is_cms_admin()) and not exists
   (select 1 from public.media_assets m where m.storage_path=storage.objects.name));

-- Bootstrap AFTER creating/inviting your user via Supabase Authentication.
-- Run in SQL Editor as postgres. Never grant users permission to self-promote.
-- insert into private.cms_admins(user_id)
-- select id from auth.users where email='YOUR-ADMIN-EMAIL' on conflict do nothing;
commit;
