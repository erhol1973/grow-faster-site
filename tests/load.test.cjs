const {test}=require('node:test');
const assert=require('node:assert/strict');
const {summarize,routes}=require('../scripts/load.cjs');
const sample=(latencyMs=20,status=200,expected=200)=>({route:'/about.html',latencyMs,status,expected});
test('load policy accepts valid responses, including an expected negative 404',()=>{
  const result=summarize([sample(),{...sample(25,404,404),route:'/missing.html'}],['/about.html','/missing.html']);
  assert.deepEqual(result.violations,[]);assert.equal(result.errors,0);
});
test('load policy fails wrong statuses, timeout samples and invalid measurements',()=>{
  for(const s of [sample(20,500),sample(5001,0),sample(NaN),sample(-1)])assert.ok(summarize([s],['/about.html']).violations.length);
});
test('load policy fails empty runs and missing required routes',()=>{
  assert.ok(summarize([],['/about.html']).violations.length);
  assert.deepEqual(summarize([sample()],['/about.html','/coherence.html']).missingRoutes,['/coherence.html']);
});
test('95th percentile uses the agreed nearest rank and blocks a slow run',()=>{
  const samples=Array.from({length:20},(_,i)=>sample(i+1));
  assert.equal(summarize(samples,['/about.html'],19).p95Ms,19);
  assert.deepEqual(summarize(samples,['/about.html'],19).violations,[]);
  assert.ok(summarize(samples,['/about.html'],18).violations.length);
  for(const limit of [0,-1,Infinity,NaN])assert.throws(()=>summarize(samples,['/about.html'],limit),RangeError);
});
test('load scenarios include every menu destination and one negative route',()=>{
  for(const page of require('./navigation-cases.json'))assert.ok(routes.some(r=>r.route==='/'+page&&r.status===200));
  assert.ok(routes.some(r=>r.status===404));assert.equal(new Set(routes.map(r=>r.route)).size,routes.length);
});
