(()=>{'use strict';
// The homepage film has a Dutch and a French edition. Only the source and poster change with the
// language; the player keeps the same box, so in-page anchors do not move after a language switch.
const video=document.querySelector('#home-film video');if(!video)return;
const editions={nl:['media/enterprise-coherence-essentie-nl.mp4','img/enterprise-coherence-essentie.webp'],fr:['media/enterprise-coherence-essentie-fr.mp4','img/enterprise-coherence-essentie-fr.webp']};
let current='nl';
function update(){const lang=document.documentElement.lang==='fr'?'fr':'nl';if(lang===current)return;current=lang;video.pause();video.poster=editions[lang][1];video.querySelector('source').src=editions[lang][0];video.load()}
new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});update()})();
