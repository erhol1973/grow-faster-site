'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dist=path.resolve(__dirname,'../dist');

test('Executive Journal is publicly readable and offers optional weekly email signup',()=>{
 const html=fs.readFileSync(path.join(dist,'journal.html'),'utf8');
 const pages=html.match(/<article class="page(?: cover)?[^"]*" aria-label="Page \d+"/g)||[];
 assert.equal(pages.length,15,'the flipbook must retain exactly 15 pages');
 assert.match(html,/id="subscribe"/);
 assert.match(html,/data-region="eu1" data-form-id="2da1e87b-2acf-44be-b6fa-34999739895f" data-portal-id="149675328"/);
 assert.match(html,/Every issue remains free to read on the website/);
 assert.match(html,/2LaHoeyrPRL62-jSZlzmJXw/);
 const insights=fs.readFileSync(path.join(dist,'insights.html'),'utf8');
 assert.match(insights,/href="journal\.html">Read issue 01/);
 assert.match(insights,/href="journal\.html#subscribe">Get new issues by email/);
});
