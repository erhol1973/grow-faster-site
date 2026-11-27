'use strict';
// Release 2 (23 Nov 2026, owner decisions): Training page, the four approved research blocks with checked sources, and the
// "adaptief bedrijf" block on Bedrijfsontwikkeling (coherence.html).
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
// Translations are loaded per page exactly as the built HTML references them (tests/support/i18n.cjs): assets/i18n.js first,
// then that page's own dictionary (i18n-home, -orion, -automatisering, -training, -coherence, ...). New dictionaries need no edit here.
const {i18nFor}=require('./support/i18n.cjs');
const main=f=>read(f).match(/<main[\s\S]*?<\/main>/)[0];
const visible=html=>html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'').replace(/<([a-z0-9]+)[^>]*data-(?:notr|ih)[^>]*>[\s\S]*?<\/\1>/g,'');
// Names stay the same in both languages.
const NAMES=new Set(['Orion','Grow Faster','LinkedIn','Workflowscan']);
const translated=(file,I)=>{for(const m of visible(main(file)).matchAll(/>([^<]*[A-Za-zÀ-ÿ][^<]*)</g)){const k=m[1].trim().replace(/\s+/g,' ');if(NAMES.has(k))continue;assert.ok(I[k]?.[1]&&I[k][1]!==k,`${file}: FR missing: ${k}`);assert.doesNotMatch(I[k][1],/\b(tu|ton|ta|tes|toi)\b/i,k);assert.doesNotMatch(I[k][1],/\S[?:;](\s|$)/,'FR typography: '+I[k][1])}};

test('Training offers three trainings on site or online, price on request, with its own appointment topic',()=>{
  const html=read('training.html'),m=main('training.html');
  // 25 Nov 2026: training.html became CMS-editable, so headings carry a data-cms attribute.
  assert.match(m,/<h1(?: data-cms="trn-\d\d")?>Uw mensen leren werken met AI en automatisering\.<\/h1>/);
  const tr=m.match(/<section id="trainingen"[\s\S]*?<\/section>/)[0];
  // 25 Nov 2026 academy redesign: the three trainings are the programme cards (the section also has two short pillars).
  assert.deepEqual([...tr.matchAll(/<article class="ac-program">[\s\S]*?<h3(?: data-cms="trn-\d\d")?>([^<]+)<\/h3>/g)].map(x=>x[1]),['Orion in de praktijk','Werkprocessen automatiseren','Bedrijfsontwikkeling: naar een adaptief bedrijf']);
  assert.match(m,/Ter plaatse of online, in het Nederlands of het Frans\. Prijs op aanvraag\./);
  assert.doesNotMatch(m,/href="mailto:/);assert.match(m,/href="#trainingen" class="btn primary" id="hero-trainingen"/);assert.match(m,/href="afspraak\.html\?onderwerp=training" class="btn ghost" id="hero-gesprek"/);assert.match(m,/href="afspraak\.html\?onderwerp=training" class="btn primary" id="contact-gesprek"/);
  assert.doesNotMatch(m,/<form\b/);
  assert.match(html,/<img src="img\/hero-training-workshop-1536\.webp"/);for(const w of [640,800,1200,1536])assert.ok(fs.statSync(path.join(root,`img/hero-training-workshop-${w}.webp`)).size<60000,w);
  assert.match(read('sitemap.xml'),/<loc>https:\/\/grow-faster\.be\/training\.html<\/loc>/);
  translated('training.html',i18nFor('training.html').I18N);
});
test('research blocks name a checked source for every figure and carry no supplier statistics',()=>{
  const home=main('index.html').match(/<section id="kloof"[\s\S]*?<\/section>/);assert.ok(home,'home: kloof block');
  assert.ok(main('index.html').indexOf('id="fundament"')<main('index.html').indexOf('id="kloof"'),'after the pyramid');
  assert.match(home[0],/76%[\s\S]*29%[\s\S]*1 op 3/);
  assert.equal((home[0].match(/statbel\.fgov\.be\/en\/themes\/enterprises\/ict-and-e-commerce-enterprises/g)||[]).length,2);
  assert.match(home[0],/oecd\.org\/en\/publications\/generative-ai-and-the-sme-workforce_2d08b99d-en/);
  const drempels=main('automatisering.html').match(/<section id="drempels"[\s\S]*?<\/section>/)[0];
  /* 25 Nov 2026 premium redesign: the six barriers moved from a table to tiles. */assert.equal((drempels.match(/<article class="ap-drempel">/g)||[]).length,6);assert.match(drempels,/doi\.org\/10\.1007\/s11301-024-00405-4/);
  const orion=main('orion.html').match(/<details class="or-research"[\s\S]*?<\/details>/)[0];
  assert.match(orion,/Waarom nakijken nodig blijft/);assert.match(orion,/doi\.org\/10\.1287\/orsc\.2025\.21838/);assert.match(orion,/758 consultants[\s\S]*19 procentpunten/);
  const training=main('training.html').match(/<section id="mensen"[\s\S]*?<\/section>/)[0];
  assert.match(training,/85%[\s\S]*6% heeft meer mensen nodig, 9% minder/);assert.match(training,/oecd\.org\/en\/publications\/ai-and-skills_f843b352-en/);
  for(const f of ['index.html','orion.html','automatisering.html','training.html','coherence.html'])assert.doesNotMatch(main(f),/Smartsheet|Asana|Zapier|Automation Anywhere|KITIM|MIT NANDA|95% van de pilots/,f);
  for(const f of ['index.html','orion.html','automatisering.html','coherence.html'])translated(f,i18nFor(f).I18N);
});
test('Bedrijfsontwikkeling adds the adaptive-company block before the film',()=>{
  const m=main('coherence.html');const a=m.indexOf('id="adaptief"');
  assert.ok(m.indexOf('id="wat-is"')<a&&a<m.indexOf('id="ec-film"'));
  assert.match(m,/<h2 data-cms="coh-kmo-adapt-h">Van samenhang naar een adaptief bedrijf<\/h2>/);
  const ld=JSON.parse(read('coherence.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.ok(ld.some(x=>x['@type']==='Service'&&x.name==='Bedrijfsontwikkeling'));assert.ok(!ld.some(x=>x['@type']==='SoftwareApplication'),'no Orion data on this page');
});
