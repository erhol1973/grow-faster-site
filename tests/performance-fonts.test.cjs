'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {typographyMarkup}=require('../scripts/typography-build.cjs');
const root=path.resolve(__dirname,'..');
test('built pages receive the complete type contract without a blocking stylesheet request',()=>{
 const css=fs.readFileSync(path.join(root,'assets/typography.css'),'utf8');
 for(const route of ['index.html','books.html','journal-fr.html','journal.html','executive-radar/index.html']){
  const html=fs.readFileSync(path.join(root,'dist',route),'utf8');
  const inline=html.match(/<style data-gf-typography>([\s\S]*?)<\/style>/);
  assert.ok(inline,route);
  assert.equal(inline[1],css,route+' retains the exact type contract');
  assert.doesNotMatch(html,/<link[^>]+rel=["']stylesheet["'][^>]+href=["'][^"']*typography\.css/i,route);
  assert.match(html,/<link rel="preload" href="\/assets\/hanken-grotesk-latin\.woff2" as="font"/);
 }
});
test('strict CSP account and CMS pages retain the external type contract',()=>{
 assert.equal(fs.readFileSync(path.join(root,'dist/assets/typography.css'),'utf8'),
  fs.readFileSync(path.join(root,'assets/typography.css'),'utf8'));
 for(const route of ['account.html','admin.html']){
  const html=fs.readFileSync(path.join(root,'dist',route),'utf8');
  assert.match(html,/style-src 'self';/,route+' keeps its existing strict policy');
  assert.doesNotMatch(html,/<style data-gf-typography>/,route);
  assert.match(html,/<link rel="stylesheet" href="\/assets\/typography\.css">/,route);
 }
 const markup=typographyMarkup('body{}',{external:true});
 assert.ok(markup.includes('href="/assets/typography.css"'));
 assert.ok(!markup.includes('<style'));
});
test('inline type contract cannot close its HTML style container',()=>{
 for(const css of ['body{}<'+ '/style><script>alert(1)</script>','<'+ '/STYLE >','<'+ '/style data-x>',null]){
  assert.throws(()=>typographyMarkup(css),/Unsafe typography/);
 }
 assert.ok(typographyMarkup('body { color: navy; }').includes('body { color: navy; }'));
});
