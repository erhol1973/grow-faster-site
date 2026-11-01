/* Native buttons make the two compact effort segments usable by touch and keyboard. */
'use strict';
document.addEventListener('click',event=>{
  const button=event.target.closest('button.ec-seg');if(!button)return;
  const chart=button.closest('.ec-split'),open=button.getAttribute('aria-expanded')!=='true';
  chart.querySelectorAll('button.ec-seg').forEach(item=>item.setAttribute('aria-expanded',String(item===button&&open)));
  chart.classList.toggle('has-detail',open);
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const chart=event.target.closest('.ec-split');if(!chart)return;
  chart.querySelectorAll('button.ec-seg').forEach(item=>item.setAttribute('aria-expanded','false'));
  chart.classList.remove('has-detail');
});
