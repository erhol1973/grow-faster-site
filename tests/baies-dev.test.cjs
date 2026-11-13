'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const core=require('../assets/baies-dev-core.js');
const data=require('../assets/baies-dev-data.js');
const html=fs.readFileSync(path.join(root,'executive-radar','index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'assets/baies-dev-app.js'),'utf8');

test('BAEIS dev: five unique, evidence-linked source records',()=>{
  assert.equal(data.records.length,5);
  assert.equal(new Set(data.records.map(r=>r.id)).size,data.records.length);
  for(const record of data.records){
    assert.deepEqual(core.checkRecord(record),[],record.id);
    assert.ok(core.sourceIsApproved(record.url));
    assert.ok(record.published<=data.snapshotDate,'future dated claim');
    assert.ok(record.claim.nl.length>30);
    assert.ok(record.limit.fr.length>30);
    assert.ok(record.decision.nl.length>30);
  }
});

test('BAEIS dev: signal score is deterministic and bounded',()=>{
  assert.equal(core.scoreSignal({belgium:0,value:0,urgency:0,evidence:0,cross:0}),0);
  assert.equal(core.scoreSignal({belgium:5,value:5,urgency:5,evidence:5,cross:5}),100);
  assert.equal(Object.values(core.weights).reduce((a,b)=>a+b,0),100);
  assert.throws(()=>core.scoreSignal({belgium:6,value:3,urgency:3,evidence:3,cross:3}),RangeError);
  assert.throws(()=>core.scoreSignal({belgium:NaN,value:3,urgency:3,evidence:3,cross:3}),RangeError);
  assert.throws(()=>core.scoreSignal({belgium:2.5,value:3,urgency:3,evidence:3,cross:3}),RangeError);
});

test('BAEIS dev: malicious/unsanctioned URLs rejected',()=>{
  assert.equal(core.sourceIsApproved('https://statbel.fgov.be.evil.example/claim'),false);
  assert.equal(core.sourceIsApproved('http://statbel.fgov.be/claim'),false);
  assert.equal(core.sourceIsApproved('https://test:test@statbel.fgov.be/claim'),false);
  assert.equal(core.sourceIsApproved('javascript:alert(1)'),false);
  assert.equal(core.sourceIsApproved('https://www.nbb.be/nl'),true);
});

test('BAEIS dev: review state machine requires each step',()=>{
  const r=data.records[0];
  assert.equal(core.nextStage('intake',r),'source-checked');
  assert.equal(core.nextStage('source-checked',r),'challenge-checked');
  assert.equal(core.nextStage('challenge-checked',r),'preview-approved');
  assert.throws(()=>core.nextStage('preview-approved',r),/blocked/i);
  assert.throws(()=>core.nextStage('published',r),/blocked/i);
  const corrupt={...r,url:'https://unapproved.example.org/news'};
  assert.throws(()=>core.nextStage('intake',corrupt),/evidence/i);
});

test('BAEIS dev: external publishing stays prohibited even after preview approval',()=>{
  assert.equal(core.canPublishExternally('preview-approved'),false);
  assert.equal(core.canPublishExternally('admin'),false);
  assert.match(html,/<button[^>]*id="external-publish"[^>]*disabled/i);
  assert.doesNotMatch(app,/(fetch\s*\(|XMLHttpRequest|sendBeacon|\.post\s*\()/i);
  assert.doesNotMatch(app,/localStorage|sessionStorage/i);
  assert.match(html,/noindex,nofollow,noarchive/);
});

test('BAEIS dev: strategic and sector filters produce expected subsets',()=>{
  const ceo=core.filterRecords(data.records,'CEO','All','');
  assert.ok(ceo.length>=3);
  assert.ok(ceo.every(r=>r.roles.includes('CEO')));
  const manufacturing=core.filterRecords(data.records,'ALL','Manufacturing','');
  assert.equal(manufacturing.length,1);
  assert.equal(manufacturing[0].id,'BE-EC-004');
  assert.equal(core.filterRecords(data.records,'CIO','Manufacturing','').length,0);
  assert.equal(core.filterRecords(data.records,'ALL','All','non-existent-keyword').length,0);
});

test('BAEIS dev: isolated NL/FR accessible markup and static asset linkage',()=>{
  assert.match(html,/lang="nl-BE"/);
  for(const view of ['overview','dashboard','radar','evidence','editorial']){
    assert.match(html,new RegExp(`id="${view}"`));
    assert.match(html,new RegExp(`data-view="${view}"`));
  }
  assert.match(html,/<main id="main"/);
  assert.match(html,/id="language-switch"/);
  assert.doesNotMatch(html,/id="(?:about|heading-about|signup-[^"]+)"/);
  assert.match(html,/role="status"/);
  assert.match(html,/assets\/baies-dev\.css/);
  for(const asset of ['baies-dev.css','baies-dev-core.js','baies-dev-data.js','baies-dev-app.js'])assert.ok(fs.statSync(path.join(root,'assets',asset)).isFile());
});
test('BAEIS branding: exact solid four-bar transparent logo variants and favicon',()=>{
  for(const [variant,ink] of [['dark','#0B2545'],['white','#FFFFFF']]){
    const svg=fs.readFileSync(path.join(root,'img',`baies-dev-logo-${variant}.svg`),'utf8');
    const bars=svg.match(/<g id="grow-faster-bars"[^>]*>([\s\S]*?)<\/g>/);assert.ok(bars,'four-bar symbol group');assert.equal((bars[1].match(/<path /g)||[]).length,4);
    assert.match(svg,/>Grow Faster<\/(?:text|title)>/);
    assert.ok(svg.includes(`fill="${ink}"`));
    assert.match(svg,/fill="#2189E1"/);
    assert.doesNotMatch(svg,/gradient|filter|opacity|<image|<script|stroke=/i);
    const png=fs.readFileSync(path.join(root,'img',`baies-dev-logo-${variant}.png`));
    assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(png[25],6,'RGBA transparent PNG');
  }
  assert.match(html,/rel="icon"[^>]*baies-dev-favicon.svg/);
  assert.match(html,/class="brand-logo"[^>]*baies-dev-logo-white.svg/);
  const css=fs.readFileSync(path.join(root,'assets/baies-dev.css'),'utf8');
  assert.match(css,/--brand-navy:#0B2545/);
  assert.match(css,/--brand-blue:#2189E1/);
  assert.match(css,/font-family:"Aptos","Hanken Grotesk","Segoe UI",Helvetica,Arial,sans-serif/);
  assert.match(css,/--text-body:17px/);
});

test('BAEIS navigation: isolated native routes, explicit locale choice and safe disclosure',()=>{
  for(const view of ['overview','dashboard','radar','evidence','editorial'])assert.match(html,new RegExp(`<a href="#${view}" data-view="${view}"`));
  assert.match(html,/id="navigation-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="product-links"/);
  for(const lang of ['nl','fr'])assert.match(html,new RegExp(`data-language="${lang}"`));
  assert.match(html,/baies-dev-logo-white\.svg/);
  assert.match(html,/<noscript>/);
  assert.doesNotMatch(app,/localStorage|sessionStorage|fetch\s*\(/);
});

test('BAEIS workspace: bilingual claim search and immutable, deterministic sorting',()=>{
  const before=structuredClone(data.records);
  const ids=mode=>core.sortRecords(data.records,mode).map(r=>r.id);
  assert.deepEqual(ids('priority'),['BE-EC-003','BE-EC-004','BE-AI-001','BE-AI-002','BE-SME-005']);
  assert.deepEqual(ids('date'),['BE-EC-004','BE-SME-005','BE-EC-003','BE-AI-002','BE-AI-001']);
  assert.deepEqual(ids('source'),['BE-EC-003','BE-EC-004','BE-AI-001','BE-SME-005','BE-AI-002']);
  assert.deepEqual(core.filterRecords(data.records,'ALL','All','exploitables').map(r=>r.id),['BE-AI-002']);
  assert.deepEqual(core.filterRecords(data.records,'CFO','Manufacturing','BE-EC-004').map(r=>r.id),['BE-EC-004']);
  assert.throws(()=>core.sortRecords(data.records,'invented'),RangeError);
  assert.deepEqual(data.records,before);
});


test('BAEIS D: AI/IA concepts, word prefixes and bilingual IDs do not produce substring noise',()=>{
  const ids=(q,role='ALL',sector='All')=>core.filterRecords(data.records,role,sector,q).map(r=>r.id);
  assert.deepEqual(ids('AI','CFO'),['BE-AI-001','BE-AI-002']);
  assert.deepEqual(ids('IA','CFO'),ids('AI','CFO'));
  assert.deepEqual(ids(' ai '),ids('IA'));
  assert.deepEqual(ids('factur'),[]);
  assert.deepEqual(ids('comptaient'),['BE-SME-005']);
  assert.deepEqual(ids('exploitables'),['BE-AI-002']);
  assert.deepEqual(ids('BE-EC-004'),['BE-EC-004']);
  assert.deepEqual(ids('BE-EC'),['BE-EC-003','BE-EC-004']);
  assert.deepEqual(ids('Manufacturing'),['BE-EC-004']);
  assert.deepEqual(ids('industrie'),['BE-EC-004']);
  assert.deepEqual(ids('économie trimestre'),['BE-EC-004']);
  assert.deepEqual(ids('AI','CFO','Manufacturing'),[]);
  assert.deepEqual(ids('!!!'),[]);
  assert.deepEqual(ids(''),data.records.map(r=>r.id));
});

test('BAEIS D: CFO relevance expands without changing any source facts or scores',()=>{
  assert.equal(core.filterRecords(data.records,'CFO','All','').length,5);
  for(const id of ['BE-AI-001','BE-AI-002'])assert.ok(data.records.find(r=>r.id===id).roles.includes('CFO'));
  const facts=data.records.map(({roles,...record})=>record);
  const hash=require('node:crypto').createHash('sha256').update(JSON.stringify(facts)).digest('hex');
  assert.equal(hash,'259f0cc62a53269aa2adc7dbda082c45498a5307c56396067fd4603202961676','fixed source facts remain identical to tested C');
});

test('BAEIS D: research plans distinguish size, role and unknown business values',()=>{
  const record=data.records[0],before=structuredClone(record);
  const small=core.decisionPlan(record,'CEO','small');
  const medium=core.decisionPlan(record,'CEO','medium');
  const large=core.decisionPlan(record,'CFO','large');
  assert.match(small.measure.nl,/minuten per handeling/);
  assert.match(medium.measure.fr,/par équipe/);
  assert.match(large.measure.nl,/per eenheid/);
  assert.match(large.owner.fr,/financier/);
  assert.match(large.horizon.nl,/onafhankelijke beoordeling/);
  assert.match(small.owner.nl,/nog te bevestigen/);
  assert.notDeepEqual(small.measure,medium.measure);
  assert.notDeepEqual(medium.measure,large.measure);
  assert.equal(large.recordId,'BE-AI-001');
  assert.throws(()=>core.decisionPlan(record,'admin','small'),RangeError);
  assert.throws(()=>core.decisionPlan(record,'CEO','invented'),RangeError);
  assert.throws(()=>core.decisionPlan({id:'BE-UNKNOWN-999'},'CEO','small'),RangeError);
  assert.deepEqual(record,before);
});

// Production integration uses main's existing server/build and never exposes repo reports.
test('BAEIS production artifact: isolated public route, complete assets and no test/report publication',async()=>{
  const {createServer}=require('../scripts/server.cjs');const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  try{
    const canonical=await (await fetch(base+'/executive-radar/')).text();assert.match(canonical,/<title>Executive Radar \| Grow Faster<\/title>/);assert.doesNotMatch(canonical,/BAEIS|Belgian AI Economic Intelligence System/);assert.match(canonical,/class="identity" href="\.\.\/index\.html\?lang=nl"/);
    for(const route of ['/executive-radar/','/executive-radar/?lang=nl','/executive-radar/?lang=fr','/baies-dev/','/baies-dev/?lang=nl','/baies-dev/?lang=fr']){const r=await fetch(base+route);assert.equal(r.status,200,route);const body=await r.text();assert.equal(body,canonical,'canonical and legacy route bytes');assert.match(body,/data-i18n="dev">DEMONSTRATIE/);assert.match(body,/id="heading-dashboard"/);assert.match(body,/id="company-size"/);assert.match(body,/noindex,nofollow,noarchive/);assert.doesNotMatch(body,/id="(?:about|heading-about|signup-[^"]+)"|href="#about"|roadmapKicker|signupTitle/);}
    for(const asset of ['baies-dev.css','baies-dev-core.js','baies-dev-data.js','baies-dev-app.js'])assert.equal((await fetch(base+'/assets/'+asset)).status,200,asset);
    for(const asset of ['logo-dark.svg','logo-white.svg','logo-dark.png','logo-white.png','favicon.svg','favicon.png'])assert.equal((await fetch(base+'/img/baies-dev-'+asset)).status,200,asset);
    for(const route of ['/docs/BAEIS-D-FOLLOWUP.md','/tests/baies-dev.test.cjs','/reports/unit.xml'])assert.equal((await fetch(base+route)).status,404,route);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});

// The owner removed the internal product roadmap and newsletter consent prototype from public navigation.
test('Executive Radar public surface excludes internal about and newsletter prototype',()=>{
  // Old cached app code still bound the removed signup form unconditionally.
  // Its URL must change with this DOM removal so existing visitors fetch the matching runtime.
  assert.match(html,/<script defer src="\.\.\/assets\/baies-dev-app\.js\?v=20261113-public-about"><\/script>/);
  assert.doesNotMatch(html,/id="(?:about|heading-about|signup-[^"]+)"|href="#about"|data-view="about"|Over Executive Radar|Product Owner|sprint-grid|next-stage/);
  assert.doesNotMatch(app,/navModel|roadmapKicker|roadmapTitle|roadmapSub|s[1-4](?:Title|Text|Done)|nextTitle|nextBody|signupTitle|signupDesc|signupMessage|signup-form|signup-feedback|testSignup|toestemmingsprototype|test de consentement/);
  assert.match(app,/const views=\['overview','dashboard','radar','evidence','editorial'\]/);
  assert.match(html,/Demonstratie · Vaste referentiedata/);
});

const publicPolicy=require('../scripts/baies-dev-public-policy.cjs');
const policyFs=require('node:fs'),policyOs=require('node:os'),policyPath=require('node:path'),policyCp=require('node:child_process');
const policyRoot=policyPath.resolve(__dirname,'..');
function policyTemp(t){const directory=policyFs.mkdtempSync(policyPath.join(policyOs.tmpdir(),'gf-radar-public-policy-'));t.after(()=>{const resolved=policyPath.resolve(directory),temp=policyPath.resolve(policyOs.tmpdir())+policyPath.sep;assert.ok(resolved.startsWith(temp)&&policyPath.basename(resolved).startsWith('gf-radar-public-policy-'));policyFs.rmSync(resolved,{recursive:true,force:true});});return directory;}

test('Radar publication policy rejects old NL/FR internal About labels, routes, roadmap markup and escaped runtime copy under any filename',()=>{
  const fixtures=[
    ['executive-radar/index.html','<nav id="product-links"><a href="#about">Info</a></nav><section id="about"></section>'],
    ['baies-dev/index.html','<section id="about">Legacy</section>'],
    ['duplicate.html','<nav id=product-links><a href=#about>Info</a></nav><section id=about></section>'],
    ['other.js',"const target='/baies-dev/?lang=fr#about';"],
    ['old-override.js',"const x={nextBody:'Een werkende multi-agentruntime, automatische wetenschappelijke factchecking'};"],
    ['archive/renamed.htm','<h1>Over Executive Radar</h1>'],
    ['archive/renamed-fr.html','<h1>À propos d’Executive Radar</h1>'],
    ['archive/earlier.html','<p>Over BAEIS</p>'],
    ['archive/earlier-fr.html','<p>À propos de BAEIS</p>'],
    ['duplicates/copy.html','<div class="sprint-grid"><article>SPRINT 01</article></div>'],
    ['page.html','<p>Product Owner · 4 Sprint Proof of Concept</p>'],
    ['page-fr.html','<p>Product Owner · Prototype en 4 sprints</p>'],
    ['unknown-runtime.js',"const copy={roadmapTitle:'Van fundament tot gecontroleerde MVP.'};"],
    ['bundle.data','<html><script>const copy={roadmapKicker:"Product Owner"};</script></html>'],
    ['escaped.js',String.raw`const x={"roadmap\u0054itle":"hidden old title"};`],
    ['encoded.html','<h1>Over Executive&#32;Radar</h1>'],
    ['old-fr.js',"const x='Quatre incréments réunis dans un environnement isolé.';"],
    ['old-nl.js',"const x='Vier doelgerichte increments binnen één geïsoleerde ontwikkelroute.';"],
    ['assets/baies-dev-app.js',"const x={nextBody:'Internal future plan'};"],
    ['another.js',"window.BAEIS_DEV_DATA={};const views=['overview','about'];"]
  ];
  for(const [name,text]of fixtures){assert.ok(publicPolicy.inspectPublicText(name,text).length>0,name);assert.ok(require('../scripts/security.cjs').inspectText(name,text).length>0,name+' security boundary');}
});

test('Radar publication policy permits normal company About pages, books about sprints and unused legacy CSS selectors',()=>{
  for(const [name,text]of [
    ['about.html','<main id="about" data-id="product-links"><h1>Over ons bedrijf</h1><a href="#about">Ons verhaal</a><p>Onze product owner begeleidt sprints.</p></main>'],
    ['boek/index.html','<h1>Four sprints to a better operating model</h1><p>SPRINT 01: learn. De volgende sprint begint later.</p>'],
    ['assets/book.js',"const nextTitle='Chapter 2';const views=['cover','about'];"],
    ['assets/baies-dev.css','.sprint-grid{display:grid}.next-stage{color:navy}.signup form{display:grid}'],
    ['executive-radar/index.html',html],['assets/baies-dev-app.js',app]
  ])assert.deepEqual(publicPolicy.inspectPublicText(name,text),[],name);
});

test('Radar publication policy walks all artifact text, including renamed copies, extensionless payloads and post-build tampering',t=>{
  const dir=policyTemp(t);policyFs.mkdirSync(policyPath.join(dir,'archive'),{recursive:true});policyFs.writeFileSync(policyPath.join(dir,'about.html'),'<h1>Our company</h1>');assert.deepEqual(publicPolicy.scanPublicArtifact(dir),[]);
  const copy=policyPath.join(dir,'archive','old-copy.payload');policyFs.writeFileSync(copy,' '.repeat(5000)+'<html><h1>Over Executive Radar</h1></html>');
  assert.ok(publicPolicy.scanPublicArtifact(dir).some(message=>message.includes('archive/old-copy.payload')));assert.throws(()=>publicPolicy.assertPublicArtifact(dir),{code:'RADAR_INTERNAL_CONTENT'});assert.ok(require('../scripts/security.cjs').scan(dir).length>0);
  policyFs.rmSync(copy);policyFs.writeFileSync(policyPath.join(dir,'archive','renamed.mjs'),"const copy={roadmapSub:'old private process'};");assert.ok(publicPolicy.scanPublicArtifact(dir).some(message=>message.includes('renamed.mjs')));
  assert.ok(publicPolicy.scanPublicArtifact(policyPath.join(dir,'missing')).length>0);
  const linkedRoot=policyPath.join(dir,'linked-artifact'),privateDir=policyPath.join(dir,'non-public');policyFs.mkdirSync(linkedRoot);policyFs.mkdirSync(privateDir);policyFs.symlinkSync(privateDir,policyPath.join(linkedRoot,'escape'),'junction');assert.ok(publicPolicy.scanPublicArtifact(linkedRoot).some(message=>message.includes('symbolic link rejected')));assert.throws(()=>publicPolicy.assertPublicArtifact(linkedRoot),{code:'RADAR_INTERNAL_CONTENT'});
});

test('Radar build publishes only a complete policy-approved artifact and removes staged output on internal content rejection',t=>{
  const fixture=policyTemp(t);policyFs.mkdirSync(policyPath.join(fixture,'scripts'));policyFs.mkdirSync(policyPath.join(fixture,'tests'));policyFs.writeFileSync(policyPath.join(fixture,'tests/legacy-redirects.json'),'[]');
  for(const file of ['build.cjs','file-reader.cjs','baies-dev-public-policy.cjs'])policyFs.copyFileSync(policyPath.join(policyRoot,'scripts',file),policyPath.join(fixture,'scripts',file));
  // Use the real build allowlist to construct a minimal input tree; assertions exercise its actual CLI.
  const source=policyFs.readFileSync(policyPath.join(policyRoot,'scripts/build.cjs'),'utf8'),expression=source.match(/^const files = (.+);$/m)[1];
  const files=require('node:vm').runInNewContext(expression,{require:id=>{assert.equal(id,'../tests/legacy-redirects.json');return [];}});
  for(const file of files){const dest=policyPath.join(fixture,file);policyFs.mkdirSync(policyPath.dirname(dest),{recursive:true});policyFs.writeFileSync(dest,file==='executive-radar/index.html'?html:'');}
  for(const directory of ['assets','media','boek','img','books'])policyFs.mkdirSync(policyPath.join(fixture,directory),{recursive:true});policyFs.writeFileSync(policyPath.join(fixture,'assets/i18n.js'),'window.I18N={};\nwindow.I18N_HTML={};\n');
  const run=()=>policyCp.spawnSync(process.execPath,['scripts/build.cjs'],{cwd:fixture,encoding:'utf8'});
  let result=run();assert.equal(result.status,0,result.stderr);const destination=policyPath.join(fixture,'dist');assert.ok(policyFs.existsSync(policyPath.join(destination,'executive-radar/index.html')));assert.equal(policyFs.readFileSync(policyPath.join(destination,'baies-dev/index.html'),'utf8'),html);
  const contaminated=policyPath.join(fixture,'assets','copy-of-old-runtime.js');policyFs.writeFileSync(contaminated,"const old={roadmapTitle:'Internal roadmap'};");result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/public-content policy rejected/);assert.equal(policyFs.existsSync(destination),false,'rejected output must not remain deployable');assert.deepEqual(policyFs.readdirSync(fixture).filter(name=>name.startsWith('.dist-build-')),[],'failed staging is cleaned');
  policyFs.rmSync(contaminated);policyFs.writeFileSync(policyPath.join(fixture,'executive-radar/index.html'),'<main id="product-links"><a href="#about">Private flow</a></main>');result=run();assert.notEqual(result.status,0);assert.equal(policyFs.existsSync(destination),false);assert.match(result.stderr,/removed Radar About route/);
  policyFs.writeFileSync(policyPath.join(fixture,'executive-radar/index.html'),html);assert.equal(run().status,0);policyFs.rmSync(policyPath.join(fixture,'index.html'));result=run();assert.notEqual(result.status,0);assert.equal(policyFs.existsSync(destination),false,'a missing source must leave no deployable dist');assert.deepEqual(policyFs.readdirSync(fixture).filter(name=>name.startsWith('.dist-build-')),[]);
});

test('Radar public payload verification accepts a real same-origin response and rejects redirects before any foreign request',async t=>{
  const http=require('node:http'),{request}=require('playwright'),{getRadarPublicPayload}=require('../scripts/verify-production.cjs');let foreignRequests=0,localRequests=0,api;
  const foreign=http.createServer((req,res)=>{foreignRequests++;res.writeHead(200,{'Content-Type':'text/javascript'});res.end('window.foreign=true;');});
  const primary=http.createServer((req,res)=>{localRequests++;if(req.url==='/redirect.js'){res.writeHead(302,{Location:'http://127.0.0.1:'+foreign.address().port+'/foreign.js'});return res.end();}res.writeHead(200,{'Content-Type':'text/javascript'});res.end('window.publicRadar=true;');});
  t.after(async()=>{if(api)await api.dispose();for(const server of [primary,foreign]){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}});
  await new Promise(resolve=>foreign.listen(0,'127.0.0.1',resolve));await new Promise(resolve=>primary.listen(0,'127.0.0.1',resolve));api=await request.newContext();const base='http://127.0.0.1:'+primary.address().port;
  const safe=await getRadarPublicPayload(api,base+'/safe.js',base);assert.equal(await safe.text(),'window.publicRadar=true;');assert.equal(new URL(safe.url()).origin,base);
  await assert.rejects(getRadarPublicPayload(api,base+'/redirect.js',base),/HTTP 302/);assert.equal(foreignRequests,0,'a rejected redirect must not have contacted its foreign destination');
  await assert.rejects(getRadarPublicPayload(api,'http://127.0.0.1:'+foreign.address().port+'/foreign.js',base),/Unexpected external/);assert.equal(foreignRequests,0);assert.equal(localRequests,2);
});
