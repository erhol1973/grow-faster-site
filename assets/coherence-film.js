(()=>{'use strict';
// Localises the "watch the film" links on ECA and the workshop. They open the Enterprise Coherence essentie film on coherence.html.
const copy={nl:'Bekijk de film',fr:'Voir le film'};let current;
function update(){const lang=document.documentElement.lang==='fr'?'fr':'nl';if(current===lang)return;current=lang;document.querySelectorAll('[data-film-copy="link"]').forEach(el=>el.textContent=copy[lang]);document.querySelectorAll('[data-film-link]').forEach(el=>el.href='coherence.html?lang='+lang+'#ec-film')}
new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});update()})();
