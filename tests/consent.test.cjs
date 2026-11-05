const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../assets/consent.js');
const now=1800000000000,valid={v:4,ext:false,ana:true,ts:now};
test('consent preserves strictly boolean independent choices at the age boundary',()=>{
  assert.deepEqual(C.parse(JSON.stringify(valid),now),valid);
  assert.ok(C.parse(JSON.stringify({...valid,ts:now-C.maxAge}),now));
  assert.equal(C.parse(JSON.stringify({...valid,ts:now-C.maxAge-1}),now),null);
});
test('malformed, future, wrongly typed or incompatible consent requires a new choice',()=>{
  for(const data of [null,[],{},'bad',{...valid,ext:'false'},{...valid,ana:1},{...valid,v:3},{...valid,ts:now+1},{...valid,ts:'1800000000000'},{...valid,ts:0}])assert.equal(C.parse(JSON.stringify(data),now),null);
  assert.equal(C.parse('{bad',now),null);
});

test('HubSpot loads only after analytics consent and is revoked when consent is withdrawn',()=>{
  const nodes=new Map(),commands=[];
  const doc={body:{appendChild(node){nodes.set(node.id,node)}},createElement(){return{remove(){nodes.delete(this.id)}}},getElementById(id){return nodes.get(id)||null}};
  const win={_hsp:{push(command){commands.push(command)}}};
  C.syncHubSpot(false,win,doc,()=>false);assert.equal(nodes.has('hs-script-loader'),false);
  C.syncHubSpot(true,win,doc,()=>true);assert.equal(nodes.get('hs-script-loader').src,'https://js-eu1.hs-scripts.com/149675328.js');
  assert.deepEqual(commands.at(-1),['setHubSpotConsent',{analytics:true,advertisement:false,functionality:false}]);
  win._hsq={push(command){commands.push(command)}};C.syncHubSpot(false,win,doc,()=>false);
  assert.equal(nodes.has('hs-script-loader'),false);
  assert.deepEqual(commands.slice(-3),[['setHubSpotConsent',{analytics:false,advertisement:false,functionality:false}],['revokeCookieConsent'],['doNotTrack']]);
});
