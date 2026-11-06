'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.resolve(__dirname,'../dist',file),'utf8');

test('Monthly Issue 01 replaces the old reader in Dutch and French',()=>{
 for(const [file,language,other] of [['journal.html','nl','journal-fr.html'],['journal-fr.html','fr','journal.html']]){
  const html=read(file);
  assert.match(html,new RegExp('<html lang="'+language+'">'));
  assert.equal([...html.matchAll(/<article class="sheet[^"]*" id="p(\d+)"/g)].length,15);
  assert.match(html,new RegExp('data-alternate[^>]*href="'+other+'"'));
  assert.match(html,/id="p14"[\s\S]*journal-01-cartoon\.webp[\s\S]*id="p15"[\s\S]*id="source-16"/);
  assert.match(html,/id="subscribe"[\s\S]*2LaHoeyrPRL62-jSZlzmJXw/);
  assert.doesNotMatch(html,/\bweekly\b|week 45/i);
 }
 const insights=read('insights.html');
 assert.match(insights,/href="insights\.html"[^>]*>Executive Journal/);
 assert.match(insights,/id="executive-journal"[\s\S]*Monthly Executive Journal[\s\S]*href="journal\.html" lang="nl"[\s\S]*href="journal-fr\.html" lang="fr"/);
 assert.doesNotMatch(insights,/Weekly executive journal/i);
});
