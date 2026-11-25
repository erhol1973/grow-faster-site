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
// Coherence for kmo's (23 Nov 2026): the approved page has 33 editable fields instead of 76, so the site total fell from 605 to 562.
// Release 2 (23 Nov 2026): Insights for kmo's has 66 editable fields instead of 203 (three articles instead of six, NL/FR via the
// dictionary instead of duplicated language blocks) and Bedrijfsontwikkeling gains 2; the total is 427. Lower bound 400, owner approval required.
test('catalog field IDs resolve once in source and CMS scripts never publish draft data in static output',()=>{const c={window:{}};vm.runInNewContext(fs.readFileSync('assets/cms-catalog.js','utf8'),c);/* Sponsor decision 25 Nov 2026: the content studio holds exactly the menu pages; the seven old English pages left it. */ assert.deepEqual(Array.from(c.window.GF_CMS_CATALOG,p=>p.page),['home','orion','automatisering','coherence','training','insights','about']);for(const old of ['books','approach','operating-model','process','value','transformation','workshop'])assert.ok(!c.window.GF_CMS_CATALOG.some(p=>p.page===old),old);let count=0;for(const page of c.window.GF_CMS_CATALOG){const html=fs.readFileSync(page.route,'utf8');const keys=[...html.matchAll(/data-cms="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(keys).size,keys.length);assert.deepEqual(keys.slice().sort(),Array.from(page.fields,f=>f.key).sort());count+=keys.length;}assert.ok(count>=300,'menu pages keep their editable fields: '+count);/* 25 Nov 2026: 323 after removing the old pages (was >400). */assert.equal(fs.existsSync('dist/supabase'),false);assert.match(fs.readFileSync('dist/admin.html','utf8'),/noindex,nofollow/);});

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
 // Customer homepage (24 Nov 2026): hero, four application cards, experience, systems and decisions, pilot (the pyramid is fixed markup, not CMS-editable) and the optional video slot.
 // "Herkenbaar?" and "Zo werkt Orion" left the homepage on the owner's decision; the application cards link to orion.html, where the steps and the film live.
 // Homepage redesign (25 Nov 2026, BRIEF.md IA): hero, apps (cards with today/prep/keep), recurring work, approach, eyebrows of the
 // fixed pyramid and figures blocks, trust and video; 85 fields. Sponsor decision 25 Nov 2026 10:11: #proof ("Ervaring uit de praktijk") and #final ("Test Orion op uw eigen vragenlijsten") removed from the homepage (6 more retired keys).
 const groups=[
  [0,3,[]],[4,34,[]],[35,63,[]],[64,72,[]],[73,74,[]],
  [75,83,[]],[84,84,[]]
 ];
 const declared=[...script.slice(script.indexOf('const homeGroups=['),script.indexOf('];',script.indexOf('const homeGroups=['))).matchAll(/from:(\d+),to:(\d+)(?:,extra:\[([\d,]*)\])?/g)].map(m=>[+m[1],+m[2],m[3]?m[3].split(',').map(Number):[]]);
 assert.deepEqual(declared,groups,'the editor declares exactly the tested homepage groups');
 const indices=groups.flatMap(([start,end,extra])=>[...Array.from({length:end-start+1},(_,i)=>start+i),...extra]);
 assert.equal(new Set(indices).size,home.fields.length,'every homepage field must appear in precisely one group');
 assert.deepEqual(indices.slice().sort((a,b)=>a-b),Array.from({length:home.fields.length},(_,i)=>i));
 // Each editor group holds the fields of its own block (25 Nov 2026), so a shifted index cannot silently regroup texts.
 const prefixes=[/^(f7a4946dfd792-0|home-orion-hero-|home-v2-hero-)/,/^(home-v2-apps-|home-apps-[1-4]-h$)/,/^home-v2-rec-/,/^home-v2-aanpak-/,/^home-v2-(fundament|kloof)-eyebrow$/,/^(home-v2-trust-|home-orion-trust-|home-trust-)/,/^cms-video-home$/];
 groups.forEach(([start,end],g)=>{for(let i=start;i<=end;i++)assert.match(home.fields[i].key,prefixes[g],`group ${g}: ${home.fields[i].key}`)});
 for(const retired of ['home-apps-h','home-apps-p','home-apps-1-p','home-apps-2-p','home-apps-3-p','home-apps-4-p','home-apps-pilot-h','home-apps-pilot-p','home-v2-proof-eyebrow','home-orion-proof-h','home-orion-proof-p','home-v2-final-eyebrow','home-orion-pilot-h','home-orion-pilot-p'])assert.ok(!home.fields.some(f=>f.key===retired),`retired key ${retired} (old CMS overlays must not overwrite new text)`);
});

test('CMS publication requires a reviewed saved revision and explicit confirmation',()=>{
 const source=fs.readFileSync('assets/cms-admin.js','utf8');
 assert.match(source,/previewedRevision=null,previewedSection=null/);
 assert.match(source,/if\(previewedSection!==selected\.id\|\|previewedRevision!==selected\.updated_at\)/);
 assert.match(source,/window\.confirm\('Deze wijziging wordt zichtbaar voor alle bezoekers/);
 assert.match(source,/if\(!dirty\)\{previewedSection=selected\.id;previewedRevision=selected\.updated_at;\}/);
 assert.match(source,/records=await client\.list\(\);selected=records\.find\(record=>record\.id===selected\.id\)/);
});

// Defect found 25 Nov 2026: coherence.html and insights.html were in the catalog but had lost the public loader in their
// 23 Nov rewrites, so published edits never appeared. Every catalog page must carry its page id, the loader and a video slot.
test('every content-studio page loads published CMS content on the public page',()=>{
 const c={window:{}};vm.runInNewContext(fs.readFileSync('assets/cms-catalog.js','utf8'),c);
 for(const page of c.window.GF_CMS_CATALOG){const html=fs.readFileSync(page.route,'utf8');
  assert.match(html,new RegExp(`<body data-cms-page="${page.page}"`),page.route);
  const order=['assets/cms-config.js','assets/cms-client.js','assets/cms-public.js'].map(s=>html.indexOf('src="'+s));
  assert.ok(order.every(i=>i>0)&&order[0]<order[1]&&order[1]<order[2],`${page.route}: CMS loader in order`);
  assert.ok(html.indexOf('src="assets/site.js')<order[0],`${page.route}: loader after site.js`);
  assert.match(html,new RegExp(`data-cms="cms-video-${page.page}"`),page.route);
 }
 // The new menu pages (sponsor decision 25 Nov 2026) are editable.
 for(const route of ['orion.html','automatisering.html','training.html'])assert.ok(c.window.GF_CMS_CATALOG.some(p=>p.route===route),route);
});
