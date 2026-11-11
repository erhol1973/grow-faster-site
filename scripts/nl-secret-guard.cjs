'use strict';
// Real scanner regression: public DOM metadata is allowed, credentials in the same file are not.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const {catalogBlocks}=require('./nl-audit.cjs');
function verify(binary){
  const root=path.resolve(__dirname,'..'),config=path.join(root,'.gitleaks.toml');
  const entropy=value=>{const counts={};for(const char of value)counts[char]=(counts[char]||0)+1;return Object.values(counts).reduce((sum,n)=>sum-(n/value.length)*Math.log2(n/value.length),0)};
  // Choose a real public identifier that the unexcepted generic rule detects.
  const identifier=catalogBlocks(fs.readFileSync(path.join(root,'assets/cms-catalog.js'),'utf8')).map(b=>b.source.key).filter(v=>/^f[a-f0-9]{12,14}-[0-9]+$/.test(v)).sort((a,b)=>entropy(b)-entropy(a))[0];
  if(!identifier)throw Error('Missing known public DOM identifier fixture');
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'grow-faster-nl-secret-'));
  const generated='  "key": "'+identifier+'",';
  // Deterministic balanced fixture material has no account/service; never print the value.
  const ordinary=Array.from({length:64},(_,i)=>'0123456789abcdef'[(i*7+Math.floor(i/16))%16]).join('');
  const cases=[
    {name:'public-identifier-in-baseline',file:'language/nl-baseline.json',text:generated,detect:false},
    {name:'ordinary-key-in-baseline',file:'language/nl-baseline.json',text:'  "key": "'+ordinary+'",',detect:true},
    {name:'identifier-outside-allowed-path',file:'other.json',text:generated,detect:true},
    {name:'extra-content-on-identifier-line',file:'language/nl-baseline.json',text:generated+' "api_key": "'+ordinary+'"',detect:true}
  ];
  const results=[];
  try{
    for(const scenario of cases){
      const source=path.join(temporary,scenario.name),file=path.join(source,scenario.file),report=path.join(temporary,scenario.name+'.json');
      fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,scenario.text+'\n');
      const run=spawnSync(binary,['detect','--no-git','--source',source,'--config',config,'--report-format','json','--report-path',report,'--redact','--exit-code','2','--no-banner'],{encoding:'utf8'});
      if(run.error)throw Error('Gitleaks executable unavailable');
      const findings=fs.existsSync(report)?JSON.parse(fs.readFileSync(report,'utf8')):[];
      const expected=scenario.detect?2:0;
      if(run.status!==expected||Boolean(findings.length)!==scenario.detect)throw Error('Secret guard failed: '+scenario.name+' (status '+run.status+')');
      for(const finding of findings){const relative=finding.File.replaceAll('\\','/');if(finding.RuleID!=='generic-api-key'||!(relative===scenario.file||relative.endsWith('/'+scenario.file)))throw Error('Unexpected scanner fixture result');}
      results.push({scenario:scenario.name,passed:true,findings:findings.length});
    }
    return results;
  }finally{
    // Delete only this freshly created, resolved fixture directory.
    if(path.dirname(path.resolve(temporary))!==path.resolve(os.tmpdir())||!path.basename(temporary).startsWith('grow-faster-nl-secret-'))throw Error('Unsafe fixture cleanup target');
    fs.rmSync(temporary,{recursive:true,force:true});
  }
}
module.exports={verify};
if(require.main===module){try{const results=verify(process.env.GITLEAKS_BIN||'gitleaks');console.log(JSON.stringify({scanner:'Gitleaks 8.24.3',results},null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
