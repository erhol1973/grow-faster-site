'use strict';
// Orion redesign (owner requests, 25 Nov 2026): Orion is not only for the food industry. First restructured in a consultancy
// layout, then the same day restyled as a premium product page (Apple-like): centred headlines, rounded tiles, a bento of four
// application domains and a sector FAQ. No extra colours: the page styles use only the site's existing colour tokens.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=()=>read('orion.html');const main=()=>html().match(/<main[\s\S]*?<\/main>/)[0];
const section=id=>main().match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];
const text=s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

test('the example follows the hero and exposes its evidence and review path',()=>{
  const m=main();
  const ids=['hero','voorbeeld','werking','toepassingen','vragen','final'].map(id=>m.indexOf('id="'+id+'"'));
  assert.ok(ids.every((pos,i)=>pos>=0&&(!i||pos>ids[i-1])));
  assert.match(section('voorbeeld'),/<summary>Bekijk de bron/);
  assert.match(section('voorbeeld'),/Controle nodig/);
  assert.equal((section('werking').match(/class="step-n"/g)||[]).length,4);
  const images=[...m.matchAll(/<a class="or-screen" href="img\/orion-demo-([a-z]+)\.png"><img src="img\/orion-demo-([a-z]+)-detail\.webp"/g)];
  assert.deepEqual(images.map(x=>x[1]),['vragenlijsten','bronnen','instellingen','logboek']);
  for(const [,full,detail] of images){
    assert.equal(full,detail);
    assert.ok(read('img/orion-demo-'+full+'.png').length>0);
    assert.ok(read('img/orion-demo-'+detail+'-detail.webp').length>0);
  }
  assert.ok(html().includes('href="img/orion-demo-vragenlijsten-detail.webp" fetchpriority="high"'));
  assert.ok(m.includes('alt="" fetchpriority="high"'));
});

test('Orion is presented for four domains, not only the food industry',()=>{
  const ex=section('toepassingen');
  assert.deepEqual([...ex.matchAll(/<h3 data-cms="orx-\d+">([^<]+)<\/h3>/g)].map(x=>x[1]),['Kwaliteit in de voedingsproductie','Technisch onderhoud','Administratie','Logistiek']);
  assert.equal((ex.match(/<dt>Wie vraagt<\/dt>/g)||[]).length,4,'each domain names who asks, what Orion prepares and from which documents');
  assert.match(text(section('vragen')),/Werkt Orion ook buiten de voedingsindustrie\?/);
  // Negative: no sentence may limit Orion to food companies any more.
  assert.doesNotMatch(text(main()),/Voedingsbedrijven die regelmatig/);
  assert.doesNotMatch(text(read('orion.html').match(/<head>[\s\S]*?<\/head>/)[0]),/klantvragenlijsten invullen vanuit uw documenten/);
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
