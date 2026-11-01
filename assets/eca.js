'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ECA=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DIMENSIONS=['strategic','operating','governance','ai','capability'];
  const BAND=[
    [40,'fragmented'],[60,'constrained'],[75,'partially_aligned'],[90,'coherent'],[101,'highly_coherent']
  ];
  const QUESTIONS={strategic:['S1','S2','S3','S4'],operating:['O1','O2','O3','O4'],governance:['D1','D2','D3','D4'],ai:['T1','T2','T3','T4'],capability:['C1','C2','C3','C4']};
  function value(answer){
    const n=Number(answer);
    return Number.isInteger(n)&&n>=1&&n<=5?(n-1)*25:null;
  }
  function mean(values){return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;}
  function band(score){if(score==null)return null;return BAND.find(([max])=>score<max)[1];}
  function ties(scores,mode){
    const entries=Object.entries(scores).filter(([,v])=>v!=null);
    if(!entries.length)return [];
    const target=(mode==='low'?Math.min:Math.max)(...entries.map(([,v])=>v));
    return entries.filter(([,v])=>Math.abs(v-target)<=3).map(([k])=>k);
  }
  function patterns(s){
    const p=[];
    const other=mean([s.strategic,s.operating,s.ai,s.capability].filter(v=>v!=null));
    if(s.strategic>=75&&(s.operating<60||s.governance<60))p.push('strategy_execution_gap');
    if(s.operating<60&&s.governance<60)p.push('coordination_overload');
    if(s.ai>=60&&[s.operating,s.governance,s.capability].filter(v=>v!=null&&v<60).length>=2)p.push('ai_absorption_gap');
    if(s.strategic>=60&&s.capability<60)p.push('local_optimization');
    if(s.governance<60&&other>=70)p.push('governance_drag');
    return p.slice(0,2);
  }
  function score(answers){
    const scores={},counts={};let total=0;
    for(const d of DIMENSIONS){
      const vals=QUESTIONS[d].map(q=>value(answers[q])).filter(v=>v!=null);
      counts[d]=vals.length;total+=vals.length;scores[d]=vals.length>=3?mean(vals):null;
    }
    const valid=Object.values(scores).filter(v=>v!=null);
    const sufficient=total>=15&&valid.length===5;
    const overall=sufficient?mean(valid):null;
    return {sufficient,totalAnswered:total,dimensionScores:scores,dimensionCounts:counts,overall,displayScore:overall==null?null:Math.round(overall),band:band(overall),primaryConstraints:sufficient?ties(scores,'low'):[],strongestMechanisms:sufficient?ties(scores,'high'):[],patterns:sufficient?patterns(scores):[]};
  }
  return {DIMENSIONS,QUESTIONS,value,band,score,patterns};
});
