'use strict';
// Orion editorial redesign (owner request, 25 Nov 2026): Orion is not only for the food industry. The page is restructured
// in a consultancy (McKinsey-like) layout: "In het kort", numbered sections, an exhibit of four application domains, and a
// sector FAQ. No extra colours: the page styles use only the site's existing colour tokens.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=()=>read('orion.html');const main=()=>html().match(/<main[\s\S]*?<\/main>/)[0];
const section=id=>main().match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];
const text=s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

test('section order: hero, In het kort, problem, steps, applications, human decides, for whom, FAQ, pilot',()=>{
  const m=main();const order=['id="hero"','id="kort"','id="probleem"','id="werking"','id="toepassingen"','id="beslissen"','id="voor-wie"','id="vragen"','id="final"'].map(id=>m.indexOf(id));
  assert.ok(order.every(i=>i>=0),'all sections present');assert.deepEqual(order,[...order].sort((a,b)=>a-b));
  assert.equal((section('kort').match(/<li>/g)||[]).length,3,'three key points');
  assert.deepEqual([...m.matchAll(/<span class="n" data-notr>(\d\d)<\/span>/g)].map(x=>x[1]),['01','02','03','04','05','06'],'numbered sections');
});

test('Orion is presented for four domains, not only the food industry',()=>{
  const ex=section('toepassingen');
  assert.match(ex,/<table class="mk-table">/);assert.match(ex,/<th scope="col"/);
  assert.deepEqual([...ex.matchAll(/<tr><td data-cms="orx-\d+">([^<]+)<\/td>/g)].map(x=>x[1]),['Kwaliteit in de voedingsproductie','Technisch onderhoud','Administratie','Logistiek']);
  assert.match(text(section('vragen')),/Werkt Orion ook buiten de voedingsindustrie\?/);
  // Negative: no sentence may limit Orion to food companies any more.
  assert.doesNotMatch(text(main()),/Voedingsbedrijven die regelmatig/);
  assert.doesNotMatch(text(read('orion.html').match(/<head>[\s\S]*?<\/head>/)[0]),/klantvragenlijsten invullen vanuit uw documenten/);
});

test('no extra colours: the page style block uses only existing colour tokens',()=>{
  const css=html().match(/<style data-mck>([\s\S]*?)<\/style>/)[1];
  assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i,'no literal colours');
  for(const v of css.match(/var\(--[a-z-]+\)/g))assert.match(v,/var\(--(brand|brand-fill|on-brand|ai|ai-ink|ink|muted|line|tint|serif|f-sans)\)/,v);
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
