const {test,before,after}=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');const {createServer}=require('../scripts/server.cjs');let server,port;
before(async()=>{server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));port=server.address().port});
after(async()=>{await new Promise(resolve=>server.close(resolve))});
function request(path,method='GET'){return new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port,path,method},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString()}))});req.on('error',reject);req.end()})}
test('preview serves GET HTML with nosniff and CSS with correct MIME',async()=>{const r=await request('/');assert.equal(r.status,200);assert.match(r.headers['content-type'],/^text\/html/);assert.equal(r.headers['x-content-type-options'],'nosniff');assert.match(r.body,/<html/i);assert.match((await request('/assets/site.css')).headers['content-type'],/^text\/css/)});
test('HEAD returns headers without body; write methods are denied',async()=>{assert.equal((await request('/index.html','HEAD')).body,'');const r=await request('/index.html','POST');assert.equal(r.status,405);assert.equal(r.headers.allow,'GET, HEAD')});
test('unknown file, malformed encoding and traversal cannot expose source',async()=>{assert.equal((await request('/missing-file.html')).status,404);assert.equal((await request('/%ZZ')).status,400);for(const p of ['/%00','/%5c..%5cpackage.json'])assert.equal((await request(p)).status,400);const r=await request('/..%2fpackage.json');assert.equal(r.status,403);assert.ok(!r.body.includes('devDependencies'))});

test('performance preview gzip decodes to the same public document',async()=>{
  const compressed=createServer({compress:true});await new Promise(r=>compressed.listen(0,'127.0.0.1',r));
  try{const response=await new Promise((resolve,reject)=>{http.get({hostname:'127.0.0.1',port:compressed.address().port,path:'/index.html',headers:{'accept-encoding':'gzip'}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({headers:res.headers,body:Buffer.concat(chunks)}))}).on('error',reject)});
    assert.equal(response.headers['content-encoding'],'gzip');assert.equal(response.headers.vary,'Accept-Encoding');assert.equal(require('node:zlib').gunzipSync(response.body).toString(),(await request('/index.html')).body);
  }finally{compressed.closeAllConnections();await new Promise(r=>compressed.close(r))}
});
