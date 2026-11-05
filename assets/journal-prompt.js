(()=> {
  const invite=document.getElementById('gf-journal-prompt');
  if(!invite)return;
  let remaining=60000;
  let startedAt=0;
  let timer=0;
  let dismissed=false;
  const main=document.getElementById('journal-content');
  function show(){
    timer=0;
    invite.hidden=false;
    requestAnimationFrame(()=>invite.setAttribute('data-visible','true'));
  }
  function pause(){
    if(!timer)return;
    window.clearTimeout(timer);
    timer=0;
    remaining=Math.max(0,remaining-(Date.now()-startedAt));
  }
  function resume(){
    if(timer||dismissed||!invite.hidden||document.visibilityState!=='visible')return;
    if(remaining<=0){show();return}
    startedAt=Date.now();
    timer=window.setTimeout(show,remaining);
  }
  function close(){
    dismissed=true;
    pause();
    invite.removeAttribute('data-visible');
    invite.hidden=true;
    if(main)main.focus({preventScroll:true});
  }
  invite.querySelector('.gf-journal-prompt__close').addEventListener('click',close);
  document.addEventListener('visibilitychange',()=>document.visibilityState==='visible'?resume():pause());
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!invite.hidden)close()});
  resume();
})();