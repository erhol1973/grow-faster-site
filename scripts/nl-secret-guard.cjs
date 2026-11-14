'use strict';
// Real scanner regression: public DOM metadata is allowed, credentials in the same file are not.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const {catalogBlocks}=require('./nl-audit.cjs');
function verify(binary){
  const root=path.resolve(__dirname,'..'),config=path.join(root,'.gitleaks.toml');
  if(/[\\/]/.test(binary))binary=path.resolve(binary);
  const version=spawnSync(binary,['version'],{encoding:'utf8'});
  if(version.error||version.status!==0||version.stdout.trim()!=='8.24.3')throw Error('Secret guard requires the pinned Gitleaks 8.24.3 executable');
  const approvedPublicDigest='fa70b7ab581a623b406ef6ae06aa44570cb6db4ce3c5276c7b5e523737c4df9f';
  const canonicalDigest=value=>require('node:crypto').createHash('sha256').update(value.replace(/\r\n/g,'\n')).digest('hex');
  const tracked=spawnSync('git',['-c','safe.directory='+root,'show','HEAD:assets/member-auth.js'],{cwd:root,encoding:'utf8'});
  const contract=JSON.parse(fs.readFileSync(path.join(root,'scripts/coherence-dictionary.contract.json'),'utf8'));
  if(tracked.error||tracked.status!==0||canonicalDigest(tracked.stdout)!==approvedPublicDigest||canonicalDigest(fs.readFileSync(path.join(root,'assets/member-auth.js'),'utf8'))!==approvedPublicDigest||contract.runtimeHashes['member-auth.js']!==approvedPublicDigest)throw Error('Reviewed public source digest changed; re-audit the exact scanner exception');
  const entropy=value=>{const counts={};for(const char of value)counts[char]=(counts[char]||0)+1;return Object.values(counts).reduce((sum,n)=>sum-(n/value.length)*Math.log2(n/value.length),0)};
  // Choose a real public identifier that the unexcepted generic rule detects.
  const identifier=catalogBlocks(fs.readFileSync(path.join(root,'assets/cms-catalog.js'),'utf8')).map(b=>b.source.key).filter(v=>/^f[a-f0-9]{12,14}-[0-9]+$/.test(v)).sort((a,b)=>entropy(b)-entropy(a))[0];
  if(!identifier)throw Error('Missing known public DOM identifier fixture');
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'grow-faster-nl-secret-'));
  const generated='  "key": "'+identifier+'",';
  // Deterministic balanced fixture material has no account/service; never print the value.
  const ordinary=Array.from({length:64},(_,i)=>'0123456789abcdef'[(i*7+Math.floor(i/16))%16]).join('');
  const publicDigestLine='    "member-auth.js": "'+approvedPublicDigest+'",';
  const cases=[
    {name:'public-identifier-in-baseline',file:'language/nl-baseline.json',text:generated,detect:false},
    {name:'ordinary-key-in-baseline',file:'language/nl-baseline.json',text:'  "key": "'+ordinary+'",',detect:true},
    {name:'identifier-outside-allowed-path',file:'other.json',text:generated,detect:true},
    {name:'extra-content-on-identifier-line',file:'language/nl-baseline.json',text:generated+' "api_key": "'+ordinary+'"',detect:true},
    {name:'reviewed-public-source-digest',file:'scripts/coherence-dictionary.contract.json',text:publicDigestLine,detect:false},
    {name:'different-digest-in-contract-field',file:'scripts/coherence-dictionary.contract.json',text:'    "member-auth.js": "'+ordinary+'",',detect:true},
    {name:'same-digest-outside-contract-path',file:'other.json',text:publicDigestLine,detect:true},
    {name:'same-digest-in-nested-lookalike-path',file:'other/scripts/coherence-dictionary.contract.json',text:publicDigestLine,detect:true},
    {name:'credential-in-same-contract-file',file:'scripts/coherence-dictionary.contract.json',text:publicDigestLine+'\n  "api_key": "'+ordinary+'",',detect:true},
    {name:'extra-content-on-public-digest-line',file:'scripts/coherence-dictionary.contract.json',text:publicDigestLine+' /* extra content */',detect:true}
  ];
  const results=[];
  try{
    for(const scenario of cases){
      const source=path.join(temporary,scenario.name),file=path.join(source,scenario.file),report=path.join(temporary,scenario.name+'.json');
      fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,scenario.text+'\n');
      const run=spawnSync(binary,['detect','--no-git','--source','.','--config',config,'--report-format','json','--report-path',report,'--redact','--exit-code','2','--no-banner'],{cwd:source,encoding:'utf8'});
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
