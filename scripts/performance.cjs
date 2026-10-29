const fs=require('node:fs'),path=require('node:path'),{createServer}=require('./server.cjs');
const {chromium}=require('playwright');
const median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)];
async function main(){
  const production=process.argv.includes('--production'),baseline=process.argv.includes('--baseline');
  const {default:lighthouse}=await import('lighthouse'),launcher=await import('chrome-launcher');
  let server,base='https://grow-faster.be';
  if(!production){server=createServer({compress:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port}
  const routes=production?['/index.html']:['/index.html','/coherence.html','/approach.html'];
  let modes=production?['mobile']:['mobile','desktop'];if(process.argv.includes('--mobile-only'))modes=['mobile'];
  if(process.argv.includes('--home-only'))routes.splice(1);
  const runs=production?1:3,out=path.resolve('reports/lighthouse'+(production?'/production':''));fs.mkdirSync(out,{recursive:true});
  const summaries=[];let failures=[],working=null,finished=false;
  const journal=status=>fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({status,production,baseline,summaries,working,failures,node:process.version,platform:process.platform},null,2));
  journal('running');process.once('exit',code=>{if(!finished){failures.push('Measurement interrupted before completion (exit '+code+')');journal('failed')}});
  try{
    for(const mode of modes)for(const route of routes){const samples=[];working={mode,route,samples};
      for(let i=0;i<runs;i++){
        const socket=require('node:net').createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
        const chrome=await launcher.launch({port,chromePath:process.env.TEST_BROWSER_EXECUTABLE||chromium.executablePath(),chromeFlags:['--headless=new','--no-sandbox','--disable-dev-shm-usage']});
        try{
          const flags={port:chrome.port,onlyCategories:['performance'],output:['json','html'],logLevel:'error',formFactor:mode};
          if(mode==='desktop'){flags.screenEmulation={mobile:false,width:1350,height:940,deviceScaleFactor:1,disabled:false};flags.throttling={rttMs:40,throughputKbps:10240,cpuSlowdownMultiplier:1,requestLatencyMs:0,downloadThroughputKbps:0,uploadThroughputKbps:0}}
          const result=await lighthouse(base+route,flags);if(!result||result.lhr.runtimeError)throw Error(result?.lhr.runtimeError?.message||'No Lighthouse result');
          const lhr=result.lhr,a=lhr.audits,sample={score:lhr.categories.performance.score*100,lcp:a['largest-contentful-paint'].numericValue,cls:a['cumulative-layout-shift'].numericValue,tbt:a['total-blocking-time'].numericValue,fcp:a['first-contentful-paint'].numericValue};samples.push(sample);
          if(!Object.values(sample).every(Number.isFinite))throw Error(mode+' '+route+': incomplete Lighthouse metrics');
          journal('running');
          const name=mode+'-'+path.basename(route,'.html')+'-'+(i+1);fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(lhr));fs.writeFileSync(path.join(out,name+'.html'),result.report[1]);console.log(JSON.stringify({mode,route,run:i+1,...sample}));
        }finally{await chrome.kill()}
      }
      const summary={mode,route,runs,samples,median:Object.fromEntries(['score','lcp','cls','tbt','fcp'].map(k=>[k,median(samples.map(s=>s[k]))]))};summaries.push(summary);
      const m=summary.median;if(!production&&!baseline){if(m.score<90)failures.push(`${mode} ${route}: performance score ${m.score} < 90`);if(m.lcp>2500)failures.push(`${mode} ${route}: LCP ${m.lcp} > 2500ms`);if(m.cls>.1)failures.push(`${mode} ${route}: CLS ${m.cls} > 0.1`);if(m.tbt>200)failures.push(`${mode} ${route}: TBT ${m.tbt} > 200ms`)}
    }
  }catch(error){failures.push('Measurement failed: '+error.message)}finally{if(server){server.closeAllConnections();await new Promise(r=>server.close(r))}}
  working=null;journal(failures.length?'failed':'passed');finished=true;
  const markdown='## Lighthouse '+(production?'public observation':'three-run medians')+'\n\n| Mode | Page | Score | LCP ms | CLS | TBT ms |\n|---|---|---:|---:|---:|---:|\n'+summaries.map(s=>`| ${s.mode} | ${s.route} | ${s.median.score} | ${Math.round(s.median.lcp)} | ${s.median.cls.toFixed(4)} | ${Math.round(s.median.tbt)} |`).join('\n')+'\n\n'+(failures.length?failures.join('\n'):'All configured assertions passed.')+'\n';
  fs.writeFileSync(path.join(out,'summary.md'),markdown);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown);
  if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
}
main().catch(e=>{console.error(e);process.exitCode=1});
