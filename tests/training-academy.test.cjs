'use strict';
// Training redesign (owner request, 25 Nov 2026): the page follows the structure of the McKinsey Leadership Academy page
// (text hero with one wide photo, intro, programme cards, figures band, how it works, trainer, practical, further reading,
// closing call) with an Apple-like finish. Only existing colour tokens; no colour layer. No testimonials or case studies
// are invented: the page shows only facts the owner has approved.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=()=>read('training.html');const main=()=>html().match(/<main[\s\S]*?<\/main>/)[0];
const section=id=>main().match(new RegExp(`<(?:section|header)[^>]* id="${id}"[\\s\\S]*?</(?:section|header)>`))[0];

test('academy section order: hero, why, programmes, figures, how, trainer, practical, reading, contact',()=>{
  const m=main();const order=['hero','waarom','trainingen','mensen','werking','trainer','praktisch','lezen','contact'].map(id=>m.indexOf(`id="${id}"`));
  assert.ok(order.every(i=>i>=0),'all sections present');assert.deepEqual(order,[...order].sort((a,b)=>a-b));
  assert.equal((section('trainingen').match(/<article class="ac-program">/g)||[]).length,3,'three programme cards');
  assert.equal((section('werking').match(/class="step-n"/g)||[]).length,3,'three steps');
  assert.match(section('hero'),/<figure class="ac-figure">[\s\S]*hero-training-workshop-1536\.webp/,'one wide photo under the hero text');
});

test('every programme card and the closing call lead to the training appointment topic',()=>{
  const tr=section('trainingen');assert.equal((tr.match(/<a class="ac-link" href="afspraak\.html\?onderwerp=training">/g)||[]).length,3);
  assert.match(section('contact'),/href="afspraak\.html\?onderwerp=training" class="btn primary"/);
});

test('further reading links to existing magazine and insights pages; trainer links to the About page',()=>{
  const r=section('lezen');for(const href of ['journal.html','insights-ai-pilot.html']){assert.match(r,new RegExp(`href="${href.replace('.','\\.')}"`));assert.ok(fs.existsSync(path.join(root,href)),href);}
  for(const src of r.matchAll(/src="([^"]+)"/g))assert.ok(fs.existsSync(path.join(root,src[1])),src[1]);
  // 27 Nov 2026 owner request: the Magazine card uses a higher-resolution reconstruction of the supplied photo; Insights uses the supplied logistics photo.
  assert.deepEqual([...r.matchAll(/<img[^>]* src="img\/(training-lezen-(?:voedselproductie-672|logistiek-672)\.webp)"/g)].map(match=>match[1]),
    ['training-lezen-voedselproductie-672.webp','training-lezen-logistiek-672.webp']);
  assert.match(r,/img\/training-lezen-voedselproductie-3840\.webp 3840w/);
  const largeBudgets = {
    'img/training-lezen-voedselproductie-1920.webp': 150000,
    'img/training-lezen-voedselproductie-3840.webp': 450000
  };
  for(const match of r.matchAll(/srcset="([^"]+)"/g)){
    for(const variant of match[1].split(', ')){
      const file=variant.split(' ')[0];
      assert.ok(fs.statSync(path.join(root,file)).size <= (largeBudgets[file] ?? 78000),file);
    }
  }
  assert.doesNotMatch(r,/band-process/);
  assert.match(section('trainer'),/href="about\.html"/);
  // Negative: no invented participant quotes, case studies or participant numbers.
  assert.doesNotMatch(main(),/<blockquote|deelnemer|Case study|klantcase/i);
});

test('no extra colours: the academy style block uses only existing colour tokens and the colour layer is not loaded',()=>{
  const css=html().match(/<style data-academy>([\s\S]*?)<\/style>/)[1];
  assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i,'no literal colours');
  for(const v of css.match(/var\(--[a-z-]+\)/g))assert.match(v,/var\(--(brand|brand-fill|on-brand|ai|ai-ink|ink|muted|line|tint|sf)\)/,v);
  assert.doesNotMatch(html(),/assets\/kleur\.css/);
});

test('Training strings load from the page-specific dictionary with correct French typography',()=>{
  const h=html();assert.match(h,/<script defer src="assets\/i18n\.js\?v=[^"]+"><\/script><script defer src="assets\/i18n-training\.js\?v=[^"]+"><\/script>/);
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='training.html'))assert.doesNotMatch(read(f),/i18n-training\.js/,f);
  const own={window:{I18N:{}}};vm.runInNewContext(read('assets/i18n-training.js'),own);
  assert.ok(Object.keys(own.window.I18N).length>=10);
  for(const [k,v] of Object.entries(own.window.I18N)){assert.ok(v[0]===k&&v[1]&&v[1]!==k,k);assert.doesNotMatch(v[1],/\S[?:;!](\s|$)/,'FR typography: '+v[1]);assert.doesNotMatch(v[1],/\b(tu|ton|ta|tes|toi)\b/i,k);}
});
