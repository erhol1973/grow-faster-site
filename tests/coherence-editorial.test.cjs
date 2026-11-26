'use strict';
// Bedrijfsontwikkeling redesign (owner request, 25 Nov 2026): coherence.html follows the structure and premium look of orion.html
// (section order, numbered steps, FAQ, dark closing call to action). All approved texts, the film and the
// appointment buttons stay; only the site's existing colour tokens are used.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=()=>read('coherence.html');const main=()=>html().match(/<main[\s\S]*?<\/main>/)[0];
const section=id=>main().match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];
const text=s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

test('section order follows the Orion page: hero, In het kort, problem, figures, meaning, film, steps, gains, for whom, FAQ, call to action',()=>{
  const m=main();const order=['id="hero"','id="kort"','id="herkenbaar"','id="cijfers"','id="wat-is"','id="adaptief"','id="ec-film"','id="aanpak"','id="opbrengst"','id="voor-wie"','id="vragen"','id="contact"'].map(id=>m.indexOf(id));
  assert.ok(order.every(i=>i>=0),'all sections present');assert.deepEqual(order,[...order].sort((a,b)=>a-b));
  assert.equal((section('kort').match(/<li>/g)||[]).length,3,'three key points');
  assert.equal((m.match(/class="step-n"/g)||[]).length,4,'numbering only on the four real steps');
  assert.equal((section('aanpak').match(/<li>/g)||[]).length,4);
  assert.equal((section('vragen').match(/<details>/g)||[]).length,5);
  assert.equal((m.match(/class="ap-head"/g)||[]).length,8,'section heads');
});

test('no extra colours: the page style block uses only existing colour tokens, no colour layer',()=>{
  const css=html().match(/<style data-apple>([\s\S]*?)<\/style>/)[1];
  assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i,'no literal colours');
  for(const v of css.match(/var\(--[a-z-]+\)/g))assert.match(v,/var\(--(brand|brand-fill|on-brand|ai|ai-ink|ink|muted|line|tint|sf)\)/,v);
  assert.doesNotMatch(html(),/assets\/kleur\.css/);
  assert.match(html(),/<body data-cms-page="coherence" class="editorial-home coh-apple">/);
});

test('page strings load from their own dictionary with a formal French translation',()=>{
  const h=html();assert.match(h,/<script defer src="assets\/i18n\.js\?v=[^"]+"><\/script><script defer src="assets\/i18n-coherence\.js\?v=[^"]+"><\/script>/);
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='coherence.html'))assert.doesNotMatch(read(f),/i18n-coherence\.js/,f);
  const own={window:{I18N:{}}};vm.runInNewContext(read('assets/i18n-coherence.js'),own);
  for(const [k,v] of Object.entries(own.window.I18N)){assert.ok(v[0]===k&&v[1]&&v[1]!==k,k);assert.doesNotMatch(v[1],/\S[?:;](\s|$)/,'FR typography: '+v[1]);assert.doesNotMatch(v[1],/\b(tu|ton|ta|tes|toi)\b/i,v[1]);}
  const faq=text(section('vragen'));for(const q of ['Wat is het verschil met een klassiek adviestraject?','Wat is het coherentieprofiel?','Wat kost het?'])assert.ok(faq.includes(q),q);
});

test('new texts are editable in the content studio; no figure, mail link or form is added',()=>{
  const c={window:{}};vm.runInNewContext(read('assets/cms-catalog.js'),c);const page=c.window.GF_CMS_CATALOG.find(p=>p.page==='coherence');
  for(const k of ['coh-kmo-kort-h','coh-kmo-k1','coh-kmo-k2','coh-kmo-k3','coh-kmo-17b','coh-kmo-vw-h','coh-kmo-vw-p','coh-kmo-faq-h','coh-kmo-f1','coh-kmo-f5'])assert.ok(page.fields.some(f=>f.key===k&&f.fr),k);
  const m=main();assert.doesNotMatch(m,/href="mailto:|<form\b/);
  // Negative: the FAQ and new blocks make no unsourced claims with percentages.
  for(const id of ['kort','voor-wie','vragen'])assert.doesNotMatch(text(section(id)),/\d+ ?%/,id);
});
