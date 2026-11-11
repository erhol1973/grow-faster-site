'use strict';
// Explicit local maintenance only: never invoked by the scheduled workflow.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {hash,validateBaseline}=require('./nl-audit.cjs');
function promote(previous,candidate,ancestor){
  validateBaseline(candidate,ancestor);
  if(candidate.parentBaseline!==hash(previous))throw Error('Stale candidate: baseline version changed');
  const old=JSON.parse(previous);
  if(candidate.history.length!==old.history.length+1||JSON.stringify(candidate.history.slice(0,-1))!==JSON.stringify(old.history))throw Error('History must be append-only');
  if(JSON.stringify(candidate.history.at(-1))!==JSON.stringify({sourceCommit:old.sourceCommit,digest:hash(previous)}))throw Error('Incorrect parent history receipt');
  for(const f of old.findings)if(!candidate.findings.some(n=>JSON.stringify(n)===JSON.stringify(f)))throw Error('Previous finding removed or altered');
  for(const b of candidate.blocks){const before=old.blocks.find(p=>p.id===b.id&&p.sha256===b.sha256);if(b.review&&JSON.stringify(b.review)!==JSON.stringify(before?.review))throw Error('Machine candidate may not invent human approval');}
  return JSON.stringify(candidate,null,2)+'\n';
}
module.exports={promote};
if(require.main===module){
  const root=path.resolve(__dirname,'..'),baseline=path.join(root,'language/nl-baseline.json');
  if(!process.argv[2])throw Error('Usage: node scripts/nl-promote.cjs <candidate-baseline.json> (then review and commit via PR)');
  const ancestor=sha=>{try{execFileSync('git',['merge-base','--is-ancestor',sha,'HEAD'],{cwd:root});return true}catch{return false}};
  fs.writeFileSync(baseline,promote(fs.readFileSync(baseline,'utf8'),JSON.parse(fs.readFileSync(process.argv[2],'utf8')),ancestor));
}
