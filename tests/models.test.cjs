const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../assets/models.js');const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('coherence hand fixtures preserve weakest dimension and first tied bottleneck',()=>{
  assert.deepEqual(M.coherenceFactors([1,1]),{mn:1,avg:1,bottleneck:0,cs:1,k:0,f:[.6,.3,.15]});
  assert.deepEqual(M.coherenceFactors([5,5]).f,[1,1,1]);
  const r=M.coherenceFactors([2,4,2,4]);assert.equal(r.avg,3);assert.equal(r.cs,2.5);assert.equal(r.bottleneck,0);near(r.f[2],.46875);
  for(const values of [[],[0],[6],[NaN],[Infinity]])assert.throws(()=>M.coherenceFactors(values),RangeError);
});
test('decision fixtures cover all quadrants and risk/readiness overrides',()=>{
  const v=Object.fromEntries(['value','complexity','coord','handoffs','decision','data','repeat','exceptions','personal','scale','risk'].map(k=>[k,1]));
  assert.equal(M.classify(v).fin,'Automate');assert.equal(M.classify({...v,value:5,scale:5}).fin,'Augment');
  const complex={...v,complexity:5,coord:5,handoffs:5,decision:5,personal:5,data:5,repeat:5};
  assert.equal(M.classify(complex).fin,'Agent-enable');assert.equal(M.classify({...complex,value:5,scale:5}).fin,'Reinvent');
  assert.equal(M.classify({...complex,risk:5}).fin,'Augment');
  assert.equal(M.classify({...complex,data:1,repeat:1,exceptions:5}).fin,'Prepare first');
  assert.throws(()=>M.classify({...v,risk:NaN}),RangeError);
});
test('capacity hand fixture distinguishes partial automation and process redesign',()=>{
  const r=M.potentials({V:1200,P:60,CT:10,R:.5,A:.5,D:.5,G:.2,OV:.1,CY:.5});
  assert.equal(r.base,1200);assert.equal(r.a,.25);near(r.pot[0].h,240);near(r.pot[0].ct,9.975);
  near(r.pot[1].h,450);near(r.pot[1].ct,8.73125);near(r.pot[2].h,810);near(r.pot[2].ct,4.98125);
});
test('capacity zero and invalid inputs cannot produce silent nonfinite answers',()=>{
  const zero={V:0,P:0,CT:0,R:0,A:0,D:0,G:0,OV:0,CY:0};assert.deepEqual(M.potentials(zero).pot,[{h:0,ct:0},{h:0,ct:0},{h:0,ct:0}]);
  for(const bad of [{V:-1},{P:Infinity},{G:1.1},{A:NaN}])assert.throws(()=>M.potentials({...zero,...bad}),RangeError);
});
test('cash hand fixture keeps gross capacity separate from conservative realised benefit',()=>{
  const input={h:100,C:60,F:.5,RUN:0,V:1000,a:.5,f:1,I:1000,R0:200,RR:.5,i:0};
  const r=M.businessCase(input);assert.deepEqual(r,{gross:6000,B:3000,y1:300,yN:2800,y3:5900,be:10});
  const agent=M.businessCase({...input,i:1,RUN:1});assert.equal(agent.y1,-200);assert.equal(agent.yN,2300);assert.equal(agent.y3,4400);
  assert.equal(M.businessCase({...input,h:0}).be,null);assert.equal(M.businessCase({...input,F:0}).B,0);
});
test('straight, lane handoff and back-loop distances are independently specified',()=>{
  const n=(x,l=0,t='task')=>({x,l,t});const layout={top:0,laneHeight:10};
  const straight={nodes:{s:n(0,0,'start'),a:n(3),e:n(6,0,'end')},seq:[['s','a'],['a','e']]};
  assert.deepEqual(M.compileFlow(straight,layout).total,{dist:6,hand:0,wait:0,rework:0,gates:0,steps:1});
  const lane={nodes:{s:n(0,0,'start'),a:n(3,1),e:n(6,1,'end')},seq:[['s','a'],['a','e']]};assert.equal(M.compileFlow(lane,layout).total.dist,16);assert.equal(lane.total.hand,1);
  const back={nodes:{a:n(10),b:n(0)},seq:[['a','b','retry','back'],['b','a']]};assert.equal(M.compileFlow(back,layout).total.dist,20);assert.equal(back.total.rework,1);
});
test('parallel flow uses longest branch, counts both tasks and one join',()=>{
  const f={nodes:{s:{x:0,l:0,t:'and'},a:{x:10,l:0,t:'task'},b:{x:20,l:1,t:'task',wait:true},j:{x:30,l:0,t:'and'}},seq:[{par:[[['s','a'],['a','j']],[['s','b'],['b','j']]]}]};
  assert.deepEqual(M.compileFlow(f,{top:0,laneHeight:10}).total,{dist:50,hand:2,wait:1,rework:0,gates:1,steps:2});
  assert.equal(f.items[0].par[0].len,30);assert.equal(f.items[0].par[1].len,50);
});
test('point interpolation clamps at end and rejects unusable paths',()=>{
  const g=M.geometry();assert.deepEqual(g.at([{x:0,y:0},{x:3,y:4}],2.5),{x:1.5,y:2});assert.deepEqual(g.at([{x:0,y:0},{x:3,y:4}],99),{x:3,y:4});
  assert.throws(()=>g.at([],1),RangeError);assert.throws(()=>g.at([{x:0,y:0}],-1),RangeError);assert.throws(()=>M.compileFlow({nodes:{},seq:[['x','y']]}),RangeError);
});
