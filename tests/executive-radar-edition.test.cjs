'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const tools=require('../assets/baies-dev-edition.js'),edition=require('../assets/executive-radar-edition.js');
const clone=()=>structuredClone(edition),now=new Date('2026-11-13T12:00:00Z');

test('Executive Radar edition: researched pilot has at most three complete bilingual signals and traceable sources',()=>{
  assert.deepEqual(tools.validateEdition(edition),[]);assert.ok(edition.signals.length>0&&edition.signals.length<=3);assert.ok(edition.priorityResearch.length>0);
  assert.equal(edition.editorialMode,'curated-pilot');assert.equal(tools.editionStatus(edition,now).code,'current');
  assert.ok(Object.isFrozen(edition));assert.ok(Object.isFrozen(edition.signals));
  for(const signal of edition.signals){assert.ok(signal.sourceIds.every(id=>edition.sources.some(source=>source.id===id)));for(const lang of ['nl','fr']){assert.ok(signal.changed[lang].length>40);assert.ok(signal.uncertainty[lang].length>40);}}
});

test('Executive Radar edition: real calendar dates, chronology and future source checks fail closed',()=>{
  for(const date of ['2026-02-29','2026-02-31','2026-13-01','2026-11-00','13-11-2026','2026-11-13T00:00:00Z',''])assert.equal(tools.validDate(date),false,date);
  assert.equal(tools.validDate('2028-02-29'),true);assert.equal(tools.validDate('2026-11-13'),true);
  for(const mutate of [d=>d.asOf='2026-02-31',d=>d.reviewDue='2026-11-12',d=>d.periodStart='2026-11-14',d=>d.sources[0].publishedOn='2026-11-14',d=>d.sources[0].checkedOn='2026-11-14',d=>d.sources[0].checkedOn='2026-01-01']){const data=clone();mutate(data);assert.equal(tools.editionStatus(data,now).code,'invalid');assert.throws(()=>tools.brief(data,'nl','medium',now),/No validated edition/);}
});

test('Executive Radar edition: review starts on the reviewDue date in Europe Brussels, including exact midnight',()=>{
  assert.equal(tools.editionStatus(edition,new Date('2026-11-19T22:59:59.999Z')).code,'current');
  assert.equal(tools.dayInBrussels(new Date('2026-11-19T23:00:00.000Z')),'2026-11-20');
  assert.equal(tools.editionStatus(edition,new Date('2026-11-19T23:00:00.000Z')).code,'overdue');
  assert.equal(tools.editionStatus(edition,new Date('2026-11-21T12:00:00.000Z')).code,'overdue');
  assert.equal(tools.editionStatus(edition,new Date('2026-11-12T12:00:00.000Z')).code,'scheduled');
  assert.throws(()=>tools.brief(edition,'nl','medium',new Date('2026-11-12T12:00:00Z')),/No validated edition/);
  assert.equal(tools.editionStatus(edition,new Date(NaN)).code,'invalid');
});

test('Executive Radar edition: missing, empty, malformed and excessive signals never become current content',()=>{
  for(const data of [undefined,null,{}, {...clone(),sources:null}, {...clone(),signals:null}, {...clone(),sources:[null]}, {...clone(),signals:[null]}]){assert.doesNotThrow(()=>tools.validateEdition(data));assert.equal(tools.editionStatus(data,now).code,'invalid');}
  const empty=clone();empty.signals=[];assert.equal(tools.editionStatus(empty,now).code,'empty');assert.throws(()=>tools.brief(empty,'fr','medium',now),/No validated edition/);
  const excessive=clone();excessive.signals.push({...excessive.signals[0],id:'fourth'});assert.equal(tools.editionStatus(excessive,now).code,'invalid');
});

test('Executive Radar edition: only explicit HTTPS primary publisher hosts, no credentials, spoofing or custom ports',()=>{
  for(const url of ['javascript:alert(1)','http://www.nbb.be/news','https://www.nbb.be.evil.example/news','https://user:password@www.nbb.be/news','https://www.nbb.be:8443/news','https://unapproved.example/news','data:text/html,test','//www.nbb.be/news'])assert.equal(tools.safeSource(url),false,url);
  for(const source of edition.sources)assert.equal(tools.safeSource(source.url),true,source.url);
  const data=clone();data.sources[0].url='javascript:alert(1)';assert.equal(tools.editionStatus(data,now).code,'invalid');
});

