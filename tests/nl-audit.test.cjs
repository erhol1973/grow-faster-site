'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {hash,validateContract,validateCoverage,delta,validateBaseline,endpoint,check,batches,distribute}=require('../scripts/nl-audit.cjs');
const {promote}=require('../scripts/nl-promote.cjs');
const block=text=>({id:'page#paragraph',text,sha256:hash(text),engine:{version:'6.6'}});
const baseline=()=>({schema:1,sourceCommit:'a'.repeat(40),history:[],blocks:[block('Dit is een zin.')],findings:[]});
test('Extraction changes, added scripts and coverage regressions fail closed',()=>{
  const original=[{file:'assets/site.js',sha256:hash('source')}];
  assert.doesNotThrow(()=>validateContract(original,structuredClone(original),'JavaScript'));
  assert.throws(()=>validateContract(original,[{file:'assets/site.js',sha256:hash('changed')}],'JavaScript'),/contract changed/);
  assert.throws(()=>validateContract(original,[...original,{file:'new.js',sha256:hash('new')}],'JavaScript'),/contract changed/);
  const pages=[{file:'index.html',status:'scanned',blocks:5}];
  assert.doesNotThrow(()=>validateCoverage(pages,pages));assert.throws(()=>validateCoverage(pages,[]),/Empty/);
  assert.throws(()=>validateCoverage(pages,[{file:'new.html',status:'scanned',blocks:1}]),/removed/);
  assert.throws(()=>validateCoverage([],pages.concat(pages)),/Duplicate/);
});
test('Batching retains complete paragraphs and maps UTF-16 offsets back to each original',()=>{
  const first=block('Een volledige zin. Nog een zin.');const second=block('Tweede alinea met é en 😀.');
  const grouped=batches([first,first,second]);assert.equal(grouped.length,1);assert.equal(grouped[0].text,first.text+'\n\n'+second.text);
  const offset=first.text.length+2+7;const mapped=distribute(grouped[0],{matches:[{offset,length:6}]});
  assert.equal(mapped.get(second.sha256).matches[0].offset,7);assert.equal(mapped.get(first.sha256).matches.length,0);
  assert.throws(()=>distribute(grouped[0],{matches:[{offset:first.text.length-1,length:4}]}),/boundary/);
  assert.equal(batches([block('a'.repeat(10000)),block('b'.repeat(10000))]).length,2);
});
test('Only changed/new paragraphs are checked, without shortening context',()=>{
  const b=baseline();assert.equal(delta(b.blocks,b).pending.length,0);
  const changed=block('Dit is een gewijzigde zin. Hier staat de volledige context.');
  assert.deepEqual(delta([changed],b).pending,[changed]);assert.equal(delta([],b).deleted.length,1);
});
test('Hash alone never constitutes a review or a machine receipt',()=>{
  const b=baseline();assert.doesNotThrow(()=>validateBaseline(b,()=>true));assert.equal(b.blocks[0].review,undefined);
  delete b.blocks[0].engine;assert.throws(()=>validateBaseline(b,()=>true),/receipt/);
});
test('Reject divergent history, duplicate IDs, tampering and unsupported review claims',()=>{
  assert.throws(()=>validateBaseline(baseline(),()=>false),/ancestor/);
  const b=baseline();b.blocks[0].text='Vervangen';assert.throws(()=>validateBaseline(b,()=>true),/Invalid/);
  const c=baseline();c.blocks.push(c.blocks[0]);assert.throws(()=>validateBaseline(c,()=>true),/duplicate/);
  const d=baseline();d.blocks[0].review={reviewer:'Person'};assert.throws(()=>validateBaseline(d,()=>true),/evidence/);
});
test('Never call public API, arbitrary hosts or a redirect',async()=>{
  for(const url of ['https://api.languagetool.org/v2/check','https://api.languagetoolplus.com/v2/check','http://example.com/v2/check','http://127.0.0.1:18081/v2/check?redirect=1'])assert.throws(()=>endpoint(url));
  let called=false;await assert.rejects(check('Tekst','https://api.languagetool.org/v2/check',()=>{called=true}));assert.equal(called,false);
  await check('Volledige zin met context.','http://127.0.0.1:18081/v2/check',async(url,options)=>{
    assert.equal(options.redirect,'error');assert.equal(options.body.get('text'),'Volledige zin met context.');
    return {ok:true,json:async()=>({matches:[],software:{version:'6.6'},language:{code:'nl'}})};
  });
});
test('Malformed, incomplete, oversized and failed engine scans fail closed',async()=>{
  const url='http://127.0.0.1:18081/v2/check';
  await assert.rejects(check('a'.repeat(18001),url),/never truncate/);
  await assert.rejects(check('Zin',url,async()=>({ok:false,status:429})),/429/);
  await assert.rejects(check('Zin',url,async()=>({ok:true,json:async()=>({matches:[]})})),/Incomplete/);
  await assert.rejects(check('Zin',url,async()=>({ok:true,json:async()=>({matches:[],software:{version:'6.6'},language:{code:'nl'},warnings:{incompleteResults:true}})})),/Incomplete/);
});
test('Candidate promotion enforces compare-and-swap and preserves findings and history',()=>{
  const old=baseline();old.findings=[{id:'finding',blockId:'page#paragraph',textHash:old.blocks[0].sha256,rule:'RULE',status:'open'}];
  const text=JSON.stringify(old);const candidate={...structuredClone(old),parentBaseline:hash(text),history:[{sourceCommit:old.sourceCommit,digest:hash(text)}]};
  assert.doesNotThrow(()=>promote(text,candidate,()=>true));
  assert.throws(()=>promote(text+' ',candidate,()=>true),/Stale/);
  const dropped=structuredClone(candidate);dropped.findings=[];assert.throws(()=>promote(text,dropped,()=>true),/finding/);
  const edited=structuredClone(candidate);edited.findings[0].status='resolved';assert.throws(()=>promote(text,edited,()=>true),/finding/);
  const invented=structuredClone(candidate);invented.blocks[0].review={reviewer:'AI',reference:'hash',date:'2026-11-11',sha256:invented.blocks[0].sha256};assert.throws(()=>promote(text,invented,()=>true),/invent/);
});
