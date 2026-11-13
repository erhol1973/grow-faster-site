'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),zlib=require('node:zlib');
const {captureCoherenceDiagnostic,writeCoherenceDiagnostic}=require('../scripts/performance-diagnostics.cjs');
const sample={production:false,mode:'mobile',route:'/coherence.html',run:1};
function fixture(){return {lhr:{lighthouseVersion:'13.6.0',fetchTime:'2026-11-13T00:00:00Z',configSettings:{throttling:{rttMs:150}},audits:{metrics:{details:{items:[{firstContentfulPaint:900,largestContentfulPaint:2600}]}}}},artifacts:{Trace:{traceEvents:[{name:'ResourceSendRequest',ts:123,args:{data:{requestId:'7',url:'http://127.0.0.1/coherence.html?v=3&token=synthetic-token',headers:{Authorization:'synthetic-authorization',Cookie:'synthetic-cookie',apikey:'synthetic-key',Accept:'text/html'}}}}]},DevtoolsLog:[{method:'Network.requestWillBeSent',params:{requestId:'7',request:{url:'/object/sign/private/file?%74oken=synthetic-encoded-token&v=3',headers:{'X-Api-Key':'synthetic-api-key','X-Auth-Token':'synthetic-auth-token','User-Agent':'diagnostic-test'},postData:'synthetic-password'},headersText:'synthetic-raw-headers',associatedCookies:[{cookie:{name:'session',value:'synthetic-associated-cookie'}}],response:{url:'https://example.test/file?X-Amz-Signature=synthetic-signature&X-Goog-Credential=synthetic-credential',headers:[{name:'Set-Cookie',value:'synthetic-set-cookie'},{name:'Accept',value:'application/json'}]}}}]}};}

test('diagnostics select only the first anonymous mobile Coherence sample and retain raw references',()=>{
 const result=fixture(),diagnostic=captureCoherenceDiagnostic(result,sample);
 assert.equal(diagnostic.trace,result.artifacts.Trace);assert.equal(diagnostic.devtoolsLog,result.artifacts.DevtoolsLog);assert.equal(diagnostic.configSettings,result.lhr.configSettings);
 assert.equal(diagnostic.mode,'mobile');assert.equal(diagnostic.route,'/coherence.html');assert.equal(diagnostic.run,1);
 for(const change of [{production:true},{mode:'desktop'},{route:'/about.html'},{run:2},{run:3}])assert.equal(captureCoherenceDiagnostic(result,{...sample,...change}),null);
});

test('compressed raw diagnostic preserves graph IDs and metric settings while removing credentials without mutating measurements',()=>{
 const result=fixture(),before=JSON.stringify(result),directory=fs.mkdtempSync(path.join(os.tmpdir(),'gf-performance-diagnostic-'));let file;
 try{
  file=writeCoherenceDiagnostic(directory,captureCoherenceDiagnostic(result,sample));
  assert.equal(path.basename(file),'mobile-coherence-1-diagnostic.json.gz');assert.deepEqual(fs.readdirSync(directory),[path.basename(file)]);
  const text=zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'),data=JSON.parse(text);
  assert.doesNotMatch(text,/synthetic-(?:token|authorization|cookie|key|encoded-token|api-key|auth-token|password|raw-headers|associated-cookie|signature|credential|set-cookie)/);
  assert.equal(data.trace.traceEvents[0].args.data.requestId,'7');assert.equal(data.devtoolsLog[0].params.requestId,'7');assert.equal(data.trace.traceEvents[0].ts,123);
  assert.equal(data.trace.traceEvents[0].args.data.headers.Accept,'text/html');assert.equal(data.devtoolsLog[0].params.request.headers['User-Agent'],'diagnostic-test');
  assert.equal(data.devtoolsLog[0].params.request.url,'/object/sign/private/file?%74oken=[REDACTED]&v=3');
  assert.equal(data.configSettings.throttling.rttMs,150);assert.equal(data.metrics.items[0].largestContentfulPaint,2600);assert.equal(data.lighthouseVersion,'13.6.0');
  assert.equal(JSON.stringify(result),before,'no mutation of Lighthouse artifacts or metric inputs');
 }finally{if(file)fs.unlinkSync(file);fs.rmdirSync(directory);}
});

test('diagnostic writer rejects missing raw artifacts rather than creating a misleading graph',()=>{
 assert.throws(()=>writeCoherenceDiagnostic('.',{}),/Expected Lighthouse Trace and DevtoolsLog/);
});
