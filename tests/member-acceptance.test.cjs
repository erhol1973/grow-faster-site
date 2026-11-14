'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {storageFailure,assertDenied,assertNoListing,cmsReadRights}=require('../scripts/accept-member-test.cjs');
test('Storage download diagnostics preserve the actual gateway error',()=>{
 assert.equal(storageFailure(Buffer.from('{"statusCode":"404","error":"not_found","message":"Object not found"}')),'statusCode=404, error=not_found, message=Object not found');
 assert.equal(storageFailure(Buffer.from('private file bytes')),'non-JSON error');
 assert.equal(storageFailure(Buffer.from('{"access_token":"secret","message":"bad\\nrequest"}')),'message=bad request');
 for(const body of ['null','[]','"permission denied"']) assert.equal(storageFailure(Buffer.from(body)),'non-object JSON error');
 assert.equal(storageFailure(Buffer.from(JSON.stringify({message:'x'.repeat(1000)}))).length,208);
});
test('guest checks reject successful downloads and unrelated gateway errors',async()=>{
 for(const response of [new Response('{}',{status:200}),new Response('{"message":"Database unavailable"}',{status:400}),new Response('null',{status:400}),new Response('{"message":"Permission denied"}',{status:500})]) {
  await assert.rejects(assertDenied('guest',response));
 }
});
test('masked not-found reports ambiguity rather than claiming object existence',async t=>{
 const lines=[];
 t.mock.method(console,'log',line=>lines.push(line));
 await assertDenied('guest',new Response('{"statusCode":"404","message":"Object not found"}',{status:400}));
 assert.match(lines[0],/missing object or RLS masking, not independent access proof/);
});
test('bucket-list checks accept empty RLS results but reject exposed names or malformed success',async()=>{
 await assertNoListing('member',new Response('[]',{status:200}));
 await assertNoListing('member',new Response('{"message":"Permission denied"}',{status:403}));
 for(const body of ['[{"name":"nl.json"}]','null','{}','invalid']) {
  await assert.rejects(assertNoListing('member',new Response(body,{status:200})));
 }
});
test('CMS role checks require actual private history visibility for admin and none for member',async t=>{
 const calls=[];
 let body='[]',status=200;
 t.mock.method(global,'fetch',async(url,options)=>{
  calls.push({url,options});
  return new Response(body,{status});
 });
 await cmsReadRights('Member','test-token',false);
 await assert.rejects(cmsReadRights('Administrator','test-token',true));
 body='[{"id":1}]';
 await assert.rejects(cmsReadRights('Member','test-token',false));
 await cmsReadRights('Administrator','test-token',true);
 status=403;body='{"message":"Permission denied"}';
 await assert.rejects(cmsReadRights('Administrator','test-token',true));
 assert.ok(calls.every(({url,options})=>url==='https://gqsvoioccvklzfmdmexy.supabase.co/rest/v1/cms_versions?select=id&limit=1' && options.method==='GET'));
});
