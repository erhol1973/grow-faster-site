'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const M=require('../decision-journey/assets/model.js'),R=require('../decision-journey/assets/roadmap.js'),V=require('../decision-journey/assets/value-review.js');
function state(id='external',lang='nl'){const s=M.createState(id,lang);s.selectedDimensions=['process','data'];s.roadmap=R.create(s);return s;}
function fixture(){const s=state();let v=V.create(s);v=V.updateMeasure(v,'m-1',{unit:'uren',direction:'lower',target:'7'});v=V.updateBaseline(v,'m-1',{value:'10',date:'2026-11-20',evidence:'Fictief log B',context:'Vergelijkbare oefenorders'});v=V.updateObservation(v,'m-1',30,{value:'8',date:'2026-12-26',evidence:'Fictief log C',context:'Zelfde definitie en ordermix',comparability:'comparable'});return{s,v};}
function error(result,field,code,id,day){return result.errors.some(e=>e.field===field&&e.code===code&&(id===undefined||e.measureId===id)&&(day===undefined||e.day===day));}
const clone=x=>JSON.parse(JSON.stringify(x));

test('empty review is a valid measurement plan without invented observations or target',()=>{
  for(const id of ['external','internal'])for(const lang of ['nl','fr']){const s=state(id,lang),v=V.create(s);assert.equal(v.caseId,id);assert.equal(v.reviewOwner,s.roadmap.owner);assert.equal(v.measures.length,1);const m=v.measures[0];assert.equal(m.actionId,s.roadmap.actions[0].id);assert.equal(m.title,s.roadmap.actions[0].metric);assert.equal(m.owner,s.roadmap.actions[0].owner);assert.equal(m.category,'process');assert.equal(m.unit,'');assert.equal(m.direction,'unspecified');assert.equal(m.target,'');assert.deepEqual(m.baseline,{value:'',date:'',evidence:'',context:''});assert.deepEqual(m.reviews.map(o=>o.day),[30,60,90]);assert.ok(m.reviews.every(o=>o.value===''&&o.date===''&&o.evidence===''&&o.context===''&&o.comparability==='not-assessed'));assert.equal(v.nextDecision,'undecided');assert.equal(v.conclusion,'');assert.deepEqual(V.validate(v,s),{valid:true,errors:[],warnings:[]});}
});
test('creation requires valid current Canvas and plan and has no input mutation',()=>{
  const s=state(),before=JSON.stringify(s);V.create(s);assert.equal(JSON.stringify(s),before);
  assert.throws(()=>V.create(M.createState()),e=>e.code==='invalid_plan');s.fields.question='Changed';assert.throws(()=>V.create(s),e=>e.code==='invalid_plan');
});
test('decimal parser returns canonical strings, preserves zero semantics and accepts both decimal separators',()=>{
  for(const [input,expected]of [['',''],['  ',''],['0','0'],['-0','0'],['+000.500000','0.5'],['-0,000001','-0.000001'],[' .5 ','0.5'],[',5','0.5'],['-.5','-0.5'],['12,345','12.345'],['1000000000000','1000000000000'],['-1000000000000','-1000000000000'],['999999999999.999999','999999999999.999999']])assert.equal(V.parseValue(input),expected===''?null:expected,input);
});
test('numeric grammar rejects grouping, exponent, non-string and exact out-of-bound values',()=>{
  for(const input of [null,undefined,1,0,[],{},'1 000','1_000','1,234.56','1.234,56','1.','1,','0x10','1e3','Infinity','NaN','--1','++1','1.0000001','1000000000000.000001','-1000000000000,000001','1000000000001'])assert.throws(()=>V.parseValue(input),e=>e.code==='number',String(input));
});
test('planned dates are inclusive day30/60/90 across year and leap boundaries',()=>{
  const s=state();assert.deepEqual(V.reviewDates(s),{30:'2026-12-26',60:'2027-01-25',90:'2027-02-24'});
  s.roadmap.startDate='2028-02-01';assert.deepEqual(V.reviewDates(s),{30:'2028-03-01',60:'2028-03-31',90:'2028-04-30'});
});
test('baseline requires metadata and a unit only once a numeric value is supplied, including zero',()=>{
  const s=state();let v=V.create(s);v=V.updateBaseline(v,'m-1',{value:'0'});let r=V.validate(v,s);
  for(const key of ['date','evidence','context'])assert.ok(error(r,'baseline.'+key,'required','m-1'));
  assert.ok(error(r,'unit','required','m-1'));
  v=V.updateMeasure(v,'m-1',{unit:'orders'});v=V.updateBaseline(v,'m-1',{date:'2026-11-20',evidence:'Fictieve ref',context:'Fictieve meetcontext'});assert.equal(V.validate(v,s).valid,true);
});
test('unknown baseline/observation with partially completed metadata remains allowed but nonempty invalid dates fail',()=>{
  const s=state();let v=V.create(s);v=V.updateBaseline(v,'m-1',{evidence:'Maybe later',context:'Not yet measured',date:'2026-11-20'});v=V.updateObservation(v,'m-1',30,{context:'Pending',date:'2026-12-26'});assert.equal(V.validate(v,s).valid,true);
  v=V.updateBaseline(v,'m-1',{date:'2026-02-29'});assert.ok(error(V.validate(v,s),'baseline.date','calendar','m-1'));
});
test('numerical observation requires date/evidence/context and dates cannot precede plan or known baseline',()=>{
  const s=state();let v=V.create(s);v=V.updateMeasure(v,'m-1',{unit:'uren'});v=V.updateObservation(v,'m-1',30,{value:'0'});let checked=V.validate(v,s);for(const key of ['date','evidence','context'])assert.ok(error(checked,key,'required','m-1',30));
  v=V.updateObservation(v,'m-1',30,{date:'2026-11-26',evidence:'Fiction',context:'Fiction'});assert.ok(error(V.validate(v,s),'date','before_plan','m-1',30));
  v=V.updateBaseline(v,'m-1',{date:'2026-12-20'});v=V.updateObservation(v,'m-1',30,{date:'2026-12-19'});assert.ok(error(V.validate(v,s),'date','before_baseline','m-1',30));
});
test('late and future observations are allowed as unverified user reports with a warning, no clock assumption',()=>{
  const {s,v}=fixture();const late=V.updateObservation(v,'m-1',30,{date:'2090-01-01'}),result=V.validate(late,s);assert.equal(result.valid,true);assert.ok(result.warnings.some(w=>w.code==='after_day90'&&w.measureId==='m-1'&&w.day===30));assert.ok(result.warnings.some(w=>w.code==='user_reported_unverified'));
});
test('target can be known without a baseline, requires a unit and is not an observed result',()=>{
  const s=state();let v=V.create(s);v=V.updateMeasure(v,'m-1',{target:'0'});assert.ok(error(V.validate(v,s),'unit','required','m-1'));v=V.updateMeasure(v,'m-1',{unit:'defecten'});assert.equal(V.validate(v,s).valid,true);assert.equal(V.evaluateMeasure(v,'m-1',30,s).status,'unmeasured');
});
test('review validation rejects malformed objects, counts, enums, unsafe and duplicate IDs',()=>{
  const s=state();for(const value of [null,undefined,[],false])assert.equal(V.validate(value,s).valid,false);
  for(const key of ['reviewOwner']){const v=V.create(s);v[key]=' ';assert.ok(error(V.validate(v,s),key,'required'));}
  for(const measures of [[],new Array(7).fill(null),'bad']){const v=V.create(s);v.measures=measures;assert.equal(V.validate(v,s).valid,false);}
  for(const [field,value,code]of [['id','<script>','unsafe'],['actionId','a-missing','missing'],['category','roi','unknown'],['direction','automatic','unknown'],['title',' ','required'],['owner',null,'type']]){const v=V.create(s);v.measures[0][field]=value;assert.ok(error(V.validate(v,s),field,code));}
  const v=V.create(s);v.measures.push(clone(v.measures[0]));assert.ok(error(V.validate(v,s),'id','duplicate','m-1'));
});
test('every text field has type and length constraints and invalid numerical fields fail',()=>{
  const s=state();let v=V.create(s);v.reviewOwner='x'.repeat(12001);assert.ok(error(V.validate(v,s),'reviewOwner','too_long'));
  v=V.create(s);v.measures[0].target='1e2';assert.ok(error(V.validate(v,s),'target','number','m-1'));
  v=V.create(s);v.measures[0].baseline.value=0;assert.ok(error(V.validate(v,s),'baseline.value','type','m-1'));
  v=V.create(s);v.measures[0].reviews[0].context='x'.repeat(12001);assert.ok(error(V.validate(v,s),'context','too_long','m-1',30));
});
test('observation slots must be exactly one each for days30/60/90 with explicit comparability',()=>{
  const s=state();let v=V.create(s);v.measures[0].reviews.pop();assert.ok(error(V.validate(v,s),'reviews','count','m-1'));assert.ok(error(V.validate(v,s),'day','missing','m-1',90));
  v=V.create(s);v.measures[0].reviews[1].day=30;assert.ok(error(V.validate(v,s),'day','duplicate','m-1',30));
  v=V.create(s);v.measures[0].reviews[0].day='30';assert.ok(error(V.validate(v,s),'day','unknown','m-1','30'));
  v=V.create(s);v.measures[0].reviews[0].comparability='verified';assert.ok(error(V.validate(v,s),'comparability','unknown','m-1',30));
});
test('calculation requires observation, known baseline and user-declared comparability',()=>{
  const {s,v}=fixture();assert.equal(V.evaluateMeasure(v,'m-1',60,s).status,'unmeasured');
  let x=V.updateBaseline(v,'m-1',{value:''});assert.equal(V.evaluateMeasure(x,'m-1',30,s).status,'insufficient');
  x=V.updateObservation(v,'m-1',30,{comparability:'not-assessed'});assert.equal(V.evaluateMeasure(x,'m-1',30,s).status,'insufficient');
  x=V.updateObservation(v,'m-1',30,{comparability:'not-comparable'});const result=V.evaluateMeasure(x,'m-1',30,s);assert.equal(result.status,'not-comparable');assert.equal(result.delta,null);assert.equal(result.relativeChange,null);assert.equal(result.targetMet,null);
});
test('exact arithmetic preserves direction, negative outcomes, absent target and zero baseline',()=>{
  const {s,v}=fixture();assert.deepEqual(V.evaluateMeasure(v,'m-1',30,s),{status:'user-comparable',delta:'-2',relativeChange:'-20',targetMet:false,reasonCodes:['user_reported_not_verified']});
  let x=V.updateObservation(v,'m-1',30,{value:'6'});assert.equal(V.evaluateMeasure(x,'m-1',30,s).targetMet,true);
  x=V.updateMeasure(x,'m-1',{direction:'higher'});assert.equal(V.evaluateMeasure(x,'m-1',30,s).targetMet,false);
  x=V.updateMeasure(x,'m-1',{target:''});assert.equal(V.evaluateMeasure(x,'m-1',30,s).targetMet,null);
  x=V.updateMeasure(x,'m-1',{target:'1',direction:'unspecified'});assert.equal(V.evaluateMeasure(x,'m-1',30,s).targetMet,null);
  x=V.updateBaseline(v,'m-1',{value:'0'});const zero=V.evaluateMeasure(x,'m-1',30,s);assert.equal(zero.delta,'8');assert.equal(zero.relativeChange,null);
  x=V.updateBaseline(v,'m-1',{value:'-10'});assert.equal(V.evaluateMeasure(x,'m-1',30,s).delta,'18');assert.equal(V.evaluateMeasure(x,'m-1',30,s).relativeChange,'180');
});
test('large financial decimal subtraction and target comparison are exact at one-millionth boundary',()=>{
  const {s,v}=fixture();let x=V.updateMeasure(v,'m-1',{category:'financial',unit:'EUR',target:'999999999999.999998',direction:'lower'});x=V.updateBaseline(x,'m-1',{value:'1000000000000'});x=V.updateObservation(x,'m-1',30,{value:'999999999999.999999'});
  const r=V.evaluateMeasure(x,'m-1',30,s);assert.equal(r.delta,'-0.000001');assert.equal(r.relativeChange,'0');assert.equal(r.targetMet,false);
  x=V.updateMeasure(x,'m-1',{target:'999999999999.999999'});assert.equal(V.evaluateMeasure(x,'m-1',30,s).targetMet,true);
});
test('relative percent rounding is deterministic to6places with negative and repeating ratios',()=>{
  const {s,v}=fixture();let x=V.updateBaseline(v,'m-1',{value:'3'});x=V.updateObservation(x,'m-1',30,{value:'4'});assert.equal(V.evaluateMeasure(x,'m-1',30,s).relativeChange,'33.333333');
  x=V.updateObservation(x,'m-1',30,{value:'2'});assert.equal(V.evaluateMeasure(x,'m-1',30,s).relativeChange,'-33.333333');
  x=V.updateBaseline(x,'m-1',{value:'0.000001'});x=V.updateObservation(x,'m-1',30,{value:'1000000000000'});assert.equal(V.evaluateMeasure(x,'m-1',30,s).relativeChange,'99999999999999999900');
});
test('any invalid or stale review blocks all calculation instead of returning misleading partial results',()=>{
  const {s,v}=fixture();let x=V.updateReview(v,{reviewOwner:''});let r=V.evaluateMeasure(x,'m-1',30,s);assert.equal(r.status,'needs-review');assert.equal(r.delta,null);
  const changed=clone(s);changed.fields.question='Changed';r=V.evaluateMeasure(v,'m-1',30,changed);assert.equal(r.status,'needs-review');assert.equal(r.relativeChange,null);assert.equal(r.targetMet,null);
});
test('fingerprints include Canvas and every relevant plan/action field but exclude language/UI/review',()=>{
  const {s,v}=fixture();s.valueReview=v;const next=M.setLanguage(s,'fr');next.step=5;next.draftSaved=true;next.valueReview.conclusion='other';assert.equal(V.fingerprint(s),V.fingerprint(next));
  for(const key of ['startDate','objective','owner','sourceFingerprint']){const c=clone(s);c.roadmap[key]+='x';assert.notEqual(V.fingerprint(s),V.fingerprint(c),key);}
  for(const key of ['title','result','owner','metric','baseline','target','resources','risk','status','evidence','startDay','endDay','id']){const c=clone(s);c.roadmap.actions[0][key]=String(c.roadmap.actions[0][key])+'x';assert.notEqual(V.fingerprint(s),V.fingerprint(c),key);}
  const changed=clone(s);changed.roadmap.actions[1].dependencies=[];assert.notEqual(V.fingerprint(s),V.fingerprint(changed));
});
test('explicit same-case rebase preserves measurements and does not approve them; different case rejected',()=>{
  const {s,v}=fixture(),next=clone(s);next.roadmap.objective='Changed plan objective';assert.equal(V.isStale(v,next),true);
  const before=JSON.stringify(v),rebased=V.rebase(v,next);assert.equal(V.isStale(rebased,next),false);assert.deepEqual(rebased.measures,v.measures);assert.equal(rebased.nextDecision,'undecided');assert.equal(JSON.stringify(v),before);
  rebased.measures[0].baseline.value='999';assert.equal(v.measures[0].baseline.value,'10');
  assert.throws(()=>V.rebase(v,state('internal')),e=>e.code==='case_mismatch');const bad=clone(next);bad.roadmap.actions[0].title='';assert.throws(()=>V.rebase(v,bad),e=>e.code==='invalid_plan');
});
test('deleted action reference remains an error after rebase until user relinks or removes the measure',()=>{
  const {s,v}=fixture();const next=clone(s);for(const a of next.roadmap.actions)a.dependencies=[];next.roadmap=R.removeAction(next.roadmap,'a-1');assert.equal(R.validate(next.roadmap,next).valid,true);
  const rebased=V.rebase(v,next);assert.ok(error(V.validate(rebased,next),'actionId','missing','m-1'));assert.equal(rebased.measures[0].baseline.value,'10');
  const fixed=V.updateMeasure(rebased,'m-1',{actionId:'a-2'});assert.equal(V.validate(fixed,next).valid,true);
});
test('CRUD is immutable, rejects unknown fields/measure/day and min/max bounds',()=>{
  const {s,v}=fixture(),before=JSON.stringify(v);let x=V.updateReview(v,{conclusion:'Review later',nextDecision:'investigate'});x=V.updateMeasure(x,'m-1',{title:'Edited'});x=V.updateBaseline(x,'m-1',{context:'Edited'});x=V.updateObservation(x,'m-1',30,{evidence:'New'});assert.equal(JSON.stringify(v),before);
  for(const fn of [()=>V.updateReview(v,{caseId:'internal'}),()=>V.updateMeasure(v,'m-1',{id:'m-2'}),()=>V.updateBaseline(v,'m-1',{unit:'EUR'}),()=>V.updateObservation(v,'m-1',30,{day:60})])assert.throws(fn,e=>e.code==='forbidden_field');
  assert.throws(()=>V.updateMeasure(v,'missing',{title:'x'}),e=>e.code==='unknown_measure');assert.throws(()=>V.updateObservation(v,'m-1',45,{value:'3'}),e=>e.code==='unknown_day');assert.throws(()=>V.removeMeasure(v,'m-1'),e=>e.code==='min_measures');
  x=v;for(let i=0;i<5;i++)x=V.addMeasure(x,s);assert.equal(x.measures.length,6);assert.equal(new Set(x.measures.map(m=>m.id)).size,6);assert.equal(v.measures.length,1);assert.throws(()=>V.addMeasure(x,s),e=>e.code==='max_measures');
  const removed=V.removeMeasure(x,x.measures[5].id);assert.equal(removed.measures.length,5);assert.equal(x.measures.length,6);
});
test('new added measure is empty and editable, not a fabricated observation or silently valid result',()=>{
  const s=state(),v=V.addMeasure(V.create(s),s),m=v.measures[1];assert.equal(m.actionId,s.roadmap.actions[0].id);assert.equal(m.title,'');assert.equal(m.owner,'');assert.equal(m.baseline.value,'');assert.ok(m.reviews.every(o=>o.value===''));assert.ok(error(V.validate(v,s),'title','required',m.id));
});
test('non-undecided next choice requires user conclusion, no approved or verified decision enums',()=>{
  const s=state();for(const decision of ['investigate','adapt','continue','stop']){let v=V.updateReview(V.create(s),{nextDecision:decision});assert.ok(error(V.validate(v,s),'conclusion','required'));v=V.updateReview(v,{conclusion:'Fictief besluitvoorstel door gebruiker'});assert.equal(V.validate(v,s).valid,true);}
  const v=V.updateReview(V.create(s),{nextDecision:'approved'});assert.ok(error(V.validate(v,s),'nextDecision','unknown'));
});
test('makeReport rejects invalid/stale input but permits unknown measures without fake zero',()=>{
  const s=state(),v=V.create(s),text=V.makeReport(v,s);assert.match(text,/Onbekend \/ geen waarde ingevoerd/);assert.match(text,/geen gerealiseerde bedrijfswaarde/);assert.ok(!text.includes('EXECUTIVE DECISION CANVAS'));assert.ok(!text.includes('90-DAGENPLAN —'));
  const changed=clone(s);changed.roadmap.owner='Other';assert.throws(()=>V.makeReport(v,changed),e=>e.code==='INVALID_VALUE_REVIEW');
  assert.throws(()=>V.makeReport(V.updateReview(v,{reviewOwner:''}),s),e=>e.code==='INVALID_VALUE_REVIEW');
});
test('full review report retains all fields, source links, exact differences and approximate percentage qualifier',()=>{
  const {s,v}=fixture(),report=V.makeReport(v,s);for(const value of [s.fields.question,s.roadmap.objective,v.reviewOwner,v.measures[0].title,v.measures[0].owner,v.measures[0].unit,v.measures[0].baseline.date,v.measures[0].baseline.evidence,v.measures[0].baseline.context,'2026-12-26','2027-01-25','2027-02-24','Fictief log C','Zelfde definitie en ordermix'])assert.ok(report.includes(value),value);
  assert.match(report,/Rekenkundig verschil op ingevoerde waarden: -2/);assert.match(report,/≈ -20/);assert.match(report,/afgerond op maximaal 6 decimalen/);assert.match(report,/Door gebruiker vergelijkbaar verklaard/);assert.match(report,/Geen onafhankelijke verificatie/);
});
test('report exports mixed units separately without sum and treats evidence as inert user text',()=>{
  const {s,v}=fixture();let x=V.addMeasure(v,s);x=V.updateMeasure(x,'m-2',{title:'Geld',owner:'Fictief',unit:'EUR',category:'financial'});x=V.updateBaseline(x,'m-2',{value:'5',date:'2026-11-20',evidence:'<a href="https://example.test">link</a>',context:'Fiction'});x=V.updateReview(x,{conclusion:'<script>fiction</script>\u0000'});
  const report=V.makeReport(x,s);assert.match(report,/Eenheid: uren/);assert.match(report,/Eenheid: EUR/);assert.match(report,/geen optelling|optelling van verschillende/);assert.ok(!report.includes('<'));assert.ok(!report.includes('>'));assert.ok(!report.includes('\u0000'));assert.ok(report.includes('‹script›'));assert.ok(report.includes('EUR'));
});
test('French report labels comparison and approximation while retaining raw edited free text',()=>{
  const {s,v}=fixture(),fr=M.setLanguage(s,'fr'),report=V.makeReport(v,fr);assert.match(report,/EXAMEN DES RÉSULTATS/);assert.match(report,/Déclaré comparable par l’utilisateur/);assert.match(report,/arrondie à 6 décimales maximum/);assert.match(report,/≈ -20/);assert.ok(report.includes('Fictief log B'));assert.match(report,/Aucune vérification indépendante/);
});
test('report distinguishes absent numerical input from absent metadata, without asserting no real measurement exists',()=>{
  for(const lang of ['nl','fr']){
    const s=state('external',lang),report=V.makeReport(V.create(s),s);
    assert.match(report,lang==='nl'?/Onbekend \/ geen waarde ingevoerd/:/Inconnu \/ aucune valeur saisie/);
    assert.match(report,lang==='nl'?/Datum: Niet opgegeven/:/Date: Non renseigné/);
    assert.match(report,lang==='nl'?/Geen waarde ingevoerd; meting niet bevestigd/:/Aucune valeur saisie; mesure non confirmée/);
    assert.ok(!report.includes(lang==='nl'?'Onbekend / niet gemeten':'Inconnu / non mesuré'));
  }
});
test('report explains zero baseline separately from missing comparison while retaining exact delta and percent convention',()=>{
  for(const lang of ['nl','fr']){
    const {s,v}=fixture();s.lang=lang;const zero=V.updateBaseline(v,'m-1',{value:'0'}),report=V.makeReport(zero,s);
    assert.match(report,lang==='nl'?/Niet berekenbaar: de ingevoerde nulmeting is 0\./:/Non calculable : la valeur de référence saisie est 0\./);
    assert.match(report,lang==='nl'?/Rekenkundig verschil op ingevoerde waarden: 8/:/Différence arithmétique sur les valeurs saisies: 8/);
    assert.match(report,lang==='nl'?/absolute waarde van de nulmeting × 100/:/valeur absolue de la référence × 100/);
    const missing=V.updateBaseline(v,'m-1',{value:''}),missingReport=V.makeReport(missing,s);
    assert.match(missingReport,lang==='nl'?/Niet berekend: onvoldoende vergelijkingsinformatie\./:/Non calculée : informations de comparaison insuffisantes\./);
    assert.ok(!missingReport.includes(lang==='nl'?'de ingevoerde nulmeting is 0':'la valeur de référence saisie est 0'));
  }
});
test('known target with unspecified direction reports inability to assess, not missing entered value',()=>{
  for(const lang of ['nl','fr']){
    const {s,v}=fixture();s.lang=lang;const x=V.updateMeasure(v,'m-1',{target:'7',direction:'unspecified'}),report=V.makeReport(x,s);
    const prefix=lang==='nl'?'Streefwaarde rekenkundig bereikt, geen validatie: ':'Cible atteinte arithmétiquement, sans validation: ';
    const line=report.split('\n').find(text=>text.startsWith(prefix));
    assert.match(line,lang==='nl'?/Niet beoordeelbaar: de streefwaarde, gewenste richting of vergelijkingsbasis ontbreekt of is onvoldoende\./:/Non évaluable : la cible, la direction souhaitée ou la base de comparaison manque ou est insuffisante\./);
    assert.ok(!line.includes(lang==='nl'?'geen waarde ingevoerd':'aucune valeur saisie'));
    assert.ok(report.includes(lang==='nl'?'Voorgestelde streefwaarde: 7':'Cible proposée: 7'));
    assert.equal(V.evaluateMeasure(x,'m-1',30,s).targetMet,null);
  }
});
test('report presents the after-day90 warning at the actual late observation without truncating its date',()=>{
  for(const lang of ['nl','fr']){
    const {s,v}=fixture();s.lang=lang;const late=V.updateObservation(v,'m-1',30,{date:'2090-01-01'}),report=V.makeReport(late,s);
    const text=lang==='nl'?'De ingevoerde meetdatum ligt na dag 90 van het plan.':'La date de mesure saisie est postérieure au jour 90 du plan.';
    assert.equal(report.split(text).length-1,1);assert.ok(report.includes('2090-01-01'));
    const lateSection=report.slice(report.indexOf(lang==='nl'?'Gebruikersmelding dag 30':'Déclaration utilisateur jour 30'),report.indexOf(lang==='nl'?'Gebruikersmelding dag 60':'Déclaration utilisateur jour 60'));
    assert.ok(lateSection.includes(text));assert.match(lateSection,lang==='nl'?/late gebruikersmelding/:/déclaration tardive/);
  }
});
test('evaluation and reporting are pure and repeatable',()=>{
  const {s,v}=fixture(),snapshot=JSON.stringify({s,v});assert.equal(V.makeReport(v,s),V.makeReport(v,s));assert.deepEqual(V.evaluateMeasure(v,'m-1',30,s),V.evaluateMeasure(v,'m-1',30,s));V.validate(v,s);V.reviewDates(s);V.fingerprint(s);assert.equal(JSON.stringify({s,v}),snapshot);
  const x=V.updateReview(v,{reviewOwner:'Other'});x.measures[0].reviews[0].value='99';assert.equal(v.measures[0].reviews[0].value,'8');
});
test('unknown measurement/day evaluation throws instead of fabricating a comparison',()=>{
  const {s,v}=fixture();assert.throws(()=>V.evaluateMeasure(v,'missing',30,s),e=>e.code==='unknown_measure');assert.throws(()=>V.evaluateMeasure(v,'m-1',45,s),e=>e.code==='unknown_day');
});
test('UMD browser module exposes exact API without DOM/storage/network services',()=>{
  const sandbox={fetch(){throw Error('network forbidden');}};vm.createContext(sandbox);for(const file of ['cases.js','model.js','roadmap.js','value-review.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../decision-journey/assets',file),'utf8'),sandbox);
  const s=sandbox.GFDemoModel.createState();s.selectedDimensions=['data'];s.roadmap=sandbox.GF90Roadmap.create(s);const v=sandbox.GFValueReview.create(s);assert.equal(sandbox.GFValueReview.validate(v,s).valid,true);assert.equal(sandbox.GFValueReview.parseValue('0,5'),'0.5');assert.equal(Object.isFrozen(sandbox.GFValueReview),true);
});
