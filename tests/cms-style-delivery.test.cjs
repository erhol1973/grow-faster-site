'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
// About.html joined the homepage pattern on 22 Nov 2026: its mobile Lighthouse LCP sat at the 2.5 s limit, and one
// render-blocking request less keeps it under the threshold without loosening the budget.
for(const page of ['index.html','about.html'])test(page+' retains exact CMS media styling without another render-blocking stylesheet request',()=>{
 const html=fs.readFileSync('dist/'+page,'utf8');
 const css=fs.readFileSync('assets/cms-public.css','utf8').trim();
 assert.doesNotMatch(html,/<link\b[^>]*href=["']assets\/cms-public\.css["'][^>]*>/);
 assert.equal(html.match(/<style data-cms-media>([\s\S]*?)<\/style>/)?.[1],css);
 if(page==='index.html')assert.match(html,/<section class="wrap" hidden data-cms-video-section>/);
});