test('Executive Radar edition: NL/FR parity, bounded editorial criteria, context and source identity are mandatory',()=>{
  for(const mutate of [d=>d.signals[0].impact.fr='',d=>delete d.signals[0].contexts.medium.fr,d=>d.sources[0].scope.nl='',d=>d.priorityResearch[0].limit.fr='',d=>d.signals[0].sourceIds=['missing'],d=>d.signals[1].id=d.signals[0].id,d=>d.sources[1].id=d.sources[0].id,d=>d.signals[0].scorecard.evidence=0,d=>d.signals[0].scorecard.brevity=6,d=>d.signals[0].scorecard.relevance=2.5,d=>d.signals[0].action='publish']){const data=clone();mutate(data);assert.ok(tools.validateEdition(data).length>0);}
});

test('Executive Radar edition: older primary research can be background but cannot silently become a current event',()=>{
  const data=clone();for(const source of data.sources){source.publishedOn='2026-01-01';source.checkedOn='2026-11-13';}
  assert.equal(tools.editionStatus(data,now).code,'invalid');for(const signal of data.signals)signal.freshness='background';assert.deepEqual(tools.validateEdition(data),[]);
  assert.match(tools.brief(data,'nl','medium',now),/Oudere achtergrond — geen nieuw feit/);
});

test('Executive Radar edition: current brief exports source facts, editorial implications, limits, context and exact primary URLs in both languages',()=>{
  for(const lang of ['nl','fr']){const before=clone(),text=tools.brief(edition,lang,'medium',now);assert.match(text,/2026-11-13/);assert.match(text,/2026-11-20/);assert.ok(text.includes(tools.copy[lang].notLive));assert.ok(text.includes(tools.copy[lang].medium));assert.ok(text.includes(tools.copy[lang].score));
    for(const signal of edition.signals)for(const key of ['changed','impact','decision','nextStep','uncertainty'])assert.ok(text.includes(signal[key][lang]));
    for(const source of edition.sources){assert.ok(text.includes(source.url));assert.ok(text.includes(source.publishedOn));assert.ok(text.includes(source.checkedOn));assert.ok(text.includes(source.scope[lang]));}
    assert.doesNotMatch(text,/BE-AI-001|BE-EC-003|sponsor|humain.*approuvé|human.*approved/i);assert.deepEqual(edition,before);
  }
  assert.notEqual(tools.brief(edition,'nl','small',now),tools.brief(edition,'nl','large',now));assert.throws(()=>tools.brief(edition,'en','medium',now),RangeError);assert.throws(()=>tools.brief(edition,'nl','invented',now),RangeError);
});

test('Executive Radar edition: stale exports explicitly mark overdue review rather than promising a fresh feed',()=>{
  for(const lang of ['nl','fr'])assert.ok(tools.brief(edition,lang,'medium',new Date('2026-11-20T12:00:00Z')).includes(tools.copy[lang].overdue));
});

test('Executive Radar edition: coupled cache versions, ordered data/helper/runtime and separate background tools are in the public artifact source',()=>{
  const html=fs.readFileSync(path.resolve(__dirname,'../executive-radar/index.html'),'utf8'),version='?v=20261113-ceo-pilot';
  const ordered=['executive-radar-edition.js','baies-dev-edition.js','baies-dev-app.js'];let previous=-1;for(const file of ordered){const at=html.indexOf(file+version);assert.ok(at>previous,file+' is versioned and loaded in dependency order');previous=at;}
  assert.ok(html.includes('baies-dev.css'+version));for(const view of ['overview','dashboard','radar','evidence'])assert.ok(html.includes('id="edition-'+view+'"'));assert.ok(html.includes('data-edition-background'));
  assert.doesNotMatch(html,/id="about"|signup-form|href="#about"/);
});

test('Executive Radar edition: pure helper works in the browser without CommonJS and preserves malicious strings as data only',()=>{
  const sandbox={URL};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../assets/baies-dev-edition.js'),'utf8'),sandbox);assert.equal(typeof sandbox.GF_RADAR_EDITION_TOOLS.validateEdition,'function');
  const data=clone();data.signals[0].title.nl='<img src=x onerror="alert(1)">';assert.deepEqual(tools.validateEdition(data),[]);assert.ok(tools.brief(data,'nl','medium',now).includes(data.signals[0].title.nl));
});
