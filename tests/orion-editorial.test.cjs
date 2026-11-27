'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=()=>read('orion.html');const main=()=>html().match(/<main[\s\S]*?<\/main>/)[0];
const section=id=>main().match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];
const text=s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

test('the food pilot has twelve ordered sections, six illustrations and an inspectable source',()=>{
  const m=main(),ids=['hero','probleem','voorbeeld','werking','regels','vergelijking','vandaag','gegevens','pilot','maker','vragen','final'];
  const positions=ids.map(id=>m.indexOf('id="'+id+'"'));
  assert.ok(positions.every((pos,i)=>pos>=0&&(!i||pos>positions[i-1])));
  assert.match(section('voorbeeld'),/<summary>Bekijk de bron/);
  assert.match(section('voorbeeld'),/Geen bron gevonden/);
  assert.equal((section('werking').match(/class="step-n"/g)||[]).length,4);
  assert.equal((m.match(/<img /g)||[]).length,6);
  assert.match(section('vragen'),/Nog niet. Orion start bij voedingsbedrijven/);
  const screens=[...m.matchAll(/class="or-screen" href="(img[^"]+)"><img src="([^"]+)"/g)];
  assert.deepEqual(screens.map(x=>x[1].split('demo-')[1]),['vragenlijsten.png','bronnen-verlopen.png','logboek.png','instellingen.png']);
  for(const [,full,preview] of screens) for(const f of [full,preview]) assert.ok(fs.statSync(path.join(root,f)).size>0);
});

test('French sharing and indexing work before scripts run',()=>{
  const fr=read('fr/orion/index.html');
  assert.match(fr,/<html lang="fr"/);
  assert.match(fr,/<h1[^>]*>Le questionnaire de votre client/);
  assert.match(fr,/property="og:image" content="https:\/\/grow-faster\.be\/img\/og-orion-fr\.jpg"/);
  assert.match(fr,/property="og:locale" content="fr_BE"/);
  assert.match(fr,/<link rel="canonical" href="https:\/\/grow-faster\.be\/fr\/orion\/"/);
  assert.match(fr,/Les réponses en français sont en développement/);
});

test('no extra colours: the page style block uses only existing colour tokens',()=>{
  const css=html().match(/<style data-apple>([\s\S]*?)<\/style>/)[1];
  assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i,'no literal colours');
  for(const v of css.match(/var\(--[a-z-]+\)/g))assert.match(v,/var\(--(brand|brand-fill|on-brand|ai|ai-ink|bg|ink|muted|line|tint|sf)\)/,v);
  assert.doesNotMatch(html(),/assets\/kleur\.css/);
});

test('Orion strings load from the page-specific dictionary, and old CMS keys are retired',()=>{
  const h=html();assert.match(h,/<script defer src="assets\/i18n\.js\?v=[^"]+"><\/script><script defer src="assets\/i18n-orion\.js\?v=[^"]+"><\/script>/);
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='orion.html'))assert.doesNotMatch(read(f),/i18n-orion\.js/,f);
  const own={window:{I18N:{}}};vm.runInNewContext(read('assets/i18n-orion.js'),own);
  for(const [k,v] of Object.entries(own.window.I18N)){assert.ok(v[0]===k&&v[1]&&v[1]!==k,k);assert.doesNotMatch(v[1],/\S[?:;](\s|$)/,'FR typography: '+v[1]);}
  // Negative: published overlays for the old ori-NN keys must not overwrite the new text.
  assert.doesNotMatch(h,/data-cms="ori-\d\d"/);
  const c={window:{}};vm.runInNewContext(read('assets/cms-catalog.js'),c);const page=c.window.GF_CMS_CATALOG.find(p=>p.page==='orion');
  assert.ok(!page.fields.some(f=>/^ori-\d\d$/.test(f.key)),'catalog holds no retired ori-NN keys');
});
