'use strict';
// The homepage pairs a responsive photograph with a silent, pausable loop of the same scene.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');

test('hero video variants (1280, 1920 and a premium 4K) and still images stay within their budgets',()=>{
  for(const [file,max] of [['media/hero-toepassingen-1280.mp4',800*1024],['media/hero-toepassingen-1920.mp4',1536*1024],['media/hero-toepassingen-4k.mp4',5*1024*1024],['img/hero-toepassingen-1774.webp',120*1024]]){
    const size=fs.statSync(path.join(root,file)).size;assert.ok(size>0&&size<=max,`${file}: ${size} bytes`);}
  const all=fs.readdirSync(path.join(root,'media'));assert.ok(!all.includes('grow-faster-hero-variant-2-4k.mp4'),'the 16 MB master is not published, only the compressed 4K web variant');
});

test('hero video is decorative, silent, looping, inline, lazy and paired with a pause button',()=>{
  const home=read('index.html');
  const v=home.match(/<video class="hero-video"[^>]*>/)[0];
  for(const a of ['muted','loop','playsinline','preload="none"','hidden','data-small="media/hero-toepassingen-1280.mp4"','data-large="media/hero-toepassingen-1920.mp4"','data-uhd="media/hero-toepassingen-4k.mp4"'])assert.ok(v.includes(a),a);
  assert.doesNotMatch(v,/\bautoplay\b|\bcontrols\b|\bsrc=/,'the script decides whether and which video loads');
  assert.doesNotMatch(v,/\bposter=/,'the preloaded still under the video is the poster; a second image would be downloaded twice');
  assert.match(home,/<div class="hero-bg" aria-hidden="true"><picture>[\s\S]*?<\/picture><video class="hero-video"/);
  assert.match(home,/<button type="button" class="hero-pauze" id="hero-pauze" aria-pressed="false" hidden><span class="hp-pauze">Video pauzeren<\/span><span class="hp-speel" hidden>Video afspelen<\/span><\/button>/);
  const js=read('assets/site.js');
  assert.match(js,/if\(reduce\|\|save\)return;/,'reduced motion and data saver keep the still');
  assert.match(js,/v\.src=innerWidth<900\?v\.dataset\.small:\(px>=2400&&\(!net\|\|net==="4g"\)\?v\.dataset\.uhd:v\.dataset\.large\);/);
});

test('application cards: Orion first, the other three lead to workflow automation, the trust block makes no read-only promise',()=>{
  const home=read('index.html');const sec=home.match(/<section id="toepassingen"[\s\S]*?<\/section>/)[0];
  const cards=[...sec.matchAll(/<a class="toep-kaart[^"]*" href="([^"]+)" id="([^"]+)">[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/g)].map(m=>[m[1],m[2],m[3]]);
  assert.deepEqual(cards,[['orion.html','toep-kwaliteit','Kwaliteit in de voedingsproductie'],['automatisering.html','toep-onderhoud','Technisch onderhoud'],['automatisering.html','toep-administratie','Administratie'],['automatisering.html','toep-logistiek','Logistiek']]);
  const trust=home.match(/<section id="vertrouwelijk"[\s\S]*?<\/section>/)[0];
  for(const sys of ['SAP','Dynamics 365','Business Central','Salesforce','SharePoint'])assert.ok(trust.includes(sys),sys);
  assert.match(trust,/Of en hoe we koppelen, beoordelen we per klant\./);
  assert.doesNotMatch(trust,/alleen-lezen|garantie|nooit/i);
  // Sponsor decision 25 Nov 2026 10:11: #proof ("Ervaring uit de praktijk") and #final ("Test Orion op uw eigen vragenlijsten") removed from the homepage: only the hero CTA remains.
  assert.doesNotMatch(home,/id="final-pilot"/);
  for(const id of ['hero-pilot'])assert.match(home,new RegExp(`href="afspraak\\.html\\?onderwerp=vragenlijsten"[^>]*id="${id}"|id="${id}"`));
  const orion=read('orion.html');assert.match(orion,/Dezelfde vragen, telkens in een ander bestand[\s\S]*id="voorbeeld"[\s\S]*Bekijk de bron/,'strongest "Herkenbaar?" content moved to Orion');
});
