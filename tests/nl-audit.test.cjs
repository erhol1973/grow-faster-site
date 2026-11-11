'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {hash,files,baselineDigest,allowLocalRequest,catalogBlocks,validateContract,validateCoverage,delta,findingId,validateBaseline,endpoint,check,batches,distribute}=require('../scripts/nl-audit.cjs');
const {promote}=require('../scripts/nl-promote.cjs');
const block=text=>({id:'page#paragraph',text,sha256:hash(text),engine:{version:'6.6'}});
const baseline=()=>({schema:1,sourceCommit:'a'.repeat(40),history:[],blocks:[block('Dit is een zin.')],findings:[]});
test('Finding tuple identities avoid offset/length collisions while retaining exact legacy identities',()=>{
  const paragraph=block('Een volledige alinea. '.repeat(8));
  const first={rule:{id:'RULE'},offset:9,length:12},second={rule:{id:'RULE'},offset:91,length:2};
  const oldId=hash(paragraph.id+paragraph.sha256+'RULE'+first.offset+first.length);
  assert.equal(oldId,hash(paragraph.id+paragraph.sha256+'RULE'+second.offset+second.length));
  assert.notEqual(findingId(paragraph,first,[]),findingId(paragraph,second,[]));
  const legacy={id:oldId,blockId:paragraph.id,textHash:paragraph.sha256,rule:'RULE',offset:9,length:12,status:'open'};
  const ledger=[structuredClone(legacy)];assert.equal(findingId(paragraph,first,ledger),oldId);
  assert.notEqual(findingId(paragraph,second,ledger),oldId);assert.deepEqual(ledger,[legacy]);
});
test('Public inventory allows only local GET/HEAD and never auth, signing or write calls',()=>{
  const origin='http://127.0.0.1:4173';
  assert.equal(allowLocalRequest(origin+'/index.html','GET',origin),true);
  assert.equal(allowLocalRequest(origin+'/assets/site.js','HEAD',origin),true);
  for(const method of ['POST','PUT','PATCH','DELETE'])assert.equal(allowLocalRequest(origin+'/rpc',''+method,origin),false);
  for(const url of ['https://project.supabase.co/rest/v1/cms_publications','https://project.supabase.co/storage/v1/object/sign/cms-media/image.webp','mailto:person@example.test','invalid'])assert.equal(allowLocalRequest(url,'GET',origin),false);
});
test('Static CMS catalog extracts only committed Dutch text/alt with stable source identities',()=>{
  const catalog=[{route:'index.html',section:'hero',fields:[{key:'heading',type:'text',nl:'Een volledige zin.\nNog een zin.',fr:'Français'},{key:'image',type:'media',alt:{nl:'Een Nederlandse afbeelding',fr:'Image française'}},{key:'optional-video',type:'media',alt:{nl:'',fr:''}}]}];
  const source='window.GF_CMS_CATALOG='+JSON.stringify(catalog)+';';const rows=catalogBlocks(source);
  assert.equal(rows.length,2);assert.equal(rows[0].text,'Een volledige zin. Nog een zin.');
  assert.equal(rows[0].id,'index.html#cms-catalog:hero:heading:text');
  assert.equal(rows[0].source.scope,'committed-defaults');assert.equal(rows[0].source.file,'assets/cms-catalog.js');
  assert.equal(rows[1].text,'Een Nederlandse afbeelding');assert.ok(!rows.some(r=>r.text.includes('Français')));
  const changed=structuredClone(catalog);changed[0].fields[0].nl='Een gewijzigde volledige zin.';
  const after=catalogBlocks('window.GF_CMS_CATALOG='+JSON.stringify(changed)+';');
  assert.equal(after[0].id,rows[0].id);assert.notEqual(after[0].sha256,rows[0].sha256);
});
test('Static CMS catalog fails closed on executable tails, missing Dutch values and duplicate keys',()=>{
  const catalog=[{route:'index.html',section:'hero',fields:[{key:'heading',type:'text',nl:'Nederlandse tekst.'}]}];
  const assignment=value=>'window.GF_CMS_CATALOG='+JSON.stringify(value)+';';
  assert.throws(()=>catalogBlocks(assignment(catalog)+'globalThis.catalogExecuted=true;'),/format/);
  assert.equal(globalThis.catalogExecuted,undefined);
  assert.throws(()=>catalogBlocks('window.GF_CMS_CATALOG=[{bad:true}];'));
  const missing=structuredClone(catalog);delete missing[0].fields[0].nl;assert.throws(()=>catalogBlocks(assignment(missing)),/Missing Dutch/);
  const duplicate=structuredClone(catalog);duplicate[0].fields.push(duplicate[0].fields[0]);assert.throws(()=>catalogBlocks(assignment(duplicate)),/Duplicate/);
  const unsafe=structuredClone(catalog);unsafe[0].route='../admin.html';assert.throws(()=>catalogBlocks(assignment(unsafe)),/section/);
});
test('OneDrive placeholders are files; actual symlinks and special entries are rejected',()=>{
  const io={readdirSync:()=>[{name:'page.html',isSymbolicLink:()=>true}],lstatSync:()=>({isSymbolicLink:()=>false,isDirectory:()=>false,isFile:()=>true})};
  assert.deepEqual(files('/fixture','',io),['page.html']);
  io.lstatSync=()=>({isSymbolicLink:()=>true});assert.throws(()=>files('/fixture','',io),/Symlink/);
  io.lstatSync=()=>({isSymbolicLink:()=>false,isDirectory:()=>false,isFile:()=>false});assert.throws(()=>files('/fixture','',io),/Non-regular/);
});
test('Baseline digests are portable across Windows/Linux but still detect content edits',()=>{
  assert.equal(baselineDigest('{\n"key":1\n}\n'),baselineDigest('{\r\n"key":1\r\n}\r\n'));
  assert.notEqual(baselineDigest('{"key":1}'),baselineDigest('{"key":2}'));
});
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
  await assert.rejects(check('Zin',url,async()=>({ok:true,json:async()=>({matches:[],software:{version:'unexpected'},language:{code:'nl'}})})),/Unexpected/);
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
