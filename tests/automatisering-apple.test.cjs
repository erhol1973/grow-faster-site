'use strict';
// Workflow-automatisering redesign (owner request, 25 Nov 2026): restructured like orion.html, as a premium product page
// (Apple-like): "In het kort", centred headlines, rounded tiles, a bento of examples, a worked cost example, six barrier
// tiles with their source, a service/software split and the FAQ. No extra colours: only the site's existing colour tokens.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=()=>read('automatisering.html');const main=()=>html().match(/<main[\s\S]*?<\/main>/)[0];
const section=id=>main().match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];

test('section order and structure follow the premium layout',()=>{
  const m=main();const order=['hero','kort','herkenbaar','voorbeelden','aanpak','drempels','opbrengst','dienst','vragen','contact'].map(id=>m.indexOf(`id="${id}"`));
  assert.ok(order.every(i=>i>=0),'all sections present');assert.deepEqual(order,[...order].sort((a,b)=>a-b));
  assert.equal((section('kort').match(/<li>/g)||[]).length,3,'three key points');
  assert.equal((section('herkenbaar').match(/class="ap-tile"/g)||[]).length,4);
  assert.equal((section('voorbeelden').match(/class="ap-domain"/g)||[]).length,5);
  assert.equal((m.match(/class="step-n"/g)||[]).length,4,'only the four steps are numbered');
  assert.equal((section('opbrengst').match(/<li>/g)||[]).length,4);
  assert.match(section('dienst'),/href="orion\.html"/);
  assert.match(section('contact'),/class="ap-cta"[\s\S]*href="afspraak\.html\?onderwerp=workflow"/);
  // Negative: the old table and bullet-list layouts are gone.
  assert.doesNotMatch(m,/<table|class="voorbeelden"|class="trust-list"|class="cards6"/);
});

test('cost example matches the approved labour cost (EUR 17.25 per hour, one hour a day, 220 working days)',()=>{
  const st=section('herkenbaar').match(/<div class="ap-stat">[\s\S]*?<\/div>/)[0];
  assert.equal(17.25*220,3795);assert.match(st,/€ 3\.795/);assert.match(st,/€ 17,25 per uur en 220 werkdagen/);
});

test('no extra colours: the page style block uses only existing colour tokens',()=>{
  const css=html().match(/<style data-apple>([\s\S]*?)<\/style>/)[1];
  assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i,'no literal colours');
  for(const v of css.match(/var\(--[a-z-]+\)/g))assert.match(v,/var\(--(brand|brand-fill|on-brand|ai|ai-ink|ink|muted|line|tint|sf)\)/,v);
  assert.doesNotMatch(html(),/assets\/kleur\.css/);
});

test('new strings load from the page-specific dictionary with valid French, and the retired sentence is gone',()=>{
  const h=html();assert.match(h,/<script defer src="assets\/i18n\.js\?v=[^"]+"><\/script><script defer src="assets\/i18n-automatisering\.js\?v=[^"]+"><\/script>/);
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='automatisering.html'))assert.doesNotMatch(read(f),/i18n-automatisering\.js/,f);
  const own={window:{I18N:{}}};vm.runInNewContext(read('assets/i18n-automatisering.js'),own);
  for(const [k,v] of Object.entries(own.window.I18N)){assert.ok(v[0]===k&&v[1]&&v[1]!==k,k);assert.doesNotMatch(v[1],/\S[?:;](\s|$)/,'FR typography: '+v[1]);}
  assert.doesNotMatch(h,/data-cms="aut-30"/,'old service sentence retired so a published overlay cannot reappear');
});
