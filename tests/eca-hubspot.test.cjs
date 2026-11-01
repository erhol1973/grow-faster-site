'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const ECA=require('../assets/eca.js'),HS=require('../assets/eca-hubspot.js');
const answers=()=>Object.fromEntries(Object.values(ECA.QUESTIONS).flat().map(q=>[q,4]));
test('N/A profile maps only aggregate properties with independent hand-calculated values',()=>{
  const a=answers();a.S1='';a.S2=1;a.S3=3;a.S4=5;
  const p=HS.properties(ECA.score(a),{utm_source:'linkedin',utm_campaign:'launch'},new Date('2026-11-01T14:00:00Z'));
  assert.deepEqual(p,{enterprise_coherence_score:'70',strategic_coherence_score:'50',operating_model_coherence_score:'75',decision_governance_coherence_score:'75',ai_enablement_coherence_score:'75',capability_value_coherence_score:'75',primary_coherence_risk:'strategic_coherence',coherence_maturity_band:'partially_aligned',assessment_source:'linkedin',assessment_campaign:'launch',assessment_completed:'2026-11-01',diagnostic_interest:'interested'});
  a.S2='';assert.throws(()=>HS.properties(ECA.score(a)),/Incomplete/);
});
test('ties are preserved; absent campaign does not erase an existing CRM value',()=>{
  const p=HS.properties(ECA.score(answers()));assert.equal(p.primary_coherence_risk,'');assert.ok(!('assessment_campaign' in p));
});
test('attribution allows only bounded campaign tokens and never forwards arbitrary URL data',()=>{
  assert.deepEqual(HS.attribution('?utm_source=linkedin&utm_medium=social&utm_campaign=eca-v1&email=person@example.com&utm_content=person%40example.com&utm_term='+ 'a'.repeat(101)),{utm_source:'linkedin',utm_medium:'social',utm_campaign:'eca-v1'});
});
test('native fields are populated and read back without changing subscription or submitting',async()=>{
  const data=HS.properties(ECA.score(answers())),values={};let metadata;
  const form={getFormFieldValues:async()=>Object.keys(data).map(k=>({name:'0-1/'+k})),setFieldValue:async(k,v)=>values[k]=v,getFieldValue:async k=>values[k],setExtraSubmissionMetadata:v=>metadata=v};
  await HS.populate(form,data,{utm_medium:'social'});assert.equal(Object.keys(values).length,11);assert.deepEqual(metadata,{utm_medium:'social'});
  form.getFormFieldValues=async()=>[];await assert.rejects(HS.populate(form,data,{}),/Missing/);
  form.getFormFieldValues=async()=>Object.keys(data).map(k=>({name:'0-1/'+k}));form.getFieldValue=async()=>'';await assert.rejects(HS.populate(form,data,{}),/rejected/);
});
test('native asynchronous updates settle before the form is made available',async()=>{
  const values={};
  const form={getFormFieldValues:async()=>[{name:'0-1/assessment_source'}],setFieldValue:(k,v)=>{setTimeout(()=>values[k]=v,20)},getFieldValue:async k=>values[k]||'',setExtraSubmissionMetadata:()=>{}};
  await HS.populate(form,{assessment_source:'eca'},{});assert.equal(values['0-1/assessment_source'],'eca');
});

