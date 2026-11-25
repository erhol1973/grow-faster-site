'use strict';
// Test plan as one file per item (25 Nov 2026): parallel sessions add files instead of prepending to docs/TESTPLAN.md.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const T=require('../scripts/testplan-index.cjs');

test('every test-plan item is a correctly named file with one heading, and the index lists all of them',()=>{
  const {items,errors}=T.entries();assert.deepEqual(errors,[]);
  assert.ok(items.length>=54,'the 54 migrated items stay present');
  const listed=T.index();for(const i of items)assert.ok(listed.includes(`(${i.file.replace(/^docs\//,'')})`),`not indexed: ${i.file}`);
  assert.equal(listed.split('\n').length,items.length);
  assert.ok(items.every((x,k)=>k===0||items[k-1].file>=x.file),'index is newest first');
});

test('docs/TESTPLAN.md holds only the convention and the standing policy, never new items',()=>{
  assert.deepEqual(T.policySections(),T.POLICY,'add a new item as docs/testplan/YYYY-MM-DD-<slug>.md instead of a section in docs/TESTPLAN.md');
  const plan=fs.readFileSync(path.join(__dirname,'..','docs','TESTPLAN.md'),'utf8');
  assert.match(plan,/docs\/testplan\/|\(testplan\/\)/);assert.match(plan,/JJJJ-MM-DD-<slug>\.md/);
});

test('the validator rejects misnamed, undated, heading-less and multi-item files',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'testplan-'));fs.mkdirSync(path.join(root,'docs','testplan'),{recursive:true});
  const put=(n,t)=>fs.writeFileSync(path.join(root,'docs','testplan',n),t);
  put('2026-11-25-goed.md','## Goed, 25 november 2026\n\nTekst.\n');
  put('Goed item.md','## X\n\nY\n');put('2026-02-30-datum.md','## X\n\nY\n');put('2026-11-25-geen-kop.md','Tekst zonder kop\n');
  put('2026-11-25-twee.md','## A\n\nx\n\n## B\n\ny\n');put('2026-11-25-leeg.md','## Alleen een kop');
  fs.mkdirSync(path.join(root,'docs','testplan','sub'));
  const {items,errors}=T.entries(root);
  assert.deepEqual(items.map(i=>i.file).sort(),['docs/testplan/2026-11-25-goed.md','docs/testplan/2026-11-25-leeg.md','docs/testplan/2026-11-25-twee.md']);
  for(const bad of ['Goed item.md','2026-02-30-datum.md','2026-11-25-geen-kop.md','2026-11-25-twee.md','2026-11-25-leeg.md','sub'])assert.ok(errors.some(e=>e.startsWith(bad+':')),bad);
  assert.ok(!errors.some(e=>e.startsWith('2026-11-25-goed.md')));
});
