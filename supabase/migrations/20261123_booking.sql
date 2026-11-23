-- Own appointment booking for afspraak.html. Additive; touches no CMS data.
-- Personal data lives in the private schema, which the Data API does not expose.
-- Public access goes only through the booking Edge Function (service role).
begin;

create table private.booking_appointments (
 id uuid primary key default gen_random_uuid(),
 start_at timestamptz not null,
 end_at timestamptz not null,
 topic text not null check (topic in ('algemeen','vragenlijsten','workflow','organisatie','training')),
 full_name text not null check (char_length(full_name) between 2 and 120),
 email text not null check (char_length(email) between 5 and 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
 phone text not null check (char_length(phone) between 6 and 40),
 organisation text not null check (char_length(organisation) between 1 and 160),
 job_title text not null check (char_length(job_title) between 1 and 120),
 note text check (char_length(note) <= 2000),
 lang text not null default 'nl' check (lang in ('nl','fr')),
 status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
 mailed boolean not null default false,
 created_at timestamptz not null default now(),
 cancelled_at timestamptz,
 check (end_at > start_at)
);
-- Two clients can never hold the same hour.
create unique index booking_one_per_slot on private.booking_appointments(start_at) where status = 'confirmed';

create table private.booking_blocks (
 id bigint generated always as identity primary key,
 start_at timestamptz not null,
 end_at timestamptz not null,
 note text check (char_length(note) <= 200),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 check (end_at > start_at)
);

create table private.booking_attempts (
 ip_hash text not null,
 at timestamptz not null default now()
);
create index booking_attempts_ip on private.booking_attempts(ip_hash, at);

revoke all on private.booking_appointments, private.booking_blocks, private.booking_attempts from public, anon, authenticated;

-- Busy periods for the slot calculation. No personal data leaves this function.
create function public.booking_busy(range_start timestamptz, range_end timestamptz)
returns table(start_at timestamptz, end_at timestamptz) language sql stable security definer set search_path='' as $$
 select a.start_at, a.end_at from private.booking_appointments a
  where a.status = 'confirmed' and a.start_at < range_end and a.end_at > range_start
 union all
 select b.start_at, b.end_at from private.booking_blocks b
  where b.start_at < range_end and b.end_at > range_start
$$;

create function public.booking_create(details jsonb, ip_hash text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s timestamptz := (details->>'start_at')::timestamptz; e timestamptz; new_id uuid; recent int;
begin
 e := s + interval '1 hour';
 -- Retention: appointments are kept for 12 months, attempts for one day.
 delete from private.booking_appointments where start_at < now() - interval '12 months';
 delete from private.booking_attempts where at < now() - interval '1 day';
 select count(*) into recent from private.booking_attempts a where a.ip_hash = booking_create.ip_hash and a.at > now() - interval '1 hour';
 if recent >= 5 then return jsonb_build_object('ok', false, 'error', 'rate'); end if;
 insert into private.booking_attempts(ip_hash) values (booking_create.ip_hash);
 if s < now() + interval '24 hours' or s > now() + interval '9 weeks' then return jsonb_build_object('ok', false, 'error', 'slot'); end if;
 perform pg_advisory_xact_lock(hashtext('booking'));
 if exists (select 1 from private.booking_blocks b where b.start_at < e and b.end_at > s)
 or exists (select 1 from private.booking_appointments a where a.status = 'confirmed' and a.start_at < e and a.end_at > s) then
  return jsonb_build_object('ok', false, 'error', 'taken');
 end if;
 insert into private.booking_appointments(start_at, end_at, topic, full_name, email, phone, organisation, job_title, note, lang)
 values (s, e, details->>'topic', btrim(details->>'full_name'), lower(btrim(details->>'email')), btrim(details->>'phone'),
         btrim(details->>'organisation'), btrim(details->>'job_title'), nullif(btrim(details->>'note'), ''), coalesce(details->>'lang', 'nl'))
 returning id into new_id;
 return jsonb_build_object('ok', true, 'id', new_id);
end $$;

create function public.booking_mark_mailed(appointment_id uuid)
returns void language sql security definer set search_path='' as $$
 update private.booking_appointments set mailed = true where id = appointment_id
$$;

revoke all on function public.booking_busy(timestamptz, timestamptz), public.booking_create(jsonb, text), public.booking_mark_mailed(uuid) from public, anon, authenticated;
grant execute on function public.booking_busy(timestamptz, timestamptz), public.booking_create(jsonb, text), public.booking_mark_mailed(uuid) to service_role;

-- Administrator functions for admin-afspraken.html. Same allowlist as the CMS.
create function public.booking_admin_overview()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_cms_admin() then raise insufficient_privilege using message = 'Administrator required'; end if;
 return jsonb_build_object(
  'appointments', coalesce((select jsonb_agg(to_jsonb(a) order by a.start_at) from private.booking_appointments a where a.start_at > now() - interval '30 days'), '[]'::jsonb),
  'blocks', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'start_at', b.start_at, 'end_at', b.end_at, 'note', b.note) order by b.start_at) from private.booking_blocks b where b.end_at > now()), '[]'::jsonb));
end $$;

create function public.booking_admin_block(range_start timestamptz, range_end timestamptz, note text)
returns bigint language plpgsql security definer set search_path='' as $$
declare new_id bigint;
begin
 if not private.is_cms_admin() then raise insufficient_privilege using message = 'Administrator required'; end if;
 if range_end <= range_start or range_end - range_start > interval '60 days' then raise check_violation using message = 'Ongeldige periode'; end if;
 insert into private.booking_blocks(start_at, end_at, note, created_by) values (range_start, range_end, nullif(btrim(note), ''), auth.uid()) returning id into new_id;
 return new_id;
end $$;

create function public.booking_admin_unblock(block_id bigint)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_cms_admin() then raise insufficient_privilege using message = 'Administrator required'; end if;
 delete from private.booking_blocks where id = block_id;
end $$;

create function public.booking_admin_cancel(appointment_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_cms_admin() then raise insufficient_privilege using message = 'Administrator required'; end if;
 update private.booking_appointments set status = 'cancelled', cancelled_at = now() where id = appointment_id and status = 'confirmed';
end $$;

revoke all on function public.booking_admin_overview(), public.booking_admin_block(timestamptz, timestamptz, text), public.booking_admin_unblock(bigint), public.booking_admin_cancel(uuid) from public, anon;
grant execute on function public.booking_admin_overview(), public.booking_admin_block(timestamptz, timestamptz, text), public.booking_admin_unblock(bigint), public.booking_admin_cancel(uuid) to authenticated;
commit;
