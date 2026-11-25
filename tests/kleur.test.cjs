'use strict';
// 25 Nov 2026 (owner decision): every customer page gets the colour layer of the magazine page (assets/kleur.css):
// bright section bars, coloured cards and figure tiles, a dark closing band with a yellow button and a colour strip.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.resolve(__dirname,'../dist',file),'utf8');
// 25 Nov 2026, later owner decision: Home, Orion, Workflow-automatisering and Bedrijfsontwikkeling go back to their earlier look.
const pages=['oplossingen.html','about.html','training.html','journal.html','insights.html','afspraak.html','privacy.html','terms.html','accessibility.html'];
test('every customer page loads the colour layer last in its head',()=>{
 for(const p of pages){const head=read(p).split('</head>')[0];
  assert.match(head,/<link rel="stylesheet" href="assets\/kleur\.css\?v=[^"]+">\s*$/,p+' loads assets/kleur.css as the last head element');}
});
test('Home, Orion, Workflow-automatisering and Bedrijfsontwikkeling do not load the colour layer',()=>{
 for(const p of ['index.html','orion.html','automatisering.html','coherence.html'])assert.doesNotMatch(read(p),/assets\/kleur\.css/,p+' keeps its earlier look');
});
test('the colour layer keeps text dark on bright fills and white on the dark band',()=>{
 const css=read('assets/kleur.css');
 for(const c of ['#FF5A3C','#FFC629','#00B8A9','#FF4F9A','#C6F432','#6C4CF5'])assert.ok(css.includes(c),'palette colour '+c);
 assert.match(css,/--k-on:#0B1020/,'text on a bright fill is #0B1020');
 assert.match(css,/section\.tinted h2\{color:#FFFFFF\}/,'closing band heading is white');
 assert.match(css,/section\.tinted \.btn\.primary\{background:var\(--k-geel\)[^}]*color:#0B1020/,'closing band button is yellow with dark text');
 assert.match(css,/prefers-color-scheme:dark/,'dark mode keeps its own surfaces');
 // Negative case: yellow and lime are never used as a text colour on a light surface.
 assert.doesNotMatch(css,/[^-]color:var\(--k-(geel|limoen)\)/);
});
