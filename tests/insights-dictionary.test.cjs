'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const H=require('../scripts/coherence-dictionary.cjs'),floor=require('../scripts/coherence-dictionary.contract.json'),profile=require('../scripts/insights-dictionary.contract.json');
const root=path.resolve(__dirname,'..'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function parse(text){const m=text.match(/^window\.I18N=(\{[\s\S]*\});\s*window\.I18N_HTML=(\{[\s\S]*\});\s*$/);assert.ok(m);return{I18N:JSON.parse(m[1]),I18N_HTML:JSON.parse(m[2])};}
test('Insights721 preserves reviewed55 additions and all tuples/maps, allowing only the reviewed NL13 wording in existing profiles',()=>{
 const fullText=fs.readFileSync(path.join(root,'dist/assets/i18n.js'),'utf8'),text=fs.readFileSync(path.join(root,'dist/assets/i18n-insights.js'),'utf8'),full=parse(fullText),data=parse(text);
 H.assertRetentionFloor(floor);H.assertInsightsProfile(profile,floor,fs.readFileSync(path.join(root,'insights.html'),'utf8'));
 assert.equal(Object.keys(data.I18N).length,721);assert.equal(profile.additionalKeys.length,55);
 assert.equal(hash(JSON.stringify([...floor.retainedKeys,...profile.additionalKeys])),'278e43368ee63a0979c2cb99869046c3c28c2ec65bd60afc4ddca7e6a55f0bae');
 assert.deepEqual(Object.keys(data.I18N).sort(),[...floor.retainedKeys,...profile.additionalKeys].sort());
 for(const key of Object.keys(data.I18N))assert.deepEqual(data.I18N[key],full.I18N[key],key);
 assert.deepEqual(data.I18N_HTML,full.I18N_HTML);assert.equal(Object.keys(data.I18N_HTML).length,9);
 const coherence=fs.readFileSync(path.join(root,'dist/assets/i18n-coherence.js'),'utf8');
 for(const [body,expected,previous]of [[fullText,'abba28169e8b02803652e9d0ed682fe21c8fd3c353c046f6939ff8c43bd4a6ce','0e721329ce34801021836ccce221121ff381f20fdaf5b8cef7e7504a86d08e73'],[coherence,'c02690e90711593ccc2380f6a1ba8762f067fb0a9e08e65698a5a84b7131ddf7','3679a466ee6a6495acb98999262a46e717471b00e72fd0cca8d725eedb292ad7'],[text,'99e019e823b5dd9e8cdad221daaee99a750f4ca94588e7c362093ecb3ecca92d','3316f60b9545f6a695016ea348f6301d54e1626591b356c77d30e20f85f13aab']]){
  assert.equal(hash(body),expected,'reviewed serialized output profile');assert.equal(body.split('AI-agenten laten coördineren').length,2);
  assert.equal(hash(body.replace("AI-agenten laten coördineren","AI-agents laten coördineren")),{"abba28169e8b02803652e9d0ed682fe21c8fd3c353c046f6939ff8c43bd4a6ce":"65cb62da1b6dee7118ebfff37bf94b6d94dfb23f33289e14238642eda1dcd63b","c02690e90711593ccc2380f6a1ba8762f067fb0a9e08e65698a5a84b7131ddf7":"26b49b3f6f4f3b956520be2817963ab8686182d055dd17e89497d0ea51f61cfd","99e019e823b5dd9e8cdad221daaee99a750f4ca94588e7c362093ecb3ecca92d":"2787ab9a989ee8a982894c609178f302539ebd0df9c544547b1d7370f59f82f0"}[expected],'one wording reversal reconstructs exact ef238a2 serialized profile');
  assert.equal(hash(body.replace('AI-agenten laten coördineren','Agent-enablen')),previous,'reversing only the approved NL13 literal reconstructs the complete previous bytes');
  assert.deepEqual(parse(body).I18N['Agent-enable'],['AI-agenten laten coördineren','Confier aux agents']);
 }
 assert.ok(Buffer.byteLength(text)<=140000,'new scoped asset budget140KB; reviewed baseline133620B');
 const html=fs.readFileSync(path.join(root,'dist/insights.html'),'utf8'),tags=[...html.matchAll(/<script\b[^>]*src="([^"<>]+)"[^>]*>/g)].map(m=>m[0]);
 const dictionaries=tags.filter(t=>/i18n[^/]*\.js/.test(t));assert.equal(dictionaries.length,1);assert.match(dictionaries[0],new RegExp('defer src="assets/i18n-insights\\.js\\?v=insights-1-'+hash(text).slice(0,12)+'"'));
 assert.doesNotMatch(dictionaries[0],/fetchpriority|async/);assert.ok(tags.indexOf(dictionaries[0])<tags.findIndex(t=>/assets\/site\.js/.test(t)));
});
test('Insights fails closed for unreviewed append changes, computed inline lookups, extra runtimes and executable attributes',()=>{
 const html=fs.readFileSync(path.join(root,'insights.html'),'utf8');
 for(const keys of [profile.additionalKeys.slice(1),[...profile.additionalKeys,'new key'],[profile.additionalKeys[1],profile.additionalKeys[0],...profile.additionalKeys.slice(2)]])assert.throws(()=>H.assertInsightsProfile({...profile,additionalKeys:keys},floor,html),/retention profile/);
 for(const addition of ['<script>t(remoteLabel)</script>','<script defer src="assets/unreviewed.js"></script>'])assert.throws(()=>H.assertInsightsProfile(profile,floor,html.replace('</body>',addition+'</body>')),/script inventory/);
 for(const malformed of ['<script>t(remoteLabel)','<script/>','</script>'])assert.throws(()=>H.assertInsightsProfile(profile,floor,html+malformed),/unmatched opener or closer/);
 assert.throws(()=>H.assertInsightsProfile(profile,floor,html.replace('const articles=', 't(prefix+remote);const articles=')),/script inventory/);
 assert.throws(()=>H.assertInsightsProfile(profile,floor,html.replace('<body','<body onload="t(remote)"')),/unclassified executable/);
 for(const scheme of ['java&#x73;cript:t(remoteKey)','java&#115;cript:t(remoteKey)','java&#x09;script:t(remoteKey)','java&#10;script:t(remoteKey)','java&#13;script:t(remoteKey)'])assert.throws(()=>H.assertInsightsProfile(profile,floor,html.replace('</body>','<a href="'+scheme+'">Unclassified lookup</a></body>')),/unclassified executable/,'entity-encoded executable URL must fail before selection');
 const built=fs.readFileSync(path.join(root,'dist/insights.html'),'utf8');assert.doesNotThrow(()=>H.assertInsightsProfile(profile,floor,built,true));
 for(const [page,isBuilt]of [[html,false],[built,true]]){
  for(const closer of ['</ScRiPt>','</script >','</script\t>','</script\n>','</script\r>','</script\f>','</ScRiPt\t\n\r\f >'])assert.doesNotThrow(()=>H.assertInsightsProfile(profile,floor,page.replaceAll('</script>',closer),isBuilt),'canonical HTML whitespace/case must preserve all11 pinned blocks');
  for(const closer of ['</script\t\n bar>','</SCRIPT foo="bar">','</script foo=">">','</script/>','</script / >','</scriptx>','</ script>','</script\u00a0>','</script','</script\t\n'])assert.throws(()=>H.assertInsightsProfile(profile,floor,page.replace('</script>',closer),isBuilt),/script inventory/,'unreviewed/malformed closing syntax must not disappear from inventory');
  for(const orphan of ['</script>','</script\t\n bar>','</script\t','<script/>','<script>'])assert.throws(()=>H.assertInsightsProfile(profile,floor,page+orphan,isBuilt),/script inventory/,'orphan/incomplete tokens must remain accounted for');
 }
 for(const unsafe of ['java&#115cript:t(remoteKey)','java&#x73cript:t(remoteKey)'])for(const [page,isBuilt]of [[html,false],[built,true]])assert.throws(()=>H.assertInsightsProfile(profile,floor,page.replace('</body>','<a href="'+unsafe+'">Unclassified lookup</a></body>'),isBuilt),/Unknown entity/,'unsupported semicolonless numeric references must fail closed');
 assert.doesNotThrow(()=>H.assertInsightsProfile(profile,floor,built.replace('</body>','<p>&#115;afe &#x74;ext</p></body>'),true),'supported terminated numeric references remain valid');
 assert.throws(()=>H.assertInsightsProfile(profile,floor,built+' &futureUnknown;',true),/Unknown entity/,'built output must fail even when a finalizer introduced an unclassified entity');
 for(const mutated of [built.replace('</body>','<script defer src="assets/journal.js"></script></body>'),built.replace('assets/site.js?v=20261114-gf09&amp;members=2','assets/site.js?v=20261114-gf09&amp;members=3'),built.replace('insights-1-','insights-unreviewed-')]){assert.notEqual(mutated,built,'negative fixture must change the actual current built page');assert.throws(()=>H.assertInsightsProfile(profile,floor,mutated,true),/script inventory/);}
 const runtime=Object.fromEntries(Object.keys(floor.runtimeHashes).map(n=>[n,fs.readFileSync(path.join(root,'assets',n),'utf8')]));
 assert.throws(()=>H.assertRuntimeContract({...runtime,'site.js':runtime['site.js']+';t(remoteKey);'},floor),/runtime family changed/);
 assert.throws(()=>H.selectDictionary({dictionary:{},htmlDictionary:{},coherenceHTML:html+' &unknownFutureEntity;',runtimeSources:runtime,otherHTML:[],retainedKeys:[]}),/Unknown entity/);
});
test('shared generator changes only the Insights consumer and scoped asset, is idempotent and preserves every other artifact byte',t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gf-insights-profile-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 fs.cpSync(path.join(root,'dist'),temp,{recursive:true});const target=path.join(temp,'insights.html'),asset=path.join(temp,'assets/i18n-insights.js');
 fs.unlinkSync(asset);fs.writeFileSync(target,fs.readFileSync(target,'utf8').replace(/assets\/i18n-insights\.js\?v=insights-1-[a-f0-9]{12}/g,H.INSIGHTS_URL));
 const manifest=()=>{const result={};function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else result[path.relative(temp,file).replaceAll('\\','/')]=hash(fs.readFileSync(file));}}walk(temp);return result;};
 const before=manifest();assert.equal(H.buildInsightsDictionary(root,temp),true);const after=manifest();
 assert.deepEqual(Object.keys(after).filter(k=>!Object.hasOwn(before,k)),['assets/i18n-insights.js']);
 assert.deepEqual(Object.keys(before).filter(k=>before[k]!==after[k]),['insights.html']);
 assert.equal(H.buildInsightsDictionary(root,temp),true);assert.deepEqual(manifest(),after);
 assert.equal(H.assertInsightsArtifact(root,temp),true);
 const reviewedHTML=fs.readFileSync(target,'utf8');fs.writeFileSync(target,reviewedHTML.replace(/insights-1-[a-f0-9]{12}/,'insights-1-000000000000'));
 assert.throws(()=>H.assertInsightsArtifact(root,temp),/content hash changed/);
 fs.writeFileSync(target,reviewedHTML.replace('</body>','<script defer src="assets/journal.js"></script></body>'));
 assert.throws(()=>H.assertInsightsArtifact(root,temp),/script inventory/,'final emitted-page guard rejects even an already shipped but unclassified runtime');
});
test('real HTTP cache fixture retains old full and old scoped addresses and revalidates only changed consumer HTML',async()=>{
 const {createCacheServer}=require('./support/cache-server.cjs');
 for(const previous of ['full','chunk']){const f=createCacheServer({insightsDictionaryTransition:previous});await new Promise(r=>f.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+f.server.address().port;try{
  const old=await fetch(base+'/insights.html'),tag=old.headers.get('etag'),html=await old.text();
  assert.match(html,previous==='full'?/i18n\.js\?v=20261111-nl-audit/:/i18n-insights\.js\?v=insights-1-000000000000/);
  assert.equal((await fetch(base+'/insights.html',{headers:{'If-None-Match':tag}})).status,304);
  const legacyURL=previous==='full'?'/assets/i18n.js?v=20261111-nl-audit':'/assets/i18n-insights.js?v=insights-1-000000000000',legacy=await fetch(base+legacyURL),bytes=await legacy.text();
  assert.match(legacy.headers.get('cache-control'),/max-age=3600/);assert.equal(Object.keys(parse(bytes).I18N).length,previous==='full'?1296:721);
  f.publish();const fresh=await fetch(base+'/insights.html',{headers:{'If-None-Match':tag}});assert.equal(fresh.status,200);assert.match(await fresh.text(),/i18n-insights\.js\?v=insights-1-[a-f0-9]{12}/);
  assert.equal(await(await fetch(base+legacyURL)).text(),bytes);
 }finally{f.server.closeAllConnections();await new Promise(r=>f.server.close(r));}}
});
