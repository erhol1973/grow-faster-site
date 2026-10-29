// Only the local preview is loaded. No production traffic is generated.
const fs=require('node:fs'),path=require('node:path');
const {performance,monitorEventLoopDelay}=require('node:perf_hooks'),os=require('node:os');
const {createServer}=require('./server.cjs');
const routes=require('../tests/navigation-cases.json').map(p=>({route:'/'+p,status:200})).concat([
  {route:'/coherence-sim.html',status:200},{route:'/assets/site.css',status:200},
  {route:'/assets/site.js',status:200},{route:'/missing-load-test.html',status:404}
]);
const P95_LIMIT_MS=1500;
function summarize(samples,requiredRoutes=routes.map(r=>r.route),limit=P95_LIMIT_MS){
  if(!Number.isFinite(limit)||limit<=0)throw new RangeError('A finite positive latency budget is required');
  const times=samples.map(s=>s.latencyMs).filter(t=>Number.isFinite(t)&&t>=0).sort((a,b)=>a-b);
  const errors=samples.filter(s=>s.status!==s.expected||!Number.isFinite(s.latencyMs)||s.latencyMs<0).length;
  const counts={};for(const s of samples)counts[s.route]=(counts[s.route]||0)+1;
  const missingRoutes=requiredRoutes.filter(r=>!counts[r]);
  const p95Ms=times.length?times[Math.ceil(times.length*.95)-1]:null,violations=[];
  if(!samples.length)violations.push('No load samples collected');
  if(errors)violations.push(`${errors} failed or invalid responses`);
  if(missingRoutes.length)violations.push('Required routes not exercised: '+missingRoutes.join(', '));
  if(p95Ms!==null&&p95Ms>limit)violations.push(`p95 ${Math.round(p95Ms)}ms exceeds ${limit}ms local-preview budget`);
  return {requests:samples.length,errors,p95Ms,p95LimitMs:limit,counts,missingRoutes,violations};
}
async function main(){
  const lag=monitorEventLoopDelay({resolution:20});lag.enable();
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`,samples=[],started=performance.now();
  try{
    await Promise.all(Array.from({length:8},async()=>{
      for(let i=0;i<36;i++){
        const scenario=routes[i%routes.length],t=performance.now();let status=0,failure;
        try{const response=await fetch(base+scenario.route,{signal:AbortSignal.timeout(5000)});status=response.status;await response.arrayBuffer()}catch(error){status=0;failure=error.name+': '+error.message+(error.cause?.code?' ('+error.cause.code+')':'')}
        samples.push({route:scenario.route,expected:scenario.status,status,latencyMs:performance.now()-t,...(failure?{failure}:{})});
      }
    }));
    const report={...summarize(samples),durationMs:Math.round(performance.now()-started),workers:8,target:'local-preview',environment:{node:process.version,platform:process.platform,architecture:process.arch,cpuCount:os.cpus().length,cpu:os.cpus()[0]?.model,totalMemoryBytes:os.totalmem(),freeMemoryBytes:os.freemem(),eventLoopP95Ms:lag.percentile(95)/1e6,eventLoopMaxMs:lag.max/1e6},failures:samples.filter(s=>s.status!==s.expected||!Number.isFinite(s.latencyMs))};
    const reportDir=path.resolve(__dirname,'../reports');fs.mkdirSync(reportDir,{recursive:true});
    fs.writeFileSync(path.join(reportDir,'load.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
    if(report.violations.length)process.exitCode=1;
  }finally{lag.disable();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
}
module.exports={summarize,routes,P95_LIMIT_MS};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
