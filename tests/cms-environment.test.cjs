'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('assets/cms-config.js','utf8');
function config(hostname,search=''){const context={window:{location:{hostname,search}}};vm.runInNewContext(source,context);return context.window.GF_CMS_CONFIG;}
test('CMS branch preview is bound to the isolated project for every page and ignores URL overrides',()=>{
 for(const search of ['', '?url=https://dbooobckaqbkrmkpcuem.supabase.co','?lang=fr&cms-preview=1']){
  const c=config('feature-secure-supabase-cms.grow-faster-site.pages.dev',search);
  assert.equal(c.url,'https://gqsvoioccvklzfmdmexy.supabase.co');assert.equal(c.recoveryEnabled,false);assert.ok(Object.isFrozen(c));
 }
});
test('member preview and local development use the isolated project',()=>{
 for(const hostname of ['dev-member-access.grow-faster-site.pages.dev','localhost','127.0.0.1','[::1]']){
  const c=config(hostname,'?cms-prod=1');assert.equal(c.url,'https://gqsvoioccvklzfmdmexy.supabase.co');
  assert.match(c.key,/^sb_publishable_/);assert.equal(c.recoveryEnabled,false);
 }
});
test('production domains keep the production configuration',()=>{
 for(const hostname of ['grow-faster.be','www.grow-faster.be']){
  const c=config(hostname,'?cms-test=1');assert.equal(c.url,'https://dbooobckaqbkrmkpcuem.supabase.co');assert.equal(c.recoveryEnabled,true);
 }
});
test('unknown deployments and lookalike domains cannot connect to either backend',async()=>{
 const {createClient}=require('../assets/cms-client.js');
 for(const hostname of ['1a2b3c4d.grow-faster-site.pages.dev','grow-faster.be.attacker.test','dev-member-access.grow-faster-site.pages.dev.attacker.test']){
  const c=config(hostname,'?cms-test=1');assert.equal(c.key,'');assert.equal(c.recoveryEnabled,false);
  let requests=0;
  await assert.rejects(createClient(c,()=>{requests++;}).published('home'));
  assert.equal(requests,0);
 }
});
test('admin CSP permits isolated Auth and media without wildcard Supabase origins',()=>{
 const html=fs.readFileSync('admin.html','utf8'),policy=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
 for(const directive of ['connect-src','img-src','media-src'])assert.ok(policy.split(';').find(p=>p.trim().startsWith(directive+' ')).includes('https://gqsvoioccvklzfmdmexy.supabase.co'));
 assert.ok(!policy.includes('*.supabase.co'));
});
