'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {typographyMarkup,prioritizeTranslations}=require('../scripts/typography-build.cjs');
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

test('translation priority preserves existing script URLs, defer and execution order',()=>{
 const tags=['<script defer src="assets/i18n.js?v=edition"></script>',
  '<script defer src="assets/content.js"></script>',
  '<script defer src="assets/site.js"></script>',
  '<script data-src="assets/i18n.js" src="assets/other.js"></script>',
  '<script defer src="https://example.com/assets/i18n.js"></script>'];
 const original=tags.join('\n');const prioritized=prioritizeTranslations(original);
 assert.equal(prioritized.replace(' fetchpriority="high"',''),original);
 assert.equal((prioritized.match(/fetchpriority="high"/g)||[]).length,1);
 assert.equal(prioritizeTranslations(prioritized),prioritized,'the hint is idempotent');
 const account='<meta http-equiv="Content-Security-Policy" content="script-src self; style-src self"><script defer src="/assets/cms-config.js"></script><script defer src="/assets/member-auth.js"></script><script defer src="/assets/member-account.js"></script>';
 assert.equal(prioritizeTranslations(account),account,'CSP account scripts and order remain unchanged');
 assert.equal(prioritizeTranslations('<script defer src="/assets/i18n.js" fetchpriority="low"></script>'),
  '<script defer src="/assets/i18n.js" fetchpriority="high"></script>');
});
test('built ordinary pages prioritize one existing deferred dictionary without adding a preload',()=>{
 for(const route of ['index.html','books.html','insights.html','approach.html']){
  const html=fs.readFileSync(path.join(root,'dist',route),'utf8');
  const scripts=[...html.matchAll(/<script\b[^>]*>/gi)].map(x=>x[0]);
  const dictionaries=scripts.filter(tag=>/src="\/?assets\/i18n\.js(?:[?"#])/.test(tag));
  assert.equal(dictionaries.length,1,route);assert.match(dictionaries[0],/\bdefer\b/,route);
  assert.match(dictionaries[0],/fetchpriority="high"/,route);
  assert.ok(scripts.indexOf(dictionaries[0])<scripts.findIndex(tag=>/src="\/?assets\/site\.js(?:[?"#])/.test(tag)),route);
  assert.doesNotMatch(html,/<link[^>]+(?:preload|modulepreload)[^>]+i18n\.js/i,route);
 }
});
