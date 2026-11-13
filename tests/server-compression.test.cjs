const {test}=require('node:test');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),zlib=require('node:zlib');
const {createServer}=require('../scripts/server.cjs');
test('compressed preview negotiates real Brotli/gzip/identity with exact bytes and HEAD parity',async()=>{
 const server=createServer({compress:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const get=(path,encoding,method='GET')=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port:server.address().port,path,method,headers:encoding===undefined?{}:{'accept-encoding':encoding}},res=>{const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));});req.on('error',reject);req.end();});
 try {
  for(const [encoding,expected] of [['br, gzip','br'],['BR;q=0.5, gzip;q=1','gzip'],['br;q=0, gzip','gzip'],['gzip;q=0, br','br'],['identity;q=1, br;q=0.5','identity'],['gzip;q=0','identity'],[undefined,'identity'],['*;q=0.5','br']]){
   const r=await get('/assets/i18n.js',encoding);assert.equal(r.status,200);assert.equal(r.headers.vary,'Accept-Encoding');assert.equal(r.headers['content-encoding'],expected==='identity'?undefined:expected);
   const bytes=expected==='br'?zlib.brotliDecompressSync(r.body):expected==='gzip'?zlib.gunzipSync(r.body):r.body;
   assert.deepEqual(bytes,fs.readFileSync('dist/assets/i18n.js'));
   const head=await get('/assets/i18n.js',encoding,'HEAD');assert.equal(head.status,200);assert.equal(head.headers['content-encoding'],r.headers['content-encoding']);assert.equal(head.body.length,0);
  }
  assert.equal((await get('/index.html','br;q=0,gzip;q=0,identity;q=0')).status,406);
  assert.equal((await get('/index.html','*;q=0')).status,406);
  assert.equal((await get('/assets/hanken-grotesk-latin.woff2','br,identity;q=0')).status,406);
  const font=await get('/assets/hanken-grotesk-latin.woff2','br');
  assert.equal(font.headers['content-encoding'],undefined);
  assert.deepEqual(font.body,fs.readFileSync('dist/assets/hanken-grotesk-latin.woff2'));
  const html=await get('/decision-latency','br');assert.deepEqual(zlib.brotliDecompressSync(html.body),fs.readFileSync('dist/decision-latency.html'));
  const image=await get('/img/favicon.svg','br');assert.deepEqual(zlib.brotliDecompressSync(image.body),fs.readFileSync('dist/img/favicon.svg'));
 } finally {server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('encoded preview cache invalidates rebuilt bytes without changing file contents',async()=>{
 const file='dist/encoding-regression.txt';fs.writeFileSync(file,'first payload');
 const server=createServer({compress:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const read=()=>new Promise((resolve,reject)=>http.get({host:'127.0.0.1',port:server.address().port,path:'/encoding-regression.txt',headers:{'accept-encoding':'br'}},res=>{const parts=[];res.on('data',b=>parts.push(b));res.on('end',()=>resolve(zlib.brotliDecompressSync(Buffer.concat(parts)).toString()));}).on('error',reject));
 try{assert.equal(await read(),'first payload');fs.writeFileSync(file,'second different payload');assert.equal(await read(),'second different payload');}
 finally{server.closeAllConnections();await new Promise(r=>server.close(r));fs.unlinkSync(file);}
});
