'use strict';
// The extraction contract keeps its committed hashes (the reviewed guarantee); the reason for each change lives in its own
// file in language/nl-extraction-reviews/ (25 Nov 2026), so parallel PRs do not rewrite the same technicalReview line.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),DIR=path.join(ROOT,'language','nl-extraction-reviews');
const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'language','nl-extraction.json'),'utf8'));

test('technicalReview stays a fixed pointer; reasons are not chained into the contract again',()=>{
  assert.deepEqual(Object.keys(contract.technicalReview),['date','reason']);
  assert.equal(contract.technicalReview.date,'2026-11-25');
  assert.match(contract.technicalReview.reason,/^Vast veld\. .*language\/nl-extraction-reviews\/JJJJ-MM-DD-<slug>\.md/);
  assert.doesNotMatch(contract.technicalReview.reason,/Eerdere reden/,'write the reason with node scripts/nl-contract.cjs <slug> "<reason>" instead');
});

test('every review file is named YYYY-MM-DD-<slug>.md with a heading and content; the history is preserved',()=>{
  const files=fs.readdirSync(DIR);assert.ok(files.length>=1);
  for(const f of files){assert.match(f,/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/,f);
    const text=fs.readFileSync(path.join(DIR,f),'utf8');assert.match(text,/^# \S/,f);assert.ok(text.trim().split('\n').length>=3,f)}
  const history=fs.readFileSync(path.join(DIR,'2026-11-25-historiek-tot-en-met-25-november.md'),'utf8');
  assert.match(history,/Eigen afspraakmodule/);assert.match(history,/Eerdere reden:/);
});

test('the contract script accepts only clean slugs',()=>{
  const {SLUG}=require('../scripts/nl-contract.cjs');
  for(const ok of ['analytics','minder-conflicten-2'])assert.ok(SLUG.test(ok),ok);
  for(const bad of ['','Hoofdletter','met spatie','-start','eind-','dubbel--streep','../pad'])assert.equal(SLUG.test(bad),false,bad);
});
