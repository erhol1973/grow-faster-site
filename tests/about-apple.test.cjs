'use strict';
// About redesign (owner request, 25 Nov 2026): same premium build-up as orion.html (Apple-like): centred headlines,
// rounded tiles, numbered steps, a bento of the three solutions and a dark closing call. The approved texts stay as they
// are (tests/over.test.cjs). No extra colours: only the site's existing colour tokens, and no colour layer.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=()=>read('about.html');const main=()=>html().match(/<main[\s\S]*?<\/main>/)[0];
const section=id=>main().match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];

test('About follows the Orion build-up: hero, why, how, experience, solutions, closing call',()=>{
  const m=main();const order=['id="hero"','id="waarom"','id="werkwijze"','id="ervaring"','id="oplossingen"','id="contact"'].map(id=>m.indexOf(id));
  assert.ok(order.every(i=>i>=0));assert.deepEqual(order,[...order].sort((a,b)=>a-b));
  assert.match(html(),/<body data-cms-page="about" class="editorial-home about-apple">/);
  for(const id of ['waarom','werkwijze','ervaring','oplossingen'])assert.match(section(id),/<div class="ap-head"><h2 /,id+' has a centred headline');
  assert.equal((section('werkwijze').match(/class="step-n"/g)||[]).length,3,'three numbered steps');
  assert.equal((section('ervaring').match(/<li><h3>/g)||[]).length,3,'three experience tiles');
  assert.equal((section('oplossingen').match(/<article class="ap-route">/g)||[]).length,3,'three solution tiles');
});

test('no extra colours: the About style block uses only existing colour tokens and the colour layer is not loaded',()=>{
  const css=html().match(/<style data-apple>([\s\S]*?)<\/style>/)[1];
  assert.doesNotMatch(css,/#(?![a-z])[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i,'no literal colours');
  for(const v of css.match(/var\(--[a-z-]+\)/g))assert.match(v,/var\(--(brand|brand-fill|on-brand|ai|ai-ink|ink|muted|line|tint|sf)\)/,v);
  assert.doesNotMatch(html(),/assets\/kleur\.css/);
});

test('About tile titles load from the page-specific dictionary',()=>{
  const h=html();assert.match(h,/<script defer src="assets\/i18n\.js\?v=[^"]+"><\/script><script defer src="assets\/i18n-about\.js\?v=[^"]+"><\/script>/);
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='about.html'))assert.doesNotMatch(read(f),/i18n-about\.js/,f);
  const own={window:{I18N:{}}};vm.runInNewContext(read('assets/i18n-about.js'),own);
  for(const t of ['Ervaring','Sectoren','Certificaten']){const v=own.window.I18N[t];assert.ok(v&&v[0]===t&&v[1]&&v[1]!==t,t);}
});
