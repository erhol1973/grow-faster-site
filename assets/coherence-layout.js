'use strict';
// Keep simulator resize messages from moving an outer-page pointer target
// between pointerdown and the native click that follows pointerup.
(() => {
  if(typeof document==='undefined')return;
  const frame=document.getElementById('ec-sim');
  if(!frame)return;
  const bound=Symbol.for('grow-faster.coherence-layout');
  if(frame[bound])return;
  frame[bound]=true;
  const pointers=new Set();
  let pendingHeight=null;
  function applyPendingHeight(){
    if(pointers.size||pendingHeight===null)return;
    frame.style.height=pendingHeight+'px';
    pendingHeight=null;
  }
  function releasePointer(event){
    pointers.delete(event.pointerId);
    // Native mouseup/click dispatch must finish before layout can move the link.
    setTimeout(applyPendingHeight,0);
  }
  document.addEventListener('pointerdown',event=>pointers.add(event.pointerId),true);
  document.addEventListener('pointerup',releasePointer,true);
  document.addEventListener('pointercancel',releasePointer,true);
  window.addEventListener('blur',()=>{pointers.clear();setTimeout(applyPendingHeight,0);});
  function sendLanguage(){
    if(frame.contentWindow)frame.contentWindow.postMessage({type:'avs-lang',lang:document.documentElement.lang},location.origin);
  }
  function bindFramePointerRelease(){
    // Pointer events do not bubble across document boundaries. A press that
    // starts outside the iframe can end inside its same-origin document.
    const child=frame.contentDocument;
    if(!child)return;
    child.addEventListener('pointerup',releasePointer,true);
    child.addEventListener('pointercancel',releasePointer,true);
  }
  bindFramePointerRelease();
  frame.addEventListener('load',()=>{bindFramePointerRelease();sendLanguage();});
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.origin!==location.origin||!event.data||event.data.type!=='ec-sim-h'||!Number.isFinite(event.data.h))return;
    pendingHeight=Math.max(200,Math.min(20000,event.data.h));
    applyPendingHeight();
  });
  new MutationObserver(sendLanguage).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
