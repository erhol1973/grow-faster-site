'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname,'../assets/member-auth.js'),'utf8');
const testProject = 'gqsvoioccvklzfmdmexy';
const prodProject = 'dbooobckaqbkrmkpcuem';

function storage() {
  const values = new Map();
  return { getItem:k=>values.get(k) || null, setItem:(k,v)=>values.set(k,v), removeItem:k=>values.delete(k) };
}

function environment({host='localhost',project=testProject,admin=false,confirmed=true,member=true}={}) {
  let now = Date.now();
  const calls = [];
  const window = {GF_CMS_CONFIG:{url:'https://'+project+'.supabase.co',key:'sb_publishable_demo'},dispatchEvent(){}};
  const location = { origin:'https://'+host, pathname:'/account.html', search:'', hash:'' };
  const sessionStorage = storage(), localStorage = storage();
  async function fetch(url, options) {
    const target = new URL(url);
    calls.push({target,options});
    let result = {};
    if (target.pathname.endsWith('/token')) result = {access_token:'fixture',expires_in:300};
    if (target.pathname.endsWith('/user')) result = {id:'member-id',email:'reader@example.test',email_confirmed_at:confirmed?'2026-11-12':null};
    if (target.pathname.endsWith('member_has_access')) result = member;
    if (target.pathname.endsWith('cms_is_admin')) result = admin;
    return {ok:true,status:200,json:async()=>result};
  }
  const context = {window,location,sessionStorage,localStorage,fetch,URL,URLSearchParams,Headers,AbortSignal,crypto,Event,
    Date:class extends Date { static now(){return now;} }, setTimeout:()=>1,clearTimeout(){},
    document:{documentElement:{lang:'nl'}},history:{replaceState(){location.hash='';}}};
  vm.runInNewContext(source,context);
  const api = window.GFMember;
  function emailCallback(type) {
    const url = new URL(calls.at(-1).target.searchParams.get('redirect_to'));
    assert.equal(url.pathname,'/account');
    location.search=url.search;
    location.hash='#access_token=fixture&type='+type+'&expires_in=300';
  }
  return {api,calls,location,emailCallback,expire(){now+=300001;},revokeAdmin(){admin=false;},login:()=>api.login('reader@example.test','fixture')};
}

test('anonymous visitors cannot access protected content or request administrator credentials',async()=>{
  const {api,calls}=environment();
  assert.equal(await api.ready(),null);
  assert.equal(await api.getAdminSession(),null);
  await assert.rejects(api.request('/storage/v1/object/authenticated/member-content/journal/edition'));
  assert.equal(calls.length,0);
});
test('production keys are accepted only on the two exact production origins',async()=>{
  const e=environment({project:prodProject});
  assert.equal(e.api.available,false);
  await assert.rejects(e.login());
  assert.equal(e.calls.length,0);
  for(const host of ['grow-faster.be','www.grow-faster.be']) {
    assert.equal(environment({project:prodProject,host}).api.available,true);
  }
});
test('unconfirmed identity cannot acquire a session',async()=>{
  const e=environment({confirmed:false});
  await assert.rejects(e.login());
  assert.equal(await e.api.ready(),null);
});
test('server membership refusal denies access',async()=>{
  const e=environment({member:false});
  await assert.rejects(e.login());
  assert.equal(await e.api.ready(),null);
});
test('members can request protected resources and receive no administrator session',async()=>{
  const e=environment();
  await e.login();
  assert.equal((await e.api.ready()).id,'member-id');
  assert.equal(await e.api.getAdminSession(),null);
  await e.api.request('/storage/v1/object/authenticated/member-content/journal/edition');
  assert.equal(e.calls.at(-1).options.headers.get('Authorization'),'Bearer fixture');
  await assert.rejects(e.api.request('https://example.org'));
});
test('administrator privilege is checked again on handoff and fails after revocation',async()=>{
  const e=environment({admin:true});
  await e.login();
  assert.equal((await e.api.getAdminSession()).token,'fixture');
  e.revokeAdmin();
  assert.equal(await e.api.getAdminSession(),null);
});
test('expiry blocks any further resource request',async()=>{
  const e=environment();
  await e.login();
  e.expire();
  const before=e.calls.length;
  await assert.rejects(e.api.request('/rest/v1/articles'));
  assert.equal(await e.api.ready(),null);
  assert.equal(e.calls.length,before);
});
test('logout discards the current tab session and calls scoped revocation',async()=>{
  const e=environment();
  await e.login();
  await e.api.logout();
  assert.equal(e.calls.at(-1).target.searchParams.get('scope'),'local');
  assert.equal(await e.api.ready(),null);
});
test('return links preserve edition, page and language while blocking external redirects',()=>{
  const {api}=environment();
  for(const url of ['https://example.org','//example.org','/a/..//example.org','/admin.html','/account','/\\example.org']) {
    assert.equal(api.cleanReturn(url),'/');
  }
  assert.equal(api.cleanReturn('/journal-fr.html#page-3'),'/journal-fr.html#page-3');
});
test('unsolicited recovery callback is rejected before any network request',async()=>{
  const e=environment();
  e.location.hash='#access_token=fixture&expires_in=300&type=recovery';
  await assert.rejects(e.api.callback());
  assert.equal(e.calls.length,0);
  assert.equal(await e.api.ready(),null);
});
test('confirmed signup with matching browser state returns to the requested edition',async()=>{
  const e=environment();
  assert.equal(await e.api.emailFlow('signup','reader@example.test','fixture','/journal-fr.html#page-3','fr'),false);
  e.emailCallback('signup');
  const callback=await e.api.callback();
  assert.equal(callback.mode,'signup');
  assert.equal(callback.returnTo,'/journal-fr.html#page-3');
  assert.equal(e.location.hash,'');
  assert.equal((await e.api.ready()).id,'member-id');
});
test('matching recovery link allows changing the password and signs out afterwards',async()=>{
  const e=environment();
  await e.api.emailFlow('recover','reader@example.test',null,'/','nl');
  e.emailCallback('recovery');
  assert.equal((await e.api.callback()).mode,'recover');
  await e.api.resetPassword('example passphrase');
  assert.ok(e.calls.some(c=>c.target.pathname==='/auth/v1/user' && c.options.method==='PUT'));
  assert.equal(await e.api.ready(),null);
});
test('callback is single-use and account flow types cannot be interchanged',async()=>{
  const e=environment();
  await e.api.emailFlow('signup','reader@example.test','fixture','/','nl');
  e.emailCallback('recovery');
  await assert.rejects(e.api.callback());
  e.location.hash='#access_token=fixture&type=signup&expires_in=300';
  await assert.rejects(e.api.callback());
  assert.equal(await e.api.ready(),null);
});
