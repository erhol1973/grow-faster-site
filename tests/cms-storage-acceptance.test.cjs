'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {isBucketRejection}=require('../scripts/accept-cms-storage.cjs');
test('gateway acceptance requires a bucket rejection, not an unrelated permission or service error',()=>{
 assert.equal(isBucketRejection(415,{error:'InvalidMimeType'},'mime'),true);
 assert.equal(isBucketRejection(400,{message:'mime type image/svg+xml is not supported'},'mime'),true);
 assert.equal(isBucketRejection(413,{},'size'),true);
 assert.equal(isBucketRejection(400,{message:'The object exceeded the maximum allowed size'},'size'),true);
 for(const status of [401,403,404,500,502])for(const kind of ['mime','size'])assert.equal(isBucketRejection(status,{message:'permission denied'},kind),false);
 assert.equal(isBucketRejection(400,{error:'NoSuchKey'},'mime'),false);
 assert.equal(isBucketRejection(400,{message:'Bad request'},'size'),false);
});
