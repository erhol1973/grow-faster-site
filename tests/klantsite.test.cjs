// Customer site sprint 1 (22 Nov 2026): Orion entry product, Automatisering stub, customer homepage, Oplossingen overview with the pyramid.
// The Veiligheid page is deliberately excluded from this release (branch feature/veiligheid-pagina).
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
// 25 Nov 2026: homepage-only strings live in assets/i18n-home.js (Object.assign onto window.I18N, loaded after i18n.js on index.html);
// both run in one context, in that order, as in the browser.
const I18N=()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);vm.runInNewContext(read('assets/i18n-home.js'),c);vm.runInNewContext(read('assets/i18n-orion.js'),c);vm.runInNewContext(read('assets/i18n-coherence.js'),c);return c.window};
// Appointment page (23 Nov 2026, owner decision): conversation buttons open afspraak.html with the topic preselected
// instead of a mail; the Google booking page sends the confirmations.
const PILOT='afspraak.html?onderwerp=vragenlijsten';
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"');
const text=html=>decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ');
const pages={
  // 25 Nov 2026 (owner): Orion is not only for the food industry; editorial redesign with "In het kort", numbered sections,
  // application exhibit across four domains and a sector FAQ (replaces "Moeten we een groot project opstarten?").
  'orion.html':['Vragenlijsten en dossiers, voorbereid vanuit uw eigen documenten.','Orion zoekt de antwoorden in uw specificaties, certificaten, fiches en eerdere dossiers, en toont bij elk antwoord de bron. Uw medewerker kijkt na en beslist.','In het kort','Dezelfde vragen, telkens opnieuw','Dat kost uren die niet naar het eigenlijke werk gaan. En wie overtypt, maakt fouten.','Zo werkt Orion','U laadt de vragenlijst op','Orion zoekt de antwoorden','U kijkt na.','U keurt goed en verstuurt.','U krijgt de lijst terug in hetzelfde formaat. Orion verstuurt nooit zelf iets.','Elk antwoord dat u goedkeurt, onthoudt Orion. De volgende vragenlijst gaat daardoor sneller.','Niet enkel voor de voedingsindustrie','Kwaliteit in de voedingsproductie','Technisch onderhoud','Administratie','Logistiek','Kmo’s die vaak dezelfde vragen beantwoorden','Veelgestelde vragen','Werkt Orion ook buiten de voedingsindustrie?','Wat als Orion een fout antwoord geeft?','We gebruiken al ChatGPT. Wat is het verschil?','Wat zegt onze IT-verantwoordelijke ervan?','Voor de pilot start, bespreken we met uw IT-verantwoordelijke hoe Orion met uw gegevens omgaat, en bezorgen we vooraf alle informatie die hij nodig heeft.','Wat kost het?','We starten met een paar vragenlijsten die u echt gekregen hebt. We meten hoeveel tijd ze vandaag kosten en hoeveel met Orion. Ziet u geen verschil, dan stoppen we.'],
  // Release 2 (23 Nov 2026): the approved full Workflow-automatisering text replaces the placeholder.
  'automatisering.html':['Wat uw team overtypt, gebeurt voortaan vanzelf.','We automatiseren het handwerk tussen uw mails, Excel-lijsten en systemen. Uw mensen houden tijd over voor het werk dat telt.','Herkenbaar?','Voorbeelden','Zo pakken we het aan','Wat kmo’s tegenhoudt, en hoe wij dat oplossen','Dienst of software','Wat u wint','Veelgestelde vragen','Welke taak typt uw team vandaag nog over?'],
  'oplossingen.html':['Sneller werken met AI en automatisering','Vier lagen, één doel: winst in tijd en geld.','Van fundament tot AI','AI levert pas tijd en geld op als wat eronder ligt klopt. Daarom bouwen we van onder naar boven: eerst samenhang in de organisatie, dan heldere processen, dan automatisering, dan AI.','Enterprise coherentie','Mensen, teams en systemen trekken in dezelfde richting.','Procesanalyse','Workflowscan','We brengen in kaart waar tijd en geld weglekt.','Repetitief werk loopt vanzelf.','AI neemt zoek- en schrijfwerk over.','Winst in tijd en geld','Drie manieren om sneller te werken','Test Orion op uw eigen vragenlijsten'],
  // Homepage 24 Nov 2026 (owner decisions): new hero line, four application cards replace "Herkenbaar?", the confidentiality block
  // becomes "Uw systemen en uw beslissingen blijven bij u" without a read-only guarantee (that waits for per-connection verification).
  // Homepage redesign 25 Nov 2026 (BRIEF.md, final COPY.md): the card-3 sentence "Haal gegevens uit binnenkomende documenten ..." is
  // replaced by the today/prep/keep structure; "Welk terugkerend werk ..." moves to #terugkerend; the new blocks add their phrases.
  'index.html':['Grow Faster helpt u terugkerend werk te vereenvoudigen met de systemen die u al gebruikt. Met Orion vult uw kwaliteitsteam klantvragenlijsten sneller in op basis van eigen documenten.','Welk terugkerend werk kost uw team tijd?','Kwaliteit in de voedingsproductie','Technisch onderhoud','Logistiek','Verbeter één werkproces met de systemen die u al gebruikt.','Van fundament tot AI','Winst in tijd en geld','Uw systemen en uw beslissingen blijven bij u','Uw medewerker controleert het en zet de laatste stap: versturen, registreren of importeren.',
    'Wij bereiden voor. Uw team kijkt na en beslist.','Vier toepassingen, één werkwijze','In elk voorbeeld ziet u wat het vandaag kost, wat wij voorbereiden en wat uw medewerker zelf blijft doen.',
    'Orion vult de lijst in vanuit uw eigen documenten en toont bij elk antwoord de bron.','Uw kwaliteitsverantwoordelijke kijkt elk antwoord na, keurt goed en verstuurt.',
    'Wij maken uit het inspectieverslag een conceptwerkbon met de voorgestelde acties.','Uw onderhoudsteam beslist welke acties het registreert en inplant.',
    'Wij halen de gegevens uit het document en zetten een conceptaanvraag klaar.','Uw medewerker controleert het concept en registreert het in uw eigen systeem.',
    'Wij lezen de leveringsdocumenten in, vergelijken ze met de bestelling en zetten de afwijkingen op een rij.','De medewerker die de afwijking kan opvolgen, beslist wat er gebeurt.',
    'Meestal gaat het om kleine handelingen die elke dag terugkomen, op bijna elke afdeling. Apart lijken ze onbelangrijk. Samen lopen ze op tot uren per week.',
    'Waar het werk zit','Administratie neemt gegevens uit mails en pdf’s over in Excel en daarna nog eens in het ERP.','Verkoop en klantendienst beantwoorden dezelfde klantvragen telkens opnieuw.',
    'Waarom niemand het ziet','Niemand meet het, dus niemand ziet het totaal.','Wat het kost: reken het zelf uit','Rekenvoorbeeld','Stel: 3 medewerkers besteden elk 2 uur per week aan opzoeken en overtypen.',
    'De uitkomst toont een orde van grootte. Hoeveel tijd u daarvan echt terugwint, meten we in een pilot.',
    'Zo herkent u het','Dezelfde gegevens worden in twee of meer systemen ingetikt.','Niemand weet hoeveel tijd een taak per week kost.',
    'Herkent u er twee of meer? Kies de taak die het vaakst terugkomt. Met die ene taak starten we de pilot.',
    'Zo starten we','Pilot op één taak','Meten en beslissen','We vergelijken de tijd vóór en na. Daarna beslist u: uitbreiden naar een volgende taak of stoppen.']
};
test('approved Dutch texts are published and every one has a Dutch and French translation',()=>{const {I18N:I}=I18N();
  for(const [file,phrases]of Object.entries(pages)){const body=text(read(file));
    for(const phrase of phrases){assert.ok(body.includes(phrase),`${file}: missing approved text "${phrase}"`);
      // A phrase is either a complete translation key or part of exactly one translated sentence.
      const keys=Object.hasOwn(I,phrase)?[phrase]:Object.keys(I).filter(k=>k.includes(phrase));assert.ok(keys.length>=1,`${file}: no translation key for "${phrase}"`);
      for(const k of keys)assert.ok(Array.isArray(I[k])&&I[k][0]===k&&I[k][1]&&I[k][1]!==k,`${file}: no NL/FR translation for "${k}"`);
    }}
});
test('French copy uses formal vous and Belgian typography for questions and colons',()=>{const {I18N:I}=I18N();
  const fr=Object.values(pages).flat().flatMap(p=>Object.keys(I).filter(k=>k===p||k.includes(p)).map(k=>I[k][1]));assert.ok(fr.length>=30);
  for(const value of fr){assert.doesNotMatch(value,/\b(tu|ton|ta|tes|toi)\b/i,value);assert.doesNotMatch(value,/\S[?:;](\s|$)/,`missing non-breaking space: ${value}`);}
  assert.match(I['Wat als Orion een fout antwoord geeft?'][1],/\u00a0\?$/);
});
test('customer pages carry title, description, canonical, og tags and NL/FR language handling',()=>{const {I18N:I}=I18N();
  for(const file of ['index.html','oplossingen.html','orion.html','automatisering.html']){const html=read(file);
    const title=decode(html.match(/<title>([^<]+)<\/title>/)[1]);assert.match(title,/\| Grow Faster$/,file);assert.ok(title.length<=70,file);
    assert.equal(decode(html.match(/<meta name="seo-title" content="([^"]+)"/)[1]),title,file);assert.equal(decode(html.match(/<meta property="og:title" content="([^"]+)"/)[1]),title,file);
    assert.ok(I[title]?.[1],`${file}: French title`);
    const canonical='https://grow-faster.be/'+(file==='index.html'?'':file);
    assert.match(html,new RegExp(`<link rel="canonical" href="${canonical.replaceAll('.','\\.')}">`),file);assert.match(html,new RegExp(`<meta property="og:url" content="${canonical.replaceAll('.','\\.')}">`),file);
    const description=html.match(/<meta name="description" content="([^"]+)">/)[1];assert.ok(description.length>=60&&description.length<=170,`${file}: description length ${description.length}`);
    assert.match(html,/<meta property="og:description" content="[^"]+">/);assert.match(html,/<meta property="og:image" content="https:\/\/grow-faster\.be\/img\/og-image\.jpg">/);
    assert.match(html,/<html lang="nl">/);assert.match(html,/<meta property="og:locale" content="nl_BE">\s*<meta property="og:locale:alternate" content="fr_BE">/);
    assert.match(html,/data-lang="nl"[\s\S]*data-lang="fr"/);assert.doesNotMatch(html,/data-lang="en"/);
    assert.match(html,/<script defer src="assets\/i18n\.js\?v=20261123-release2"><\/script>[\s\S]*<script defer src="assets\/site\.js/);
    assert.ok(JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'].some(x=>x['@type']==='WebSite'),file);
  }
  for(const file of ['oplossingen.html','orion.html','automatisering.html'])assert.match(read('sitemap.xml'),new RegExp(`<loc>https://grow-faster\\.be/${file.replace('.','\\.')}</loc>`));
});
// Release 2 (23 Nov 2026): each offer page has its own conversation mail so requests can be told apart; the menu keeps the pilot mail.
const OWN={'automatisering.html':'afspraak.html?onderwerp=workflow'};
test('the single call to action is the pilot mailto everywhere, without forms or other contact paths',()=>{
  for(const file of ['index.html','oplossingen.html','orion.html']){const html=read(file),main=html.match(/<main[\s\S]*?<\/main>/)[0];
    assert.doesNotMatch(html,/<form\b|hsforms|hbspt\./i,file);
    assert.doesNotMatch(html,/href="mailto:/,file);const ctas=[...main.matchAll(/href="(afspraak\.html[^"]*)"/g)].map(m=>decode(m[1]));assert.ok(ctas.length>=(file==='index.html'?1:2),file);// Sponsor 25 Nov 2026: index.html lost #final; only the hero pilot CTA remains in main.
    for(const m of ctas)assert.equal(m,PILOT,file);
    assert.match(main,new RegExp(`<a href="${PILOT.replace(/[.?]/g,'\\$&')}" class="btn primary"[^>]*>Plan een pilotgesprek <span aria-hidden="true">→</span></a>`),file);
    assert.doesNotMatch(main,/about\.html#work-with-me|Work with me/,file);
  }
  for(const [file,own] of Object.entries(OWN)){const html=read(file),main=html.match(/<main[\s\S]*?<\/main>/)[0];
    assert.doesNotMatch(html,/<form\b|hsforms|hbspt\./i,file);
    assert.doesNotMatch(html,/href="mailto:/,file);
    for(const m of [...main.matchAll(/href="(afspraak\.html[^"]*)"/g)].map(m=>decode(m[1])))assert.equal(m,own,file);
    assert.match(main,new RegExp(`<a href="${own.replace(/[.?]/g,'\\$&')}" class="btn primary"[^>]*>Plan een gesprek <span aria-hidden="true">→</span></a>`),file);
  }
  const orion=read('orion.html');assert.match(orion,/href="#werking" class="btn ghost"[^>]*>Bekijk hoe het werkt/);
  assert.match(read('index.html'),/href="orion\.html" class="btn ghost"[^>]*>Zo werkt Orion/);
});
test('Orion lists four steps and five FAQ disclosures; released pages make no unverified security claims',()=>{const {I18N:I,I18N_HTML:H}=I18N();
  const orion=read('orion.html');const steps=orion.match(/<section id="werking"[\s\S]*?<\/section>/)[0];
  assert.deepEqual([...steps.matchAll(/<span class="step-n" data-notr>(\d+)<\/span>/g)].map(m=>m[1]),['01','02','03','04']);
  assert.equal((orion.match(/<details><summary>/g)||[]).length,5);
  // Release scope (business owner, 22 Nov 2026): Veiligheid is not published and no EU-storage/no-training claim ships.
  assert.equal(fs.existsSync(path.join(root,'veiligheid.html')),false);assert.doesNotMatch(read('sitemap.xml'),/veiligheid/);
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html')))assert.doesNotMatch(read(file),/href="veiligheid\.html"/,file);
  assert.equal(H['orion-faq-it'],undefined);
  const released=[...['index.html','oplossingen.html','orion.html','automatisering.html'].map(f=>text(read(f))),...Object.entries(I).filter(([k])=>/Orion|vragenlijst/.test(k)).flat(2)].join('\n');
  for(const claim of [/bewaard in de (EU|Europese Unie)/,/blijven in de EU/,/niet gebruikt om AI(-modellen)? te trainen/,/afgeschermde omgeving/,/conservés dans l’(UE|Union)/,/entraîner (l’IA|des modèles)/,/Uw recepturen blijven van u/])assert.doesNotMatch(released,claim);
}); 
test('customer homepage follows the approved mockup sections and keeps consent, CMS and the hero photo',()=>{const home=read('index.html');
  // v2: the pyramid "Van fundament tot AI" replaces the former "Drie manieren om sneller te werken" section (moved to Oplossingen).
  // Sponsor decision 25 Nov 2026 10:11: #proof ("Ervaring uit de praktijk") and #final ("Test Orion op uw eigen vragenlijsten") removed from the homepage; the page ends with the trust block.
  assert.ok(!home.includes('id="proof"')&&!home.includes('id="final"'),'proof and final are gone');
  // 25 Nov 2026 (BRIEF.md IA): proof moves below vertrouwelijk; terugkerend and aanpak are new (exact order also in home-v2.test.cjs).
  const order=['id="hero"','id="toepassingen"','id="terugkerend"','id="aanpak"','id="fundament"','id="vertrouwelijk"'].map(id=>home.indexOf(id));
  assert.doesNotMatch(home,/id="herkenbaar"|id="hoe"|orion-film/,'the Orion steps and film live on orion.html (owner decision, 24 Nov 2026)');
  assert.ok(order.every((v,i)=>v>0&&(i===0||v>order[i-1])),'section order');
  assert.match(home,/<img src="img\/hero-toepassingen-1774\.webp" alt="" width="1774" height="887" fetchpriority="high"/);
  assert.doesNotMatch(home,/alleen-lezen|lecture seule|read-only/i,'no read-only guarantee before per-connection verification');
  assert.match(home,/<body data-cms-page="home"/);assert.match(home,/id="consent" role="dialog"/);assert.match(home,/assets\/consent\.js/);
  assert.doesNotMatch(home,/id="aanbod"/);assert.match(home,/<h1 data-ih="home-orion-value"[^>]*>Sneller werken met AI en automatisering\.<\/h1>/);
  const confidential=home.match(/<section id="vertrouwelijk"[\s\S]*?<\/section>/)[0];assert.doesNotMatch(confidential,/<a\b|<ul\b/);
  assert.equal((home.match(/class="vcard in"/g)||[]).length,3,"three trust cards; the four step cards moved to orion.html");
});

// v2: HTML/CSS pyramid (no SVG text) shared by the homepage and Oplossingen; reading order runs from the foundation upward.
test('pyramid is a semantic ordered list from foundation to AI, visually reversed with inline CSS and linked to the offer',()=>{
  for(const [file,id]of [['index.html','fundament'],['oplossingen.html','lagen']]){const html=read(file);
    const section=html.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];
    assert.doesNotMatch(section,/<svg\b/,file);
    assert.match(section,new RegExp(`<figure class="pyr" aria-labelledby="${id}-h" aria-describedby="${id}-d">`),file);
    assert.match(text(section.match(new RegExp(`<p class="sr" id="${id}-d">[^<]+`))[0]),/van onder naar boven/,file);
    const layers=[...section.matchAll(/<li class="pyr-l pyr-(\d)"><span class="pyr-shape">([^<]+)<\/span><div class="pyr-text"><span class="pyr-n"><span>Laag<\/span> \d<\/span><h3><a href="([^"]+)">([^<]+)<\/a><\/h3><p>([^<]+)<\/p>/g)].map(m=>[m[1],m[2],m[3],m[4]]);
    assert.deepEqual(layers,[['1','Enterprise coherentie','coherence.html','Coherentie'],['2','Procesanalyse','automatisering.html','Workflowscan'],['3','Automatisering','automatisering.html','Workflow-automatisering'],['4','AI','orion.html','Orion']],file);
    assert.ok(section.indexOf('class="pyr-result"')<section.indexOf('<ol class="pyr-layers">'),file);assert.match(section,/<span class="pyr-arrow" aria-hidden="true">↑<\/span><strong>Winst in tijd en geld<\/strong>/);
    const css=html.match(/<style data-pyramid>[\s\S]*?<\/style>/)[0];assert.match(css,/\.pyr-layers\{[^}]*flex-direction:column-reverse/);assert.match(css,/clip-path:polygon/);
    assert.doesNotMatch(html,/<link rel="stylesheet" href="assets\/pyramid/,file);
  }
});
test('Oplossingen overview repeats its submenu, keeps the three offer cards and the pilot closing',()=>{const html=read('oplossingen.html');
  assert.deepEqual([...html.match(/<nav class="topic-links"[\s\S]*?<\/nav>/)[0].matchAll(/href="([^"]+)"/g)].map(m=>m[1]),['orion.html','automatisering.html','coherence.html']);
  assert.deepEqual([...html.match(/<section id="aanbod"[\s\S]*?<\/section>/)[0].matchAll(/<article class="gf-feature">[\s\S]*?<a href="([^"]+)"/g)].map(m=>m[1]),['orion.html','automatisering.html','coherence.html']);
  assert.match(html,/<section id="final" class="tinted">/);
});

// v3: every customer page and Coherence has its own decorative 2:1 hero photo in the 640/1280/1774 WebP pattern,
// preloaded with the same srcset, and a page-specific object-position that keeps the subject in view on mobile.
test('each hero uses its own preloaded 2:1 photo, stays decorative and keeps the subject in view',()=>{
  const heroes={'index.html':['hero-toepassingen','50%'],'oplossingen.html':['hero-oplossingen-workflow','58%'],'orion.html':['hero-orion-specificaties','82%'],'automatisering.html':['hero-automatisering-kantoor','78%'],'coherence.html':['hero-coherentie-samenwerking','74%']};
  for(const [file,[name,pos]] of Object.entries(heroes)){const html=read(file);
    const set=[640,1280,1774].map(w=>`img/${name}-${w}.webp ${w}w`).join(', ');
    for(const w of [640,1280,1774]){const st=fs.statSync(path.join(root,`img/${name}-${w}.webp`));assert.ok(st.size>0&&st.size<=700000,`${name}-${w}`);}
    // The homepage may add its silent video after the picture inside the same decorative container.
    const bg=html.match(/<div class="hero-bg" aria-hidden="true"><picture>[\s\S]*?<\/picture>(?:<video class="hero-video"[^>]*><\/video>)?<\/div>/);assert.ok(bg,file);
    assert.ok(bg[0].includes(`srcset="${set}" sizes="100vw"`),`${file}: srcset`);assert.match(bg[0],new RegExp(`<img src="img/${name}-1774\\.webp" alt="" width="1774" height="887" fetchpriority="high"`),file);
    const preload=html.match(/<link rel="preload" as="image" type="image\/webp" href="([^"]+)" imagesrcset="([^"]+)" imagesizes="100vw" fetchpriority="high">/);assert.ok(preload,`${file}: preload`);
    assert.equal(preload[1],`img/${name}-1774.webp`,file);assert.equal(preload[2],set,file);
    assert.match(html.match(/<style data-hero>[^<]*<\/style>/)[0],new RegExp(`object-position:${pos}`),file);
    assert.doesNotMatch(html,/hero-executive-meeting/,file);
  }
  // The retired boardroom photo is no longer published.
  assert.equal(fs.existsSync(path.join(root,'img/hero-executive-meeting-1774.webp')),false);
});
