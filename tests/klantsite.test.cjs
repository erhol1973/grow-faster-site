// Customer site sprint 1 (22 Nov 2026): Orion entry product, Veiligheid, Automatisering stub, customer homepage.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const I18N=()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);return c.window};
const PILOT='mailto:erlendhollebosch@gmail.com?subject=Pilot%20Orion';
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"');
const text=html=>decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ');
const pages={
  'orion.html':['Uw klantvragenlijsten, ingevuld vanuit uw eigen documenten.','Orion zoekt de antwoorden in uw specificaties, certificaten en eerdere lijsten. Uw medewerker kijkt na en verstuurt.','Dezelfde vragen, telkens opnieuw','Dat kost uren die niet naar kwaliteitswerk gaan. En wie overtypt, maakt fouten.','Zo werkt Orion','U laadt de vragenlijst op','Orion zoekt de antwoorden','U kijkt na.','U keurt goed en verstuurt.','U krijgt de lijst terug in hetzelfde formaat. Orion verstuurt nooit zelf iets.','Elk antwoord dat u goedkeurt, onthoudt Orion. De volgende vragenlijst gaat daardoor sneller.','Wat u wint','Uren per week terug voor uw kwaliteitsdienst.','Voor wie','Voedingsbedrijven die regelmatig vragenlijsten en specificaties van klanten moeten invullen. We starten in West-Vlaanderen.','Veelgestelde vragen','Wat als Orion een fout antwoord geeft?','We gebruiken al ChatGPT. Wat is het verschil?','Wat zegt onze IT-verantwoordelijke ervan?','Wat kost het?','Moeten we een groot project opstarten?','Nee. U levert een paar vragenlijsten en uw documenten aan. De rest doen wij.','Test Orion op uw eigen vragenlijsten','We starten met een paar vragenlijsten die u echt gekregen hebt. We meten hoeveel tijd ze vandaag kosten en hoeveel met Orion. Ziet u geen verschil, dan stoppen we.'],
  'veiligheid.html':['Uw recepturen blijven van u.','Orion werkt met vertrouwelijke specificaties. Hier leest u hoe we die beschermen, in gewone taal.','Waar uw gegevens staan','Uw documenten worden bewaard in de Europese Unie. Ze zijn versleuteld, zowel tijdens opslag als tijdens het versturen.','Wie uw gegevens ziet','Uw gegevens worden niet gebruikt om AI-modellen te trainen.','Wie beslist','Orion kan zelf geen mails versturen en geen andere systemen aanspreken.','Hoe we ons beschermen tegen aanvallen','Elke toegang vraagt een tweede bevestiging (multifactorauthenticatie).','Elke toegang tot uw documenten wordt gelogd.','NIS2 en GDPR','een verwerkersovereenkomst en de lijst van onderaannemers die gegevens verwerken;','antwoorden op uw beveiligingsvragenlijst;','afspraken over hoe snel we u verwittigen bij een incident.','Nog vragen van uw IT-verantwoordelijke?','We bezorgen de informatie graag rechtstreeks, vóór de pilot start.'],
  'automatisering.html':['Workflow-automatisering','Wat uw team vandaag overtypt of met de hand doorstuurt, kan automatisch. Deze pagina wordt binnenkort uitgebreid.'],
  'index.html':['Orion vult de vragenlijsten van uw klanten in op basis van uw eigen documenten. Uw kwaliteitsverantwoordelijke kijkt na en verstuurt.','Herkenbaar?','Drie manieren om sneller te werken','Uw gegevens blijven van u','Test Orion op uw eigen vragenlijsten']
};
test('approved Dutch texts are published and every one has a Dutch and French translation',()=>{const {I18N:I}=I18N();
  for(const [file,phrases]of Object.entries(pages)){const body=text(read(file));
    for(const phrase of phrases){assert.ok(body.includes(phrase),`${file}: missing approved text "${phrase}"`);
      // A phrase is either a complete translation key or part of exactly one translated sentence.
      const keys=Object.hasOwn(I,phrase)?[phrase]:Object.keys(I).filter(k=>k.includes(phrase));assert.ok(keys.length>=1,`${file}: no translation key for "${phrase}"`);
      for(const k of keys)assert.ok(Array.isArray(I[k])&&I[k][0]===k&&I[k][1]&&I[k][1]!==k,`${file}: no NL/FR translation for "${k}"`);
    }}
});
test('French copy uses formal vous and Belgian typography for questions and colons',()=>{const {I18N:I,I18N_HTML:H}=I18N();
  const fr=[...Object.values(pages).flat().map(p=>I[p]?.[1]).filter(Boolean),H['orion-faq-it'][1]];
  for(const value of fr){assert.doesNotMatch(value,/\b(tu|ton|ta|tes|toi)\b/i,value);assert.doesNotMatch(value,/\S[?:;](\s|$)/,`missing non-breaking space: ${value}`);}
  assert.match(I['Wat als Orion een fout antwoord geeft?'][1],/\u00a0\?$/);
});
test('customer pages carry title, description, canonical, og tags and NL/FR language handling',()=>{const {I18N:I}=I18N();
  for(const file of ['index.html','orion.html','veiligheid.html','automatisering.html']){const html=read(file);
    const title=decode(html.match(/<title>([^<]+)<\/title>/)[1]);assert.match(title,/\| Grow Faster$/,file);assert.ok(title.length<=70,file);
    assert.equal(decode(html.match(/<meta name="seo-title" content="([^"]+)"/)[1]),title,file);assert.equal(decode(html.match(/<meta property="og:title" content="([^"]+)"/)[1]),title,file);
    assert.ok(I[title]?.[1],`${file}: French title`);
    const canonical='https://grow-faster.be/'+(file==='index.html'?'':file);
    assert.match(html,new RegExp(`<link rel="canonical" href="${canonical.replaceAll('.','\\.')}">`),file);assert.match(html,new RegExp(`<meta property="og:url" content="${canonical.replaceAll('.','\\.')}">`),file);
    const description=html.match(/<meta name="description" content="([^"]+)">/)[1];assert.ok(description.length>=60&&description.length<=170,`${file}: description length ${description.length}`);
    assert.match(html,/<meta property="og:description" content="[^"]+">/);assert.match(html,/<meta property="og:image" content="https:\/\/grow-faster\.be\/img\/og-image\.jpg">/);
    assert.match(html,/<html lang="nl">/);assert.match(html,/<meta property="og:locale" content="nl_BE">\s*<meta property="og:locale:alternate" content="fr_BE">/);
    assert.match(html,/data-lang="nl"[\s\S]*data-lang="fr"/);assert.doesNotMatch(html,/data-lang="en"/);
    assert.match(html,/<script defer src="assets\/i18n\.js\?v=20261122-klantsite"><\/script>[\s\S]*<script defer src="assets\/site\.js/);
    assert.ok(JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'].some(x=>x['@type']==='WebSite'),file);
  }
  for(const file of ['orion.html','veiligheid.html','automatisering.html'])assert.match(read('sitemap.xml'),new RegExp(`<loc>https://grow-faster\\.be/${file.replace('.','\\.')}</loc>`));
});
test('the single call to action is the pilot mailto everywhere, without forms or other contact paths',()=>{
  for(const file of ['index.html','orion.html','veiligheid.html','automatisering.html']){const html=read(file),main=html.match(/<main[\s\S]*?<\/main>/)[0];
    assert.doesNotMatch(html,/<form\b|hsforms|hbspt\./i,file);
    const mails=[...html.matchAll(/href="(mailto:[^"]+)"/g)].map(m=>decode(m[1]));assert.ok(mails.length>=3,file);for(const m of mails)assert.equal(m,PILOT,file);
    assert.match(main,new RegExp(`<a href="${PILOT.replace(/[.?]/g,'\\$&')}" class="btn primary"[^>]*>Plan een pilotgesprek <span aria-hidden="true">→</span></a>`),file);
    assert.doesNotMatch(main,/about\.html#work-with-me|Work with me/,file);
  }
  const orion=read('orion.html');assert.match(orion,/href="#werking" class="btn ghost"[^>]*>Bekijk hoe het werkt/);
  assert.match(read('index.html'),/href="orion\.html" class="btn ghost"[^>]*>Zo werkt Orion/);
});
test('Orion lists four steps, five FAQ disclosures and a safety link; Veiligheid lists the release-relevant promises',()=>{const {I18N_HTML:H}=I18N();
  const orion=read('orion.html');const steps=orion.match(/<section id="werking"[\s\S]*?<\/section>/)[0];
  assert.deepEqual([...steps.matchAll(/<span class="step-n" data-notr>(\d+)<\/span>/g)].map(m=>m[1]),['01','02','03','04']);
  assert.equal((orion.match(/<details><summary>/g)||[]).length,5);
  assert.match(orion,/<p data-ih="orion-faq-it">[^<]*<a href="veiligheid\.html">pagina Veiligheid<\/a>/);
  assert.match(H['orion-faq-it'][0],/<a href="veiligheid\.html">pagina Veiligheid<\/a>/);assert.match(H['orion-faq-it'][1],/<a href="veiligheid\.html">page Sécurité<\/a>/);
  const safety=text(read('veiligheid.html'));
  for(const promise of ['Europese Unie','niet gebruikt om AI-modellen te trainen','eigen, afgeschermde omgeving','multifactorauthenticatie','niet gewijzigd of gewist','wordt gelogd'])assert.ok(safety.includes(promise),promise);
});
test('customer homepage follows the approved mockup sections and keeps consent, CMS and the hero photo',()=>{const home=read('index.html');
  const order=['id="hero"','id="proof"','id="herkenbaar"','id="hoe"','id="aanbod"','id="veiligheid"','id="final"'].map(id=>home.indexOf(id));
  assert.ok(order.every((v,i)=>v>0&&(i===0||v>order[i-1])),'section order');
  assert.match(home,/<img src="img\/hero-executive-meeting-1774\.webp" alt="" width="1774" height="887" fetchpriority="high"/);
  assert.match(home,/<body data-cms-page="home"/);assert.match(home,/id="consent" role="dialog"/);assert.match(home,/assets\/consent\.js/);
  const aanbod=home.match(/<section id="aanbod"[\s\S]*?<\/section>/)[0];assert.deepEqual([...aanbod.matchAll(/<a href="([^"]+)"/g)].map(m=>m[1]),['orion.html','automatisering.html','coherence.html']);
  assert.match(home.match(/<section id="veiligheid"[\s\S]*?<\/section>/)[0],/href="veiligheid\.html"/);
  assert.equal((home.match(/class="vcard in"/g)||[]).length,7);
});
