'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {typographyMarkup,inlineComponentStyles}=require('../scripts/typography-build.cjs');
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

test('small component styles retain exact bytes and their cascade positions',()=>{
 const css={ 'assets/navigation.css':'.nav{color:navy}', 'assets/books.css':'.book{color:blue}' };
 const page='<head><link rel="stylesheet" href="assets/navigation.css?v=1"><style>.middle{color:red}</style><link rel="stylesheet" href="/assets/books.css"></head>';
 const result=inlineComponentStyles(page,name=>css[name]);
 assert.equal(result,'<head><style data-gf-component-style="assets/navigation.css">.nav{color:navy}</style><style>.middle{color:red}</style><style data-gf-component-style="assets/books.css">.book{color:blue}</style></head>');
 assert.equal(inlineComponentStyles(result,()=>assert.fail('inline output must be idempotent')),result);
});
test('component inlining preserves CSP, conditional styles and URL resolution',()=>{
 const normal='<link rel="stylesheet" href="assets/navigation.css">';
 const strict='<meta http-equiv="Content-Security-Policy" content="style-src self">'+normal;
 assert.equal(inlineComponentStyles(strict,()=>assert.fail('strict CSP must stay external')),strict);
 for(const link of [normal.replace('>',' media="print">'),normal.replace('>',' integrity="sha256-x">'),'<link rel="stylesheet" href="https://example.com/assets/navigation.css">',normal.replace('navigation','site')]){
  assert.equal(inlineComponentStyles(link,()=>assert.fail('unapproved or conditional style must stay external')),link);
 }
 for(const css of ['.nav{background:url(../img/logo.svg)}','@import "other.css";'])assert.equal(inlineComponentStyles(normal,()=>css),normal);
 assert.throws(()=>inlineComponentStyles(normal,()=>'<'+ '/style><script>bad()</script>'),/Unsafe component/);
});
test('built pages inline only small styles while retaining exact standalone assets',()=>{
 for(const route of ['index.html','books.html','insights.html','approach.html','coherence.html']){
  const html=fs.readFileSync(path.join(root,'dist',route),'utf8');
  const styles=[...html.matchAll(/<style data-gf-component-style="(assets\/[^"<>]+)">([\s\S]*?)<\/style>/g)];
  assert.ok(styles.length>0,route);
  for(const [,name,css] of styles){
   assert.equal(css,fs.readFileSync(path.join(root,name),'utf8'),route+' inline '+name);
   assert.equal(css,fs.readFileSync(path.join(root,'dist',name),'utf8'),route+' standalone '+name);
  }
  assert.doesNotMatch(html,/<link[^>]+href="\/?assets\/(navigation|home-hero|books|journal|coherence-film)\.css[?"#]/i,route);
  const scripts=[...html.matchAll(/<script\b[^>]*>/gi)].map(x=>x[0]);const dictionaries=scripts.filter(tag=>/src="\/?assets\/i18n(?:-coherence)?\.js[?"#]/.test(tag));
  assert.equal(dictionaries.length,1,route);assert.match(dictionaries[0],route==='coherence.html'?/src="assets\/i18n-coherence\.js\?v=coherence-1-[a-f0-9]{12}"/:/src="assets\/i18n\.js\?v=20261111-nl-audit"/,route);assert.match(dictionaries[0],/\bdefer\b/,route);assert.doesNotMatch(dictionaries[0],/fetchpriority=/i,route);
  assert.ok(scripts.indexOf(dictionaries[0])<scripts.findIndex(tag=>/src="\/?assets\/site\.js[?"#]/.test(tag)),route);
 }
});
