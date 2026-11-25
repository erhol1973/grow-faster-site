const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..','dist');
test('shared calculation and consent modules remain small standalone assets',()=>{
  for(const [file,limit]of Object.entries({'assets/models.js':18000,'assets/consent.js':2500}))assert.ok(fs.statSync(path.join(root,file)).size<=limit,`${file}: budget ${limit} exceeded`);
});
test('every menu destination stays within its 85KB HTML transfer budget',()=>{
  for(const file of [...new Set([...require('./navigation-cases.json').pages,...require('./navigation-cases.json').primary,...require('./navigation-cases.json').retained,'workshop.html'])].map(p=>p.endsWith('/')?p+'index.html':p))assert.ok(fs.statSync(path.join(root,file)).size<=85000,`${file} exceeds 85KB HTML budget`);
});
// 25 Nov 2026: assets/home.css and assets/i18n-home.js (homepage redesign) join the measured set with 16 KB budgets each; existing budgets unchanged.
test('shared JS/CSS and raster images stay within measured release budgets',()=>{const budgets={'assets/site.css':125000,'assets/site.js':55000,'assets/i18n.js':260000,'assets/content.js':23000,'assets/ux.js':15000,'assets/books.css':8000,'assets/navigation.css':8000,'assets/journal.css':6000,'assets/workshop.css':18000,'assets/workshop.js':8500,'assets/home.css':10000,'assets/i18n-home.js':16000};for(const [file,max]of Object.entries(budgets))assert.ok(fs.statSync(path.join(root,file)).size<=max,`${file} exceeds ${max} byte budget`);function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(jpe?g|png|webp|avif)$/i.test(p))assert.ok(fs.statSync(p).size<=700000,`${path.relative(root,p)} exceeds 700KB image budget`)}}walk(path.join(root,'img'))});

// Release 1: on pages without a large hero (about.html) the mobile LCP element is the consent introduction, which can only
// paint after the deferred translation payload has loaded. 296 orphaned translations were removed (83.6 KB -> 61.2 KB gzip);
// this transfer budget keeps that render-critical payload from silently growing back. It adds to the unchanged 260 KB raw budget.
test('translation payload stays within its gzip transfer budget',()=>{const size=require('node:zlib').gzipSync(fs.readFileSync(path.join(root,'assets/i18n.js'))).length;assert.ok(size<=65000,`assets/i18n.js gzip ${size} exceeds 65000 bytes`)});
