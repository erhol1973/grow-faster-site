/* Magazine-pagina: schuivende hero met de edities. Werkt zonder script als horizontale scroll; met script komen pijlen, stippen en autoplay. */
(function(){
  "use strict";
  var track=document.getElementById("mz-track");if(!track)return;
  var slides=Array.prototype.slice.call(track.querySelectorAll(".mz-slide"));
  var stippen=Array.prototype.slice.call(document.querySelectorAll("#mz-stippen button"));
  var podium=document.getElementById("mz-podium"),pauze=document.getElementById("mz-pauze");
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nu=0,timer=null,gestopt=reduce,hover=false,focus=false;
  document.documentElement.classList.add("mz-js");
  function toon(i,soepel){
    nu=(i+slides.length)%slides.length;
    track.scrollTo({left:slides[nu].offsetLeft-track.offsetLeft,behavior:soepel&&!reduce?"smooth":"auto"});
    markeer();
  }
  function markeer(){
    stippen.forEach(function(b,j){if(j===nu)b.setAttribute("aria-current","true");else b.removeAttribute("aria-current")});
    slides.forEach(function(s,j){s.classList.toggle("mz-actief",j===nu)});
  }
  function plan(){
    clearTimeout(timer);
    if(gestopt||hover||focus||document.hidden)return;
    timer=setTimeout(function(){toon(nu+1,true);plan()},6000);
  }
  document.getElementById("mz-vorige").addEventListener("click",function(){toon(nu-1,true)});
  document.getElementById("mz-volgende").addEventListener("click",function(){toon(nu+1,true)});
  stippen.forEach(function(b,j){b.addEventListener("click",function(){toon(j,true)})});
  pauze.setAttribute("aria-pressed",String(gestopt));
  pauze.addEventListener("click",function(){gestopt=!gestopt;pauze.setAttribute("aria-pressed",String(gestopt));plan()});
  podium.addEventListener("mouseenter",function(){hover=true;plan()});
  podium.addEventListener("mouseleave",function(){hover=false;plan()});
  podium.addEventListener("focusin",function(){focus=true;plan()});
  podium.addEventListener("focusout",function(e){if(!podium.contains(e.relatedTarget)){focus=false;plan()}});
  document.addEventListener("visibilitychange",plan);
  var wacht=null;
  track.addEventListener("scroll",function(){
    clearTimeout(wacht);
    wacht=setTimeout(function(){
      var b=track.clientWidth||1,i=Math.round(track.scrollLeft/b);
      if(i!==nu&&i>=0&&i<slides.length){nu=i;markeer();plan()}
    },120);
  },{passive:true});
  window.addEventListener("resize",function(){toon(nu,false)});
  markeer();plan();
})();
