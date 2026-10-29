const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../assets/consent.js');
const now=1800000000000,valid={v:3,ext:false,ana:true,ts:now};
test('consent preserves strictly boolean independent choices at the age boundary',()=>{
  assert.deepEqual(C.parse(JSON.stringify(valid),now),valid);
  assert.ok(C.parse(JSON.stringify({...valid,ts:now-C.maxAge}),now));
  assert.equal(C.parse(JSON.stringify({...valid,ts:now-C.maxAge-1}),now),null);
});
test('malformed, future, wrongly typed or incompatible consent requires a new choice',()=>{
  for(const data of [null,[],{},'bad',{...valid,ext:'false'},{...valid,ana:1},{...valid,v:2},{...valid,ts:now+1},{...valid,ts:'1800000000000'},{...valid,ts:0}])assert.equal(C.parse(JSON.stringify(data),now),null);
  assert.equal(C.parse('{bad',now),null);
});
