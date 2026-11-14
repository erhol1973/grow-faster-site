'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {decisionCopy}=require('../scripts/nl-decision-copy.cjs');
const source=()=>fs.readFileSync('decision-journey/assets/app.js','utf8');
test('static decision interface extractor includes complete Dutch declarations and actual literal overlays without running app',()=>{
 const blocks=decisionCopy(source());assert(blocks.length>150);assert.equal(new Set(blocks.map(b=>b.id)).size,blocks.length);
 const find=key=>blocks.find(b=>b.id==='static-decision-nl:'+key)?.text;
 assert.match(find('reviewCopy.nl.noMeasurements'),/Meetwaarden mogen nog ontbreken/);
 assert.match(find('reviewCopy.nl.statuses.unmeasured'),/Geen waarde ingevoerd; meting niet bevestigd/);
 assert.match(find('reviewCopy.nl.percentHint'),/absolute waarde/);
 assert.match(find('copy.nl.languageNotice'),/ingevoerde getallen.*precies behouden/);
 assert.equal(find('copy.nl.title'),'Van signaal naar een onderbouwde keuze.');
 assert.equal(find('copy.nl.title.0'),undefined);assert.equal(find('copy.nl.title.1'),undefined);
 assert.deepEqual(blocks.find(b=>b.id==='static-decision-nl:copy.nl.title').source.composedFrom,['static-decision-nl:copy.nl.title.0','static-decision-nl:copy.nl.title.1']);
  assert.equal(find('copy.nl.count'),'{n} van 6 geselecteerd');
 assert(blocks.every(b=>b.source.language==='nl'&&b.page==='decision-journey/index.html'));
});
test('static decision data fails closed for executable values, changed boundary or duplicate declarations',()=>{
 const s=source();assert.throws(()=>decisionCopy(s.replace("step:['Resultaat'","step:[networkCall()")),/Only inert|Executable|Expected/);
 assert.throws(()=>decisionCopy(s.replace('\nlet state,dirty=false,errors=[];','\nlet differentState;')),/boundary/);
 assert.throws(()=>decisionCopy(s.replace('const reviewCopy={','const reviewCopy={nl:{x:"a"},fr:{x:"b"}};\nconst reviewCopy={')),/one static declaration/);
  assert.throws(()=>decisionCopy(s.replace('\nlet state,dirty=false,errors=[];','\n/*\nObject.assign(reviewCopy.nl,{title:"Decoy title"});\n*/\nlet state,dirty=false,errors=[];')),/not unique executable code|Unsupported decision Object.assign/);
  for(const mutation of ["copy.nl.title='Invisible new text';","copy.nl['title']='Computed mutation';","Object.assign(copy['nl'],{title:'Other'});"])
    assert.throws(()=>decisionCopy(s.replace('\nlet state,dirty=false,errors=[];','\n'+mutation+'\nlet state,dirty=false,errors=[];')),/Unsupported decision/);
  assert.throws(()=>decisionCopy(s.replace('nl:{skip:', 'other:{skip:')),/Missing decision NL\/FR/);
 const title="title:['Van signaal naar','een onderbouwde keuze.']";assert.ok(s.includes(title));
 for(const shape of ["title:['Van signaal naar']","title:['Van signaal naar','een onderbouwde keuze.','Nieuwe tekst']","title:['Van signaal naar',{}]","title:'Van signaal naar een onderbouwde keuze.'"])
  assert.throws(()=>decisionCopy(s.replace(title,shape)),/whole-title composition/);
 assert.throws(()=>decisionCopy(s.replace(title,"title:['Van signaal naar',null]")),/Only inert/,'null is rejected by the existing inert-data parser before title composition');
});

test('built JavaScript inventory covers every journey module and rejects an unreviewed new script',()=>{
 const {sources,validateContract}=require('../scripts/nl-audit.cjs'),inventory=sources();
 for(const name of ['app.js','cases.js','model.js','roadmap.js','value-review.js'])assert(inventory.some(row=>row.file==='decision-journey/assets/'+name),name);
 assert.throws(()=>validateContract(inventory,[...inventory,{file:'decision-journey/assets/new.js',sha256:'not-reviewed'}],'JavaScript'),/extraction contract changed/);
});
