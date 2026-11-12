'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createClient}=require('../assets/cms-client.js');
const config={url:'https://dbooobckaqbkrmkpcuem.supabase.co',key:'public-test-key'};
const response=(value,status=200)=>({ok:status<400,status,json:async()=>value});
test('CMS refuses absent configuration and private requests without a session',async()=>{const client=createClient({...config,key:''},()=>{throw Error('must not send')});await assert.rejects(client.list(),/sleutel/);await assert.rejects(createClient(config).list(),/sessie/);assert.throws(()=>createClient({...config,url:'http://attacker.test'}));});
test('password sign-in checks admin membership; ordinary users cannot retain the session',async()=>{const calls=[];const client=createClient(config,async(url,options)=>{calls.push([url,options]);return response(url.includes('/token')?{access_token:'test-token',expires_in:60}:false);});await assert.rejects(client.login('reader@example.test','synthetic'),/beheerdersrechten/);await assert.rejects(client.list(),/sessie/);assert.equal(calls.length,2);assert.equal(calls[1][1].headers.Authorization,'Bearer test-token');});
test('draft save and publish are separate authenticated operations with a revision precondition',async()=>{const calls=[];const client=createClient(config,async(url,options)=>{calls.push([url,options]);return response(url.includes('/token')?{access_token:'test-token',expires_in:60}:true);});await client.login('admin@example.test','synthetic');await client.save('id','revision',{settings:{fields:{}}});assert.ok(calls.at(-1)[0].endsWith('cms_save_section'));assert.deepEqual(JSON.parse(calls.at(-1)[1].body),{section_id:'id',expected_updated_at:'revision',content:{settings:{fields:{}}}});await client.publish('id','revision');assert.ok(calls.at(-1)[0].endsWith('cms_publish_section'));await client.published('home');assert.equal(calls.at(-1)[1].headers.Authorization,undefined);await client.logout();await assert.rejects(client.list(),/sessie/);});
test('conflicts are actionable and rejected media never reaches storage',async()=>{const client=createClient(config,async()=>response({code:'40001'},400));await assert.rejects(client.request('/test'),/elders gewijzigd/);for(const file of [{type:'image/svg+xml',size:100},{type:'video/mp4',size:26214401},{type:'image/jpeg',size:0}])await assert.rejects(client.upload(file),/maximaal/);await assert.rejects(client.media('../private.pdf'),/mediapad/);});
test('accepted uploads use distinct immutable paths, authenticated writes and no overwrite header',async()=>{const calls=[];const client=createClient(config,async(url,options)=>{calls.push([url,options]);return response(url.includes('/token')?{access_token:'upload-test',expires_in:60}:true);});await client.login('admin@example.test','synthetic');const first=await client.upload({type:'image/jpeg',size:100}),second=await client.upload({type:'video/mp4',size:200});assert.match(first,/^[a-f0-9-]+\.jpg$/);assert.match(second,/^[a-f0-9-]+\.mp4$/);assert.notEqual(first,second);for(const [url,options]of calls.slice(-2)){assert.ok(url.includes('/object/cms-media/'));assert.equal(options.method,'POST');assert.equal(options.headers.Authorization,'Bearer upload-test');assert.equal(options.headers['x-upsert'],undefined);}});
test('catalog field IDs resolve once in source and CMS scripts never publish draft data in static output',()=>{const c={window:{}};vm.runInNewContext(fs.readFileSync('assets/cms-catalog.js','utf8'),c);assert.equal(c.window.GF_CMS_CATALOG.length,11);let count=0;for(const page of c.window.GF_CMS_CATALOG){const html=fs.readFileSync(page.route,'utf8');const keys=[...html.matchAll(/data-cms="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(keys).size,keys.length);assert.deepEqual(keys.slice().sort(),Array.from(page.fields,f=>f.key).sort());count+=keys.length;}assert.ok(count>600);assert.equal(fs.existsSync('dist/supabase'),false);assert.match(fs.readFileSync('dist/admin.html','utf8'),/noindex,nofollow/);});

test('CMS admin uses Grow Faster logo and searchable fields while retaining save/preview/publish controls',()=>{
 const html=fs.readFileSync('admin.html','utf8');
 const css=fs.readFileSync('assets/cms-admin.css','utf8');
 const script=fs.readFileSync('assets/cms-admin.js','utf8');
 assert.match(html,/src="img\/grow-faster-logo-light\.svg" alt="Grow Faster" width="192" height="32"/);
 assert.match(css,/\.top\{[^}]*background:#fff/);
 assert.match(html,/id="field-search"/);
 assert.match(html,/id="field-count"/);
 for(const id of ['save','preview','publish'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(css,/#0b3a7d/);
 assert.match(script,/function filterFields\(\)/);
 assert.match(script,/section\.hidden=!match/);
 assert.match(script,/filterFields\(\);/);
 assert.match(script,/for\(const field of definition\.fields\)/);
});

test('CMS page selector preserves all field values while showing one homepage section',()=>{
 const html=fs.readFileSync('admin.html','utf8');
 const script=fs.readFileSync('assets/cms-admin.js','utf8');
 const catalogSource=fs.readFileSync('assets/cms-catalog.js','utf8');
 const context={window:{}};vm.runInNewContext(catalogSource,context);
 const home=context.window.GF_CMS_CATALOG.find(page=>page.page==='home');
 assert.ok(home);
 assert.match(html,/id="field-group"/);
 assert.match(script,/function sectionOptions\(\)/);
 assert.match(script,/definition\.page==='home'\?'hero':'all'/);
 assert.match(script,/const match=textMatch&&\(term\?true:groupMatch\)/);
 assert.match(script,/section\.hidden=!match/);
 assert.match(script,/for\(const field of definition\.fields\)/);
 const groups=[
  [0,1,[44]],[2,9,[]],[10,17,[47]],[18,24,[]],
  [25,35,[45,46]],[36,38,[]],[39,41,[]],[42,43,[]],[48,48,[]]
 ];
 const indices=groups.flatMap(([start,end,extra])=>[...Array.from({length:end-start+1},(_,i)=>start+i),...extra]);
 assert.equal(new Set(indices).size,home.fields.length,'every homepage field must appear in precisely one group');
 assert.deepEqual(indices.slice().sort((a,b)=>a-b),Array.from({length:home.fields.length},(_,i)=>i));
});

test('CMS publication requires a reviewed saved revision and explicit confirmation',()=>{
 const source=fs.readFileSync('assets/cms-admin.js','utf8');
 assert.match(source,/previewedRevision=null,previewedSection=null/);
 assert.match(source,/if\(previewedSection!==selected\.id\|\|previewedRevision!==selected\.updated_at\)/);
 assert.match(source,/window\.confirm\('Deze wijziging wordt zichtbaar voor alle bezoekers/);
 assert.match(source,/if\(!dirty\)\{previewedSection=selected\.id;previewedRevision=selected\.updated_at;\}/);
 assert.match(source,/records=await client\.list\(\);selected=records\.find\(record=>record\.id===selected\.id\)/);
});
