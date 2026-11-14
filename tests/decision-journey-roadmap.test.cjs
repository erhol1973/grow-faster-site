'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const M = require('../decision-journey/assets/model.js'), R = require('../decision-journey/assets/roadmap.js');
function state(id='external',lang='nl',option='pilot') { const s=M.createState(id,lang);s.selectedDimensions=['process','data'];s.chosenOption=option;return s; }
function plan() { return R.create(state()); }
function has(result,field,code,id) { return result.errors.some(e=>e.field===field&&e.code===code&&(id===undefined||e.actionId===id)); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function fixture() {
  const s=state(), p=R.create(s); p.actions=[
    {...p.actions[0],id:'a-1',startDay:1,endDay:5,dependencies:[]},
    {...p.actions[1],id:'a-2',startDay:6,endDay:30,dependencies:['a-1']},
    {...p.actions[2],id:'a-3',startDay:31,endDay:90,dependencies:['a-2']}
  ]; return {s,p};
}
test('six case-option templates are valid, linked to Canvas, distinct and only proposed',()=>{
  const sequences=new Set();
  for(const id of ['external','internal']) for(const option of ['wait','pilot','scale']) for(const lang of ['nl','fr']) {
    const s=state(id,lang,option),p=R.create(s);
    assert.equal(p.caseId,id);assert.equal(p.sourceFingerprint,R.fingerprint(s)); assert.equal(p.objective,s.fields.question);assert.equal(p.owner,s.fields.owner);
    assert.equal(p.actions.length,6);assert.equal(R.validate(p,s).valid,true,JSON.stringify(R.validate(p,s)));
    assert.ok(p.actions.every(a=>a.status==='planned'&&a.evidence===''));assert.ok(p.actions.every(a=>a.baseline.includes(lang==='nl'?'Nog te meten':'À mesurer')));
    if(lang==='nl')sequences.add(p.actions.map(a=>a.title).join('|'));
  }
  assert.equal(sequences.size,6);
});
test('wait and scale preserve source criteria but explicitly require human adaptation rather than claim a pilot target',()=>{
  for(const option of ['wait','scale'])for(const lang of ['nl','fr']) {
    const s=state('external',lang,option);s.fields.success=lang==='nl'?'Mijn criterium voor de oorspronkelijke proef':'Mon critère pour l’essai initial';
    const before=JSON.stringify(s),p=R.create(s);
    for(const action of p.actions) {
      assert.ok(action.target.includes(s.fields.success));
      assert.notEqual(action.target,s.fields.success);
      assert.match(action.target,lang==='nl'?/nog geen aangepast streefcriterium vastgesteld/:/aucun critère cible adapté n’est encore établi/);
      assert.match(action.target,lang==='nl'?/Menselijke afstemming/:/réexamen humain/);
    }
    assert.equal(JSON.stringify(s),before);
  }
  const s=state();s.fields.success='Eigen voorgesteld proefcriterium';assert.equal(R.create(s).actions[0].target,s.fields.success);
});
test('repeated action resource text identifies one shared Canvas assumption, not six extra budgets',()=>{
  for(const lang of ['nl','fr']) {
    const s=state('external',lang);s.fields.resources=lang==='nl'?'Hypothetisch totaal: 20 werkuren.':'Total hypothétique : 20 heures de travail.';
    const p=R.create(s);
    for(const action of p.actions) {
      assert.ok(action.resources.includes(s.fields.resources));
      assert.match(action.resources,lang==='nl'?/Planbrede aanname uit het Canvas/:/à l’échelle du plan issue du Canvas/);
      assert.match(action.resources,lang==='nl'?/aandeel voor deze actie is nog te bepalen/:/part attribuée à cette action reste à définir/);
      assert.match(action.resources,lang==='nl'?/geen aanvullend actiebudget/:/pas d’un budget supplémentaire/);
    }
    assert.equal(s.fields.resources,lang==='nl'?'Hypothetisch totaal: 20 werkuren.':'Total hypothétique : 20 heures de travail.');
  }
});
test('calendar windows independently match inclusive 30/60/90 day dates and leap year',()=>{
  const p={startDate:'2026-11-27'};
  assert.deepEqual(R.dates(p,1,30),{start:'2026-11-27',end:'2026-12-26'});
  assert.deepEqual(R.dates(p,31,60),{start:'2026-12-27',end:'2027-01-25'});
  assert.deepEqual(R.dates(p,61,90),{start:'2027-01-26',end:'2027-02-24'});
  assert.deepEqual(R.dates({startDate:'2028-02-01'},1,30),{start:'2028-02-01',end:'2028-03-01'});
  assert.deepEqual(R.dates({startDate:'2028-02-01'},1,90),{start:'2028-02-01',end:'2028-04-30'});
  assert.deepEqual(R.dates({startDate:'0001-01-01'},1,1),{start:'0001-01-01',end:'0001-01-01'});
  assert.deepEqual(R.dates({startDate:'2000-02-28'},1,3),{start:'2000-02-28',end:'2000-03-01'});
});
test('calendar rejects invalid centuries, non-date strings, noninteger days and ISO overflow',()=>{
  for(const date of ['1900-02-29','2026-02-29','2026-04-31','0000-01-01','2026-1-01','2026-11-27T00:00:00Z',null,''])assert.throws(()=>R.dates({startDate:date},1,90));
  for(const pair of [[0,1],[1,91],[9,8],[1.5,2],[1,2.5],[NaN,2],[1,Infinity],['1',2]])assert.throws(()=>R.dates({startDate:'2026-11-27'},...pair),e=>e.code==='day_range');
  assert.throws(()=>R.dates({startDate:'9999-12-01'},1,90),e=>e.code==='calendar_range');
  assert.throws(()=>R.create(state(),'2026-02-29'));
});
test('creation requires complete Canvas and does not mutate it',()=>{
  const s=state(),before=JSON.stringify(s);R.create(s);assert.equal(JSON.stringify(s),before);
  assert.throws(()=>R.create(M.createState()),e=>e.code==='invalid_canvas');
});
test('fingerprint excludes locale/UI/draft/roadmap and is stable for reordered selections',()=>{
  const s=state(),changed=M.setLanguage(s,'fr');changed.step=4;changed.draftSaved=true;changed.roadmap={changed:true};changed.selectedDimensions.reverse();
  assert.equal(R.fingerprint(s),R.fingerprint(changed));
  for(const field of Object.keys(s.fields)){const c=clone(s);c.fields[field]+=' edit';assert.notEqual(R.fingerprint(s),R.fingerprint(c),field);}
  const c=clone(s);c.chosenOption='wait';assert.notEqual(R.fingerprint(s),R.fingerprint(c));
});
test('Canvas edits leave existing plan stale until explicit same-case rebase preserves action edits',()=>{
  const s=state(),p=R.create(s),edited=R.updateAction(p,'a-1',{title:'Mijn aangepaste taak',risk:'Mijn risico'}),next=clone(s);next.fields.question='Nieuwe vraag';next.chosenOption='wait';
  assert.equal(R.isStale(edited,next),true);assert.ok(has(R.validate(edited,next),'sourceFingerprint','stale'));
  const before=JSON.stringify(edited),rebased=R.rebase(edited,next);
  assert.equal(R.isStale(rebased,next),false);assert.equal(rebased.actions[0].title,'Mijn aangepaste taak');assert.equal(rebased.actions[0].risk,'Mijn risico');
  assert.equal(rebased.objective,edited.objective);assert.equal(JSON.stringify(edited),before);
  rebased.actions[1].dependencies.push('a-99');assert.deepEqual(edited.actions[1].dependencies,['a-1']);
  assert.throws(()=>R.rebase(edited,state('internal')),e=>e.code==='case_mismatch');
  const incomplete=clone(next);incomplete.fields.owner='';assert.throws(()=>R.rebase(edited,incomplete),e=>e.code==='invalid_canvas');
});
test('UI language change preserves plans and does not create staleness',()=>{
  const s=state();s.roadmap=R.create(s);s.roadmap.actions[0].title='Eigen tekst';const next=M.setLanguage(s,'fr');
  assert.equal(R.isStale(next.roadmap,next),false);assert.equal(next.roadmap.actions[0].title,'Eigen tekst');assert.notEqual(next.roadmap,s.roadmap);
});
test('immutable plan/action editing allows only contract fields and preserves source link',()=>{
  const p=plan(),before=JSON.stringify(p),next=R.updatePlan(p,{objective:'Changed objective',owner:'Changed owner',startDate:'2027-01-01'});
  assert.equal(next.sourceFingerprint,p.sourceFingerprint);assert.equal(next.objective,'Changed objective');
  const changed=R.updateAction(next,'a-2',{title:'Other title',dependencies:[],startDay:1});changed.actions[0].dependencies.push('x');
  assert.equal(JSON.stringify(p),before);assert.deepEqual(next.actions[0].dependencies,[]);
  const patch={dependencies:['a-1']},q=R.updateAction(p,'a-2',patch);patch.dependencies.push('x');assert.deepEqual(q.actions[1].dependencies,['a-1']);
  assert.throws(()=>R.updatePlan(p,{sourceFingerprint:'fake'}),e=>e.code==='forbidden_field');
  assert.throws(()=>R.updateAction(p,'a-1',{id:'a-evil'}),e=>e.code==='forbidden_field');
  assert.throws(()=>R.updateAction(p,'missing',{title:'x'}),e=>e.code==='unknown_action');
  assert.throws(()=>R.updatePlan(p,null),e=>e.code==='invalid_patch');
});
test('adding actions produces unique safe IDs, unfilled validation and maximum twelve',()=>{
  const s=state(),original=R.create(s);let p=original;
  for(let i=0;i<6;i++)p=R.addAction(p);
  assert.equal(original.actions.length,6);assert.equal(p.actions.length,12);assert.equal(new Set(p.actions.map(a=>a.id)).size,12);
  assert.ok(has(R.validate(p,s),'title','required',p.actions[6].id));
  assert.throws(()=>R.addAction(p),e=>e.code==='max_actions');
});
test('deleting an action refuses dangling dependencies and does not mutate original',()=>{
  const p=plan(),before=JSON.stringify(p);assert.throws(()=>R.removeAction(p,'a-1'),e=>e.code==='in_use');
  assert.equal(JSON.stringify(p),before);const next=R.removeAction(p,'a-6');assert.equal(next.actions.length,5);assert.equal(p.actions.length,6);
  assert.throws(()=>R.removeAction(p,'missing'),e=>e.code==='unknown_action');
});
test('validation catches malformed plans, absent required text, date and action ranges',()=>{
  const s=state();for(const p of [null,undefined,[],false])assert.equal(R.validate(p,s).valid,false);
  for(const key of ['objective','owner']){const p=plan();p[key]=' ';assert.ok(has(R.validate(p,s),key,'required'));p[key]='x'.repeat(12001);assert.ok(has(R.validate(p,s),key,'too_long'));}
  const p=plan();p.startDate='2026-02-29';assert.ok(has(R.validate(p,s),'startDate','calendar'));
  for(const value of [[],new Array(13).fill(null)]){const p=plan();p.actions=value;assert.ok(has(R.validate(p,s),'actions','count'));}
  for(const key of ['title','result','owner','metric','baseline','target','resources','risk']){const p=plan();p.actions[0][key]='';assert.ok(has(R.validate(p,s),key,'required','a-1'));}
  const q=plan();q.actions[0].startDay=5;q.actions[0].endDay=4;assert.ok(has(R.validate(q,s),'endDay','before_start','a-1'));
  for(const x of [0,91,1.5,Infinity]){const q=plan();q.actions[0].startDay=x;assert.ok(has(R.validate(q,s),'startDay','range','a-1'));}
});
test('unknown, unsafe and duplicate identifiers/dependencies are rejected',()=>{
  const {s,p}=fixture();p.actions[0].id='<script>';assert.ok(has(R.validate(p,s),'id','unsafe'));
  const q=fixture();q.p.actions[1].id='a-1';assert.ok(has(R.validate(q.p,q.s),'id','duplicate','a-1'));
  const x=fixture();x.p.actions[1].dependencies=['missing'];assert.ok(has(R.validate(x.p,x.s),'dependencies','missing','a-2'));
  const y=fixture();y.p.actions[1].dependencies=['a-1','a-1'];assert.ok(has(R.validate(y.p,y.s),'dependencies','duplicate','a-2'));
  const z=fixture();z.p.actions[1].dependencies='a-1';assert.ok(has(R.validate(z.p,z.s),'dependencies','type','a-2'));
});
test('dependency graph detects self links and a three-node cycle independently of scheduling',()=>{
  const self=fixture();self.p.actions[0].dependencies=['a-1'];assert.ok(has(R.validate(self.p,self.s),'dependencies','self','a-1'));
  const cycle=fixture();cycle.p.actions[0].dependencies=['a-3'];assert.ok(R.validate(cycle.p,cycle.s).errors.some(e=>e.code==='cycle'));
});
test('finish-start constraints reject overlaps/reversed order but allow independent parallel actions',()=>{
  const {s,p}=fixture();assert.equal(R.validate(p,s).valid,true);
  p.actions[1].startDay=5;assert.ok(has(R.validate(p,s),'startDay','finish_start','a-2'));
  p.actions[1].startDay=1;assert.ok(has(R.validate(p,s),'startDay','finish_start','a-2'));
  p.actions[1].dependencies=[];assert.equal(R.validate(p,s).valid,true);
  p.actions[0].dependencies=['a-3'];assert.ok(has(R.validate(p,s),'startDay','finish_start','a-1'));
});
test('activity summary separates reported completion and never treats evidence as verified',()=>{
  let p=plan();p=R.updateAction(p,'a-1',{status:'done',evidence:'User says reviewed; fictional note'});p=R.updateAction(p,'a-2',{status:'in-progress'});p=R.updateAction(p,'a-3',{status:'blocked'});
  assert.deepEqual(R.summary(p),{total:6,planned:3,inProgress:1,blocked:1,reportedDone:1});
  const checked=R.validate(p,state());assert.equal(checked.valid,true);assert.ok(checked.warnings.some(w=>w.code==='reported_done_unverified'&&w.actionId==='a-1'));
  const noProof=R.updateAction(p,'a-1',{evidence:'  '});assert.ok(has(R.validate(noProof,state()),'evidence','required','a-1'));
  const bad=R.updateAction(p,'a-1',{status:'approved'});assert.ok(has(R.validate(bad,state()),'status','unknown','a-1'));
});
test('report requires both complete current Canvas and a complete nonstale plan',()=>{
  const s=state(),p=R.create(s);assert.equal(typeof R.makeReport(p,s),'string');
  const next=clone(s);next.fields.question='Changed';assert.throws(()=>R.makeReport(p,next),e=>e.code==='INVALID_ROADMAP'&&e.errors.some(x=>x.code==='stale'));
  const missing=clone(s);missing.fields.owner='';assert.throws(()=>R.makeReport(p,missing),e=>e.code==='INVALID_ROADMAP');
  assert.throws(()=>R.makeReport(R.addAction(p),s),e=>e.code==='INVALID_ROADMAP');
});
test('roadmap-only report includes all windows/tasks/data and keeps crossing-phase tasks exactly once',()=>{
  const {s,p}=fixture();p.actions[1].startDay=6;p.actions[1].endDay=35;p.actions[2].startDay=36;
  const report=R.makeReport(p,s);
  assert.ok(!report.includes('GROW FASTER — EXECUTIVE DECISION CANVAS'));
  for(const token of [s.fields.question,'2026-12-26','2027-01-25','2027-02-24','1–30','31–60','61–90',p.objective,p.owner])assert.ok(report.includes(token),token);
  for(const a of p.actions){for(const key of ['title','result','owner','metric','baseline','target','resources','risk'])assert.ok(report.includes(a[key]),key);assert.equal(report.split(`${a.id} — `).length-1,1);}
  assert.match(report,/geen bedrijfswaarde/);assert.match(report,/geen verificatie/);
});
test('French report uses French labels and preserves edited text without HTML or control characters',()=>{
  const s=state('internal','fr');let p=R.create(s);p=R.updateAction(p,'a-1',{title:'<img src=x>\u0000Eigen Nederlandse tekst',status:'done',evidence:'<script>fictieve gebruikersmelding</script>'});
  const before=JSON.stringify(p),report=R.makeReport(p,s);assert.match(report,/PLAN À 90 JOURS/);assert.match(report,/Déclaré terminé par l’utilisateur/);assert.match(report,/preuve non vérifiée/);
  assert.ok(report.includes('Eigen Nederlandse tekst'));assert.ok(!report.includes('<'));assert.ok(!report.includes('>'));assert.ok(!report.includes('\u0000'));assert.equal(JSON.stringify(p),before);
});
test('all model operations remain pure and return detached dependency arrays',()=>{
  const s=state(),p=R.create(s),before=JSON.stringify(p);
  R.validate(p,s);R.makeReport(p,s);R.summary(p);R.dates(p,1,90);R.isStale(p,s);R.fingerprint(s);assert.equal(JSON.stringify(p),before);
  const r=R.updatePlan(p,{owner:'Another owner'});r.actions[1].dependencies.push('a-99');assert.deepEqual(p.actions[1].dependencies,['a-1']);
});
test('UMD browser mode executes without DOM, storage, fetch or a backend',()=>{
  const sandbox={fetch(){throw Error('no network');}};vm.createContext(sandbox);
  for(const file of ['cases.js','model.js','roadmap.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../decision-journey/assets',file),'utf8'),sandbox);
  const s=sandbox.GFDemoModel.createState('internal','nl');s.selectedDimensions=['people'];const p=sandbox.GF90Roadmap.create(s);
  assert.equal(sandbox.GF90Roadmap.validate(p,s).valid,true);assert.equal(Object.isFrozen(sandbox.GF90Roadmap),true);
});
