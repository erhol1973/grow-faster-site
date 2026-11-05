(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GFConsent=api})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const version=4,maxAge=182*864e5;
  function parse(raw,now=Date.now()){
    try{const c=JSON.parse(raw||'null');if(!c||Array.isArray(c)||c.v!==version||typeof c.ext!=='boolean'||typeof c.ana!=='boolean'||!Number.isFinite(c.ts)||c.ts<=0||c.ts>now||now-c.ts>maxAge)return null;return{v:version,ext:c.ext,ana:c.ana,ts:c.ts}}catch{return null}
  }
  function syncHubSpot(allowed,win,doc,currentConsent){
    const script=doc.getElementById('hs-script-loader');
    const state={analytics:!!allowed,advertisement:false,functionality:false};
    if(allowed){
      win._hsp=win._hsp||[];win._hsp.push(['setHubSpotConsent',state]);
      if(win._hsq)win._hsq.push(['doNotTrack',{track:true}]);
      if(!script){const loader=doc.createElement('script');loader.id='hs-script-loader';loader.async=true;loader.defer=true;loader.src='https://js-eu1.hs-scripts.com/149675328.js';loader.onload=()=>{if(typeof currentConsent==='function'&&!currentConsent())syncHubSpot(false,win,doc,currentConsent)};doc.body.appendChild(loader)}
      return;
    }
    if(script||win._hsq){win._hsp=win._hsp||[];win._hsp.push(['setHubSpotConsent',state]);win._hsp.push(['revokeCookieConsent']);win._hsq=win._hsq||[];win._hsq.push(['doNotTrack'])}
    if(script)script.remove();
  }
  return {parse,version,maxAge,syncHubSpot};
});
