const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..','dist');
test('shared calculation and consent modules remain small standalone assets',()=>{
  for(const [file,limit]of Object.entries({'assets/models.js':18000,'assets/consent.js':2500}))assert.ok(fs.statSync(path.join(root,file)).size<=limit,`${file}: budget ${limit} exceeded`);
});
test('every menu destination stays within its 85KB HTML transfer budget',()=>{
  for(const file of require('./navigation-cases.json'))assert.ok(fs.statSync(path.join(root,file)).size<=85000,`${file} exceeds 85KB HTML budget`);
});
test('shared JS/CSS and raster images stay within measured release budgets',()=>{const budgets={'assets/site.css':125000,'assets/site.js':55000,'assets/i18n.js':260000,'assets/content.js':23000,'assets/ux.js':15000};for(const [file,max]of Object.entries(budgets))assert.ok(fs.statSync(path.join(root,file)).size<=max,`${file} exceeds ${max} byte budget`);function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(jpe?g|png|webp|avif)$/i.test(p))assert.ok(fs.statSync(p).size<=700000,`${path.relative(root,p)} exceeds 700KB image budget`)}}walk(path.join(root,'img'))});
