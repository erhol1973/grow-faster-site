/* Flipboek: bladert door de pagina's van een Magazine-editie. Twee pagina's naast elkaar op een breed scherm, één op een smal scherm. */
(function(){
  "use strict";
  var boek=document.getElementById("fb-boek");if(!boek)return;
  var bladen=Array.prototype.slice.call(boek.querySelectorAll(".fb-blad"));
  var paginas=Array.prototype.slice.call(boek.querySelectorAll(".fb-pagina"));
  var n=paginas.length,vorige=document.getElementById("fb-vorige"),volgende=document.getElementById("fb-volgende"),nr=document.getElementById("fb-nr");
  var mq=window.matchMedia("(max-width:760px)"),pos=1,enkel=mq.matches,draai=null;
  function k(){return Math.floor(pos/2)}
  function stand(){
    enkel=mq.matches;boek.classList.toggle("enkel",enkel);
    if(enkel){
      bladen.forEach(function(b,i){b.classList.remove("om");b.style.zIndex="";b.classList.toggle("fb-blad-zicht",Math.ceil(pos/2)===i+1)});
      paginas.forEach(function(p){var z=+p.dataset.pagina===pos;p.classList.toggle("fb-zicht",z);if(z)p.removeAttribute("inert");else p.setAttribute("inert","")});
      nr.textContent=pos+" / "+n;
    }else{
      var kk=k();
      bladen.forEach(function(b,i){var om=i<kk;b.classList.toggle("om",om);b.style.zIndex=b===draai?String(bladen.length+2):String(om?i+1:bladen.length-i)});
      paginas.forEach(function(p){var pg=+p.dataset.pagina,z=pg===pos||pg===pos-1;p.classList.remove("fb-zicht");if(z)p.removeAttribute("inert");else p.setAttribute("inert","")});
      nr.textContent=kk===0?"1 / "+n:kk>=bladen.length?n+" / "+n:(2*kk)+" - "+(2*kk+1)+" / "+n;
    }
    boek.classList.toggle("fb-begin",!enkel&&k()===0);boek.classList.toggle("fb-einde",!enkel&&k()>=bladen.length);
    vorige.disabled=pos<=1;volgende.disabled=pos>=n;
  }
  function ga(richting){
    var oud=pos;
    if(enkel)pos=Math.min(n,Math.max(1,pos+richting));
    else{var kk=Math.min(bladen.length,Math.max(0,k()+richting));pos=Math.min(n,2*kk+1)}
    if(pos===oud)return;
    if(!enkel){draai=bladen[richting>0?k()-1:k()];if(draai){var d=draai;setTimeout(function(){if(draai===d){draai=null;stand()}},1100)}}
    stand();
  }
  vorige.addEventListener("click",function(){ga(-1)});
  volgende.addEventListener("click",function(){ga(1)});
  bladen.forEach(function(b){b.addEventListener("transitionend",function(e){if(e.target===b&&b===draai){draai=null;stand()}})});
  document.getElementById("flipboek").addEventListener("keydown",function(e){
    if(e.key==="ArrowRight"||e.key==="PageDown"){e.preventDefault();ga(1)}
    else if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();ga(-1)}
  });
  var startX=null,startY=null;
  boek.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0)return;startX=e.clientX;startY=e.clientY});
  boek.addEventListener("pointerup",function(e){if(startX===null)return;var dx=e.clientX-startX,dy=e.clientY-startY;startX=startY=null;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.5){if(e.target.closest("a,button"))return;ga(dx<0?1:-1)}});
  boek.addEventListener("pointercancel",function(){startX=startY=null});
  /* Links met data-fb-pagina openen het boek op die pagina (bv. de delen-tegels op de magazinepagina). */
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("[data-fb-pagina]");if(!a)return;
    var p=Math.min(n,Math.max(1,+a.getAttribute("data-fb-pagina")||1));
    pos=enkel?p:Math.min(n,2*Math.floor(p/2)+1);draai=null;stand();
  });
  if(mq.addEventListener)mq.addEventListener("change",stand);else mq.addListener(stand);
  stand();
})();
