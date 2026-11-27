'use strict';
// The workflow example, sector photographs and booking route are tested on the built website.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dom = require('./support/mini-dom.cjs');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=()=>read('automatisering.html');const main=()=>html().match(/<main[\s\S]*?<\/main>/)[0];
const section=id=>main().match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];

test('the workflow page leads from the order example to the team decision and a workflow appointment', () => {
  const content = main();
  const orderedIds = ['hero', 'voorbeelden', 'sectoren', 'aanpak', 'herkenbaar', 'drempels', 'vragen', 'contact'];
  let previous = -1;
  for (const id of orderedIds) {
    const position = content.indexOf('id="' + id + '"');
    assert.ok(position > previous, 'missing or out of order: ' + id);
    previous = position;
  }
  assert.match(section('voorbeelden'), /fictief/i);
  assert.match(section('voorbeelden'), /conceptorder/i);
  const approach = dom.parse(section('aanpak'));
  assert.equal(dom.all(approach, el => el.tag === 'li').length, 4);
  const example = dom.parse(section('voorbeelden'));
  assert.deepEqual(dom.all(example, el => el.tag === 'dd').map(dom.text), ['Appelsap', '24 dozen', 'Kaai 2']);
  assert.deepEqual(dom.all(example, el => el.tag === 'h3').map(dom.text), ['Een klant bestelt', 'De conceptorder staat klaar', 'Uw medewerker beslist']);
  assert.match(dom.text(example), /kaai 1/i);
  assert.match(section('vragen'), /href="orion\.html"/);
  assert.match(section('contact'), /href="afspraak\.html\?onderwerp=workflow"/);
});

test('the worked example gives the amount for 220 days at EUR 17.25 per hour', () => {
  const example = section('herkenbaar');
  const bars = dom.all(dom.parse(example), el => el.tag === 'li');
  assert.deepEqual(bars.map(el => dom.text(el).replace(/\s+/g, '')), ['15min55uur', '30min110uur', '60min220uur']);
  assert.match(example, /220/);
  assert.match(example, /17,25/);
  const amount = (220 * 17.25).toLocaleString('nl-BE');
  assert.ok(example.includes(amount), amount);
});

test('the separate hero photo uses the same responsive assets and sizes as its preload', () => {
  const doc = dom.parse(html());
  const hero = dom.byId(doc, 'hero');
  const pictures = dom.all(hero, el => el.tag === 'picture');
  assert.equal(pictures.length, 1);
  const img = dom.all(pictures[0], el => el.tag === 'img')[0];
  const source = dom.all(pictures[0], el => el.tag === 'source')[0];
  const preload = dom.all(doc, el => el.attrs.rel === 'preload' && el.attrs.as === 'image')[0];
  assert.equal(img.attrs.alt, '');
  assert.equal(img.attrs.width, '1774');
  assert.equal(img.attrs.height, '887');
  assert.equal(img.attrs.fetchpriority, 'high');
  assert.equal(preload.attrs.fetchpriority, 'high');
  assert.equal(img.attrs.src, 'img/hero-automatisering-kantoor-1774.webp');
  assert.equal(preload.attrs.href, img.attrs.src);
  assert.equal(preload.attrs.imagesrcset, source.attrs.srcset);
  assert.equal(preload.attrs.imagesizes, source.attrs.sizes);
  assert.match(source.attrs.sizes, /47vw/);
  const widths = [640, 1280, 1774];
  assert.deepEqual(source.attrs.srcset.split(',').map(part => part.trim()), widths.map(w => 'img/hero-automatisering-kantoor-' + w + '.webp ' + w + 'w'));
  for (const w of widths) {
    const {size} = fs.statSync(path.join(root, 'img/hero-automatisering-kantoor-' + w + '.webp'));
    assert.ok(size > 0 && size <= 700000);
  }
  assert.match(html(), /object-position:\s*74% center/);
  assert.doesNotMatch(html(), /hero-executive-meeting/);
});

test('no extra colours: the page style block uses only existing colour tokens',()=>{
  const css=html().match(/<style data-apple>([\s\S]*?)<\/style>/)[1];
  assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i,'no literal colours');
  const styleWithoutBarWidth = css.replace(/width:\s*var\(--part\)/g, '');
  for(const v of styleWithoutBarWidth.match(/var\(--[a-z-]+\)/g))assert.match(v,/var\(--(brand|brand-fill|on-brand|ai|ai-ink|ink|muted|line|tint|sf|bg)\)/,v);
  assert.doesNotMatch(html(),/assets\/kleur\.css/);
});

test('new strings load from the page-specific dictionary with valid French, and the retired sentence is gone',()=>{
  const h=html();assert.match(h,/<script defer src="assets\/i18n\.js\?v=[^"]+"><\/script><script defer src="assets\/i18n-automatisering\.js\?v=[^"]+"><\/script>/);
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='automatisering.html'))assert.doesNotMatch(read(f),/i18n-automatisering\.js/,f);
  const own={window:{I18N:{}}};vm.runInNewContext(read('assets/i18n-automatisering.js'),own);
  for(const [k,v] of Object.entries(own.window.I18N)){assert.ok(v[0]===k&&v[1]&&v[1]!==k,k);assert.doesNotMatch(v[1],/\S[?:;](\s|$)/,'FR typography: '+v[1]);}
  assert.doesNotMatch(h,/data-cms="aut-30"/,'old service sentence retired so a published overlay cannot reappear');
});
