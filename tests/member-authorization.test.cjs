'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {PGlite} = require('@electric-sql/pglite');

test('member access with the existing CMS roles and private Storage policies', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  const migration = name => fs.readFileSync(name, 'utf8');
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (
      id uuid primary key, email text, email_confirmed_at timestamptz,
      is_anonymous boolean default false, deleted_at timestamptz, banned_until timestamptz
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    grant usage on schema auth,public to anon,authenticated,service_role;
    create schema storage;
    -- Match the real helper definitions exported from growfaster-test. The
    -- gateway must supply storage.operation; these tests do not prove it does.
    create function storage.operation() returns text language plpgsql stable as $$
    begin
      return current_setting('storage.operation',true);
    end;
    $$;
    create function storage.allow_only_operation(expected_operation text)
    returns boolean language sql stable as $$
      with current_operation as (
        select storage.operation() as raw_operation
      ), normalized as (
        select
          case when raw_operation like 'storage.%' then substr(raw_operation,9)
               else raw_operation end as current_operation,
          case when expected_operation like 'storage.%' then substr(expected_operation,9)
               else expected_operation end as requested_operation
        from current_operation
      )
      select case
        when requested_operation is null or requested_operation = '' then false
        else coalesce(current_operation = requested_operation,false)
      end
      from normalized
    $$;
    create table storage.buckets (id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
    alter table storage.buckets enable row level security;
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;
    grant select,insert,update,delete on storage.buckets,storage.objects to anon,authenticated;
  `);
  await db.exec(migration('tests/support/cms-existing-schema.sql'));
  await db.exec(migration('supabase/migrations/20261108_cms_publications.sql'));
  await db.exec(migration('supabase/migrations/20261109_cms_conflict_http409.sql'));
  await db.exec(migration('supabase/migrations/20261112_member_content.sql'));

  const uuid = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
  const member = uuid(1), admin = uuid(2);
  await db.exec(`
    insert into auth.users(id,email,email_confirmed_at,is_anonymous,deleted_at,banned_until) values
      ('${member}','reader@example.test',now(),false,null,null),
      ('${admin}','admin@example.test',now(),false,null,null),
      ('${uuid(3)}','pending@example.test',null,false,null,null),
      ('${uuid(4)}',null,now(),true,null,null),
      ('${uuid(5)}','deleted@example.test',now(),false,now(),null),
      ('${uuid(6)}','banned@example.test',now(),false,null,now()+interval '1 day');
    insert into private.cms_admins(user_id) values ('${admin}');
    insert into storage.objects(bucket_id,name) values ('member-content','journal/edition.json'),
          ('member-content','radar/current.json'),('member-content','staging/draft.json');
  `);
  const value = async sql => (await db.query(sql)).rows[0].v;
  const role = async (name, id = '', operation = 'storage.object.get_authenticated') => {
    await db.exec(`reset role; set role ${name};`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    if (operation !== null) await db.query("select set_config('storage.operation',$1,false)",[operation]);
  };
  const readable = () => value("select count(*)::int as v from storage.objects where bucket_id='member-content'");
  const denied = async sql => assert.rejects(db.exec(sql), error => error.code === '42501');

  // Run before setting the custom GUC: RESET changes a known custom setting
  // to an empty string and would no longer test the genuinely absent case.
  await t.test('a confirmed member is denied when the gateway supplies no operation',async () => {
    await role('authenticated',member,null);
    assert.equal(await value('select storage.operation() as v'),null);
    assert.equal(await value('select public.member_has_access() as v'),true);
    assert.equal(await value("select storage.allow_only_operation('object.get_authenticated') as v"),false);
    assert.equal(await readable(),0);
    await db.exec('reset role');
  });
  await t.test('both real download operation spellings allow the member to read',async () => {
    for (const operation of ['storage.object.get_authenticated','object.get_authenticated']) {
      await role('authenticated',member,operation);
      for (const expected of ['storage.object.get_authenticated','object.get_authenticated']) {
        assert.equal(await value("select storage.allow_only_operation('" + expected + "') as v"),true);
      }
      assert.equal(await readable(),2);
    }
    for (const expected of [null,'','object']) {
      const result = await db.query('select storage.allow_only_operation($1) as v',[expected]);
      assert.equal(result.rows[0].v,false);
    }
    await db.exec('reset role');
  });
  await t.test('the additive fix admits the real metadata request while retaining membership checks',async () => {
    // The deployed gateway first requested /object/info/authenticated/... .
    // The old guard hides that existing object despite a valid member identity.
    await role('authenticated',member,'object.get_authenticated_info');
    assert.equal(await value('select public.member_has_access() as v'),true);
    assert.equal(await readable(),0);
    await db.exec('reset role');
    await db.exec(migration('supabase/migrations/20261113_member_download_info.sql'));
    for (const operation of ['object.get_authenticated_info','storage.object.get_authenticated_info',
                             'object.get_authenticated','storage.object.get_authenticated']) {
      for (const [name,id,expected] of [['anon','',0],['authenticated',uuid(3),0],
                                      ['authenticated',member,2],['authenticated',admin,2]]) {
        await role(name,id,operation);
        assert.equal(await readable(),expected,name + ' ' + operation);
      }
    }
    await db.exec('reset role');
  });
  await t.test('private bucket accepts only the expected content types and configured size',async () => {
    const result = await db.query("select public,file_size_limit::int,allowed_mime_types from storage.buckets where id='member-content'");
    assert.deepEqual(result.rows, [{public:false,file_size_limit:26214400,allowed_mime_types:['application/json','application/pdf','image/webp']}]);
  });
  await t.test('visitors cannot call the membership function or read either product',async () => {
    await role('anon');
    await denied('select public.member_has_access()');
    assert.equal(await readable(),0);
  });
  for (const [number, description] of [[3,'unconfirmed email'],[4,'anonymous Auth account'],[5,'soft-deleted user'],[6,'banned user'],[7,'unknown user']]) {
    await t.test(description + ' cannot retrieve either product', async () => {
      await role('authenticated',uuid(number));
      assert.equal(await value('select public.member_has_access() as v'),false);
      assert.equal(await readable(),0);
    });
  }
  await t.test('confirmed member can read both products but cannot promote themselves or operate the CMS',async () => {
    await role('authenticated',member);
    assert.equal(await value('select public.member_has_access() as v'),true);
    assert.equal(await readable(),2);
    assert.equal(await value('select public.cms_is_admin() as v'),false);
    await denied(`insert into private.cms_admins(user_id) values ('${member}')`);
    await denied(`select public.cms_publish_section('${uuid(9)}',now())`);
    await denied(`select public.cms_save_section('${uuid(9)}',now(),'{}')`);
  });
  await t.test('the existing CMS administrator keeps their rights and guest access remains separate', async () => {
    await role('authenticated',admin);
    assert.equal(await value('select public.cms_is_admin() as v'),true);
    assert.equal(await readable(),2);
    await role('anon');
    assert.equal(await readable(),0);
  });
  await t.test('members cannot mint bearer download URLs, list objects or access the table outside Storage',async () => {
    await role('authenticated',member);
    for (const op of ['object.sign','storage.object.sign','object.sign_many','storage.object.sign_many','object.list','storage.object.list','object.head_authenticated_info','storage.object.head_authenticated_info','storage.object.list_v2','storage.s3.object.get','']) {
      await db.query("select set_config('storage.operation',$1,false)",[op]);
      assert.equal(await readable(),0);
    }
  });
  await t.test('even a permissive policy cannot expose books to visitors or permit reader writes and bucket changes',async () => {
    await db.exec(`reset role;
      create policy other_object_rule on storage.objects for all to anon,authenticated using(true) with check(true);
      create policy other_bucket_rule on storage.buckets for all to anon,authenticated using(true) with check(true);`);
    for (const [name,id,expected] of [['anon','',0],['authenticated',uuid(3),0],['authenticated',member,2],['authenticated',admin,2]]) {
      await role(name,id);
      assert.equal(await readable(),expected);
      await denied("insert into storage.objects(bucket_id,name) values('member-content','radar/fake.json')");
      await db.exec("delete from storage.objects where bucket_id='member-content'; update storage.objects set name='changed' where bucket_id='member-content'; update storage.buckets set public=true where id='member-content';");
      assert.equal(await value("select public as v from storage.buckets where id='member-content'"),false);
    }
    await db.exec('reset role');
    assert.equal(await readable(),3);
    assert.equal(await value("select count(*)::int as v from storage.objects where name='changed'"),0);
  });
});
