(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GFConsent=api})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const version=3,maxAge=182*864e5;
  function parse(raw,now=Date.now()){
    try{const c=JSON.parse(raw||'null');if(!c||Array.isArray(c)||c.v!==version||typeof c.ext!=='boolean'||typeof c.ana!=='boolean'||!Number.isFinite(c.ts)||c.ts<=0||c.ts>now||now-c.ts>maxAge)return null;return{v:version,ext:c.ext,ana:c.ana,ts:c.ts}}catch{return null}
  }
  return {parse,version,maxAge};
});
