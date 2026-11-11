/* Pure, testable rules for BAEIS dev. No browser or network dependencies. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BAEIS_DEV_CORE=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const weights=Object.freeze({belgium:30,value:25,urgency:20,evidence:15,cross:10});
  const sourceHosts=new Set(['statbel.fgov.be','www.nbb.be','www.vlaio.be']);
  const transitions=Object.freeze({intake:'source-checked','source-checked':'challenge-checked','challenge-checked':'preview-approved'});
  function scoreSignal(scores){
    if(!scores||typeof scores!=='object')throw new TypeError('Missing score data');
    const result=Object.entries(weights).reduce((sum,[key,weight])=>{
      const value=scores[key];
      if(!Number.isInteger(value)||value<0||value>5)throw new RangeError(`Invalid ${key} score`);
      return sum+weight*value/5;
    },0);
    return Math.round(result);
  }
  function sourceIsApproved(url){
    try{const parsed=new URL(url);return parsed.protocol==='https:'&&sourceHosts.has(parsed.hostname)&&!parsed.username&&!parsed.password;}catch{return false;}
  }
  function checkRecord(r){
    const errors=[];
    if(!r||typeof r!=='object')return ['Record missing'];
    if(!/^BE-[A-Z]+-\d{3}$/.test(r.id||''))errors.push('Invalid stable claim ID');
    if(!sourceIsApproved(r.url))errors.push('Primary source URL is absent or outside the demo allowlist');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(r.published||'')||Number.isNaN(Date.parse(r.published)))errors.push('Invalid publication date');
    if(!r.claim?.nl||!r.claim?.fr)errors.push('Missing claim text');
    if(!r.limit?.nl||!r.limit?.fr)errors.push('Missing methodological limitation');
    if(!r.decision?.nl||!r.decision?.fr)errors.push('Missing management implication');
    if(!r.type||!r.source)errors.push('Missing evidence type / publisher');
    if(!Array.isArray(r.roles)||r.roles.length<1)errors.push('Missing audience');
    try{scoreSignal(r.score)}catch(errorscore){errors.push(errorscore.message)}
    return errors;
  }
  function nextStage(stage,record){
    if(checkRecord(record).length)throw new Error('Missing valid evidence metadata');
    const next=transitions[stage];
    if(!next)throw new Error('Transition blocked');
    return next;
  }
  function canPublishExternally(){return false;} // DEV POLICY: no external write integration.
  function filterRecords(records,role,sector,query){
    const term=String(query||'').toLocaleLowerCase('nl-BE');
    return records.filter(r=>(role==='ALL'||r.roles.includes(role))&&(sector==='All'||r.sector===sector)&&[r.title.nl,r.title.fr,r.claim.nl,r.source,r.id,r.sector].join(' ').toLocaleLowerCase('nl-BE').includes(term));
  }
  return Object.freeze({weights,scoreSignal,sourceIsApproved,checkRecord,nextStage,canPublishExternally,filterRecords});
});