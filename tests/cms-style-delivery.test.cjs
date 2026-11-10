'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('homepage retains exact CMS media styling without another render-blocking stylesheet request',()=>{
 const html=fs.readFileSync('dist/index.html','utf8');
 const css=fs.readFileSync('assets/cms-public.css','utf8').trim();
 assert.doesNotMatch(html,/<link\b[^>]*href=["']assets\/cms-public\.css["'][^>]*>/);
 assert.equal(html.match(/<style data-cms-media>([\s\S]*?)<\/style>/)?.[1],css);
 assert.match(html,/<section class="wrap" hidden data-cms-video-section>/);
});
