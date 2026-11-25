'use strict';
// Release 2 (23 Nov 2026, owner decisions): Training page, the four approved research blocks with checked sources, and the
// "adaptief bedrijf" block on Bedrijfsontwikkeling (coherence.html).
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
// 25 Nov 2026: homepage strings moved to assets/i18n-home.js (loaded after i18n.js on index.html); it only adds keys, so merging it is neutral for other pages.
const I18N=()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);vm.runInNewContext(read('assets/i18n-home.js'),c);return c.window.I18N};
const main=f=>read(f).match(/<main[\s\S]*?<\/main>/)[0];
const visible=html=>html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'').replace(/<([a-z0-9]+)[^>]*data-(?:notr|ih)[^>]*>[\s\S]*?<\/\1>/g,'');
// Names stay the same in both languages.
const NAMES=new Set(['Orion','Grow Faster','LinkedIn','Workflowscan']);
const translated=(file,I)=>{for(const m of visible(main(file)).matchAll(/>([^<]*[A-Za-zÀ-ÿ][^<]*)</g)){const k=m[1].trim().replace(/\s+/g,' ');if(NAMES.has(k))continue;assert.ok(I[k]?.[1]&&I[k][1]!==k,`${file}: FR missing: ${k}`);assert.doesNotMatch(I[k][1],/\b(tu|ton|ta|tes|toi)\b/i,k);assert.doesNotMatch(I[k][1],/\S[?:;](\s|$)/,'FR typography: '+I[k][1])}};

test('Training offers three trainings on site or online, price on request, with its own appointment topic',()=>{
  const html=read('training.html'),m=main('training.html');
  assert.match(m,/<h1>Uw mensen leren werken met AI en automatisering\.<\/h1>/);
  const tr=m.match(/<section id="trainingen"[\s\S]*?<\/section>/)[0];
  assert.deepEqual([...tr.matchAll(/<h3>([^<]+)<\/h3>/g)].map(x=>x[1]),['Orion in de praktijk','Workflow-automatisering','Bedrijfsontwikkeling: naar een adaptief bedrijf']);
  assert.match(m,/Ter plaatse of online, in het Nederlands of het Frans\. Prijs op aanvraag\./);
  assert.doesNotMatch(m,/href="mailto:/);assert.equal((m.match(/href="afspraak\.html\?onderwerp=training" class="btn primary"/g)||[]).length,2);
  assert.doesNotMatch(m,/<form\b/);
  assert.match(html,/<img src="img\/hero-training-team-1774\.webp"/);for(const w of [640,1280,1774])assert.ok(fs.statSync(path.join(root,`img/hero-training-team-${w}.webp`)).size<60000,w);
  assert.match(read('sitemap.xml'),/<loc>https:\/\/grow-faster\.be\/training\.html<\/loc>/);
  translated('training.html',I18N());
});
test('research blocks name a checked source for every figure and carry no supplier statistics',()=>{
  const home=main('index.html').match(/<section id="kloof"[\s\S]*?<\/section>/);assert.ok(home,'home: kloof block');
  assert.ok(main('index.html').indexOf('id="fundament"')<main('index.html').indexOf('id="kloof"'),'after the pyramid');
  assert.match(home[0],/76%[\s\S]*29%[\s\S]*1 op 3/);
  assert.equal((home[0].match(/statbel\.fgov\.be\/en\/themes\/enterprises\/ict-and-e-commerce-enterprises/g)||[]).length,2);
  assert.match(home[0],/oecd\.org\/en\/publications\/generative-ai-and-the-sme-workforce_2d08b99d-en/);
  const drempels=main('automatisering.html').match(/<section id="drempels"[\s\S]*?<\/section>/)[0];
  assert.equal((drempels.match(/<tr><td>/g)||[]).length,6);assert.match(drempels,/doi\.org\/10\.1007\/s11301-024-00405-4/);
  const orion=main('orion.html').match(/<section id="beslissen"[\s\S]*?<\/section>/)[0];
  assert.equal((orion.match(/class="fase"/g)||[]).length,3);assert.match(orion,/doi\.org\/10\.1287\/orsc\.2025\.21838/);assert.match(orion,/758 consultants[\s\S]*19%/);
  const training=main('training.html').match(/<section id="mensen"[\s\S]*?<\/section>/)[0];
  assert.match(training,/85%[\s\S]*6% heeft meer mensen nodig, 9% minder/);assert.match(training,/oecd\.org\/en\/publications\/ai-and-skills_f843b352-en/);
  for(const f of ['index.html','orion.html','automatisering.html','training.html','coherence.html'])assert.doesNotMatch(main(f),/Smartsheet|Asana|Zapier|Automation Anywhere|KITIM|MIT NANDA|95% van de pilots/,f);
  for(const f of ['index.html','orion.html','automatisering.html','coherence.html'])translated(f,I18N());
});
test('Bedrijfsontwikkeling adds the adaptive-company block before the film',()=>{
  const m=main('coherence.html');const a=m.indexOf('id="adaptief"');
  assert.ok(m.indexOf('id="wat-is"')<a&&a<m.indexOf('id="ec-film"'));
  assert.match(m,/<h2 data-cms="coh-kmo-adapt-h">Van samenhang naar een adaptief bedrijf<\/h2>/);
  const ld=JSON.parse(read('coherence.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.ok(ld.some(x=>x['@type']==='Service'&&x.name==='Bedrijfsontwikkeling'));assert.ok(!ld.some(x=>x['@type']==='SoftwareApplication'),'no Orion data on this page');
});
