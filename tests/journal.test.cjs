'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.resolve(__dirname,'../dist',file),'utf8');

test('Monthly Issue 01 replaces the old reader in Dutch and French',()=>{
 for(const [file,language,other] of [['journal.html','nl','journal-fr.html'],['journal-fr.html','fr','journal.html']]){
  const html=read(file);
  assert.match(html,new RegExp('<html lang="'+language+'"(?: class="[^"]*")?>'));
  assert.equal([...html.matchAll(/<article class="sheet[^"]*" id="p(\d+)"/g)].length,15);
  assert.match(html,new RegExp('data-alternate[^>]*href="'+other+'"'));
  assert.match(html,/id="p14"[\s\S]*journal-01-cartoon\.webp[\s\S]*id="p15"[\s\S]*id="source-16"/);
  assert.match(html,/id="subscribe"[\s\S]*2LaHoeyrPRL62-jSZlzmJXw/);
  assert.doesNotMatch(html,/\bweekly\b|week 45/i);
 }
 const insights=read('insights.html');
 assert.match(insights,/href="insights\.html"[^>]*>Executive Journal/);
 assert.match(insights,/id="executive-journal"[\s\S]*De Maandelijkse Executive Journal[\s\S]*href="journal\.html" lang="nl"[\s\S]*href="journal-fr\.html" lang="fr"/);
 assert.doesNotMatch(insights,/Weekly executive journal/i);
});


test('complete translations retain every source-page number, table and source entry',()=>{
 const fixture=require('./journal-source-numbers.json');
 for(const file of ['journal.html','journal-fr.html']){
  const html=read(file);
  const pages=[...html.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(m=>m[0]);
  assert.equal(pages.length,15);
  for(const [index,required] of Object.entries(fixture.pages)){
   const page=pages[Number(index)-1];
   const text=page.replace(/<[^>]+>/g,' ');
   const values=new Set((text.match(/\d+(?:[.,]\d+)?/g)||[]).map(v=>v.replace(',','.')));
   for(const list of page.matchAll(/<ol\b[^>]*>([\s\S]*?)<\/ol>/g)){
    const count=(list[1].match(/<li\b/g)||[]).length;
    for(let n=1;n<=count;n++)values.add(String(n));
   }
   for(const value of required)assert.ok(values.has(value),file+' page '+index+' lost '+value);
  }
  for(const [pageIndex,rowCount] of [[5,5],[10,4],[12,5],[13,5]]){
   const rows=(pages[pageIndex-1].match(/<tr>/g)||[]).length;
   assert.equal(rows,rowCount+1,file+' page '+pageIndex+' table');
  }
  for(let n=1;n<=16;n++)assert.match(pages[14],new RegExp('id="source-'+n+'"'));
  assert.equal((pages[3].match(/class="kicker"/g)||[]).length,4);
  assert.match(pages[2],/234[\s\S]*86[\s\S]*1500/);
  assert.match(pages[13],/journal-01-cartoon\.webp/);
 }
});
