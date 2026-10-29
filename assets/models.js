(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GFModels=api})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  function finite(value,name,min=0,max=Number.MAX_VALUE){if(!Number.isFinite(value)||value<min||value>max)throw new RangeError(name+' outside its supported range');return value}
  function coherenceFactors(sc){
    if(!Array.isArray(sc)||!sc.length)throw new RangeError('At least one coherence score is required');
    sc.forEach(v=>finite(v,'coherence score',1,5));
    const mn=Math.min(...sc),avg=sc.reduce((p,q)=>p+q,0)/sc.length,cs=(mn+avg)/2,k=(cs-1)/4;
    return {mn,avg,bottleneck:sc.indexOf(mn),cs,k,f:[.6+.4*k,.3+.7*k,.15+.85*k]};
  }
  function classify(vals){
    for(const key of ['value','complexity','coord','handoffs','decision','data','repeat','exceptions','personal','scale','risk'])finite(vals[key],key,1,5);
    const n=v=>(v-1)/4,x=n((vals.complexity+vals.coord+vals.handoffs+vals.decision+vals.personal)/5),y=n((2*vals.value+vals.scale)/3);
    const cls=x<.5?(y>.5?'Augment':'Automate'):(y>.5?'Reinvent':'Agent-enable');
    const r=vals.risk,rd=(vals.data+vals.repeat+(6-vals.exceptions))/3;let fin=cls;
    if(r>=5&&(cls==='Automate'||cls==='Agent-enable'))fin='Augment';
    if(rd<2.7&&(cls==='Agent-enable'||cls==='Reinvent'))fin='Prepare first';
    return {x,y,cls,fin,r,rd};
  }
  function potentials({V,P,CT,R,A,D,G,OV,CY}){
    for(const [name,value]of Object.entries({V,P,CT}))finite(value,name);
    for(const [name,value]of Object.entries({R,A,D,G,OV,CY}))finite(value,name,0,1);
    const base=V*P/60,a=R*A,saveDays=(P*G/60)/8;
    return {base,a,pot:[
      {h:base*G,ct:Math.max(0,CT-saveDays)},
      {h:base*(a*(1-OV)+(1-a)*G),ct:a*CT*CY+(1-a)*Math.max(0,CT-saveDays)},
      {h:base*(a*(1-OV)+(1-a)*(1-(1-G)*(1-D))),ct:a*CT*CY+(1-a)*Math.max(0,CT*(1-D)-saveDays)}
    ]};
  }
  function businessCase({h,C,F,RUN,V,a,f,I,R0,RR,i}){
    for(const [name,value]of Object.entries({h,C,RUN,V,I,R0}))finite(value,name);
    for(const [name,value]of Object.entries({F,a,f,RR}))finite(value,name,0,1);
    finite(i,'scenario',0,2);
    const gross=h*C,B=gross*F,run=i?RUN*V*a*f:0,R=R0+run,y1=B*RR-R-I,yN=B-R,y3=y1+2*yN;
    let be=null,cum=-I;for(let m=1;m<=60;m++){cum+=((m<=12?B*RR:B)-R)/12;if(cum>=0){be=m;break}}
    return {gross,B,y1,yN,y3,be};
  }
  function geometry({top=0,laneHeight=1}={}){
    finite(top,'top');finite(laneHeight,'lane height',Number.EPSILON);
    const point=n=>({x:n.x,y:top+n.l*laneHeight+laneHeight/2});
    function route(A,B,kind){const a=point(A),b=point(B);
      if(kind==='back'){if(A.l===B.l)return[a,b];if(A.x===B.x){const o=26;return[a,{x:a.x+o,y:a.y},{x:a.x+o,y:b.y},b]}const off=b.y<a.y?b.y+40:b.y-40;return[a,{x:a.x,y:off},{x:b.x,y:off},b]}
      if(A.l===B.l||A.x===B.x)return[a,b];return[a,{x:a.x,y:b.y},b];
    }
    const length=pts=>pts.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-pts[i].x,p.y-pts[i].y),0);
    function at(pts,d){finite(d,'distance');if(!pts.length)throw new RangeError('A path needs a point');for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],L=Math.hypot(b.x-a.x,b.y-a.y);if(d<=L){const r=L?d/L:0;return{x:a.x+(b.x-a.x)*r,y:a.y+(b.y-a.y)*r}}d-=L}return pts[pts.length-1]}
    return {point,route,length,at};
  }
  function compileFlow(F,layout){
    const {route,length:plen}=geometry(layout),N=F.nodes,items=[];
    const seg=s=>{const[a,b,lab,kind]=s;if(!N[a]||!N[b])throw new RangeError('Unknown flow node');const pts=route(N[a],N[b],kind);return{from:a,to:b,lab,kind:kind||'',pts,len:plen(pts),lane:N[a].l!==N[b].l}};
    F.seq.forEach(s=>{if(s.par){items.push({par:s.par.map(br=>{const segs=br.map(seg);let cum=0;const pts=[],checks=[];segs.forEach((g,i)=>{(i?g.pts.slice(1):g.pts).forEach(p=>pts.push(p));cum+=g.len;checks.push({node:g.to,at:cum})});return{segs,pts,len:cum,checks}}),join:s.par[0][s.par[0].length-1][1]})}else items.push(seg(s))});
    const T={dist:0,hand:0,wait:0,rework:0,gates:0,steps:0};
    const arrive=id=>{const n=N[id];if(n.t==='task')T.steps++;if(n.t==='xor'||n.t==='and')T.gates++;if(n.wait)T.wait++};
    items.forEach(it=>{if(it.par){T.dist+=Math.max(...it.par.map(b=>b.len));T.hand+=Math.max(...it.par.map(b=>b.segs.filter(g=>g.lane).length));it.par.forEach(b=>b.segs.forEach(g=>{if(g.to!==it.join)arrive(g.to)}));arrive(it.join)}else{T.dist+=it.len;if(it.lane)T.hand++;if(it.kind==='back')T.rework++;arrive(it.to)}});
    F.items=items;F.total=T;const seen=new Set(),edges=[];
    const add=(a,b,lab,kind)=>{const key=a+'>'+b+'>'+(kind||'');if(seen.has(key))return;seen.add(key);edges.push({a,b,lab,kind:kind||'',pts:route(N[a],N[b],kind)})};
    F.seq.forEach(s=>{if(s.par)s.par.forEach(br=>br.forEach(x=>add(...x)));else add(...s)});(F.extra||[]).forEach(x=>add(...x));F.edges=edges;return F;
  }
  return {coherenceFactors,classify,potentials,businessCase,geometry,compileFlow};
});
