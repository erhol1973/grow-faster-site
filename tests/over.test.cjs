// Release 1.1 (22 Nov 2026): About for customers (approved NL text, Belgian French with formal "vous").
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const I18N=()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);return c.window.I18N};
// Appointment page (23 Nov 2026, owner decision): conversation buttons open afspraak.html with the topic preselected
// instead of a mail; the Google booking page sends the confirmations.
const PILOT='afspraak.html';
const text=html=>html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ').replaceAll('&amp;','&').replace(/\s+/g,' ');
const approved=['Erlend Hollebosch, oprichter van Grow Faster','Meer dan twintig jaar heb ik grote bedrijven geholpen sneller en beter te werken. Nu breng ik die aanpak naar kmo’s, met AI en automatisering.','Waarom Grow Faster','Bij Volvo, Colruyt, Solvay, Telenet en ArcelorMittal zag ik hetzelfde: mensen verliezen uren aan zoeken, overtypen en afstemmen. Grote bedrijven hebben teams en budget om dat aan te pakken. Een kmo heeft die vaak niet, terwijl het probleem er net zo groot is.','Grow Faster brengt de aanpak van grote bedrijven op kmo-maat. We starten met één taak die vandaag te veel tijd kost, meten wat het oplevert en breiden pas uit als het werkt.','Hoe ik werk','Klein starten.','Eén concrete taak, zoals de vragenlijsten van uw klanten.','Meten.','Hoeveel tijd kost het vandaag, en hoeveel na de verandering?','Uitbreiden.','Pas als het resultaat er is, pakken we de volgende stap aan.','Wat ik meebreng','Meer dan twintig jaar programma- en projectmanagement, procesverbetering en transformatie.','Ervaring in voeding en retail, industrie, telecom en technologie, onder meer bij Colruyt Group, Volvo Group, Solvay, ArcelorMittal, Telenet en Ericsson.','Gecertificeerd in AI-operating models en AI-leiderschap (IBM), organisatieverandering (ILE) en verandertrajecten (ICAgile, SAFe SPC).','Oplossingen','Alle oplossingen','Laten we kennismaken','Vertel me welke taak bij u vandaag te veel tijd kost.'];
test('About publishes the approved customer text with a French translation for every line',()=>{const body=text(read('about.html')),I=I18N();
  for(const p of approved){assert.ok(body.includes(p),'missing: '+p);assert.ok(I[p]?.[1]&&I[p][1]!==p,'FR missing: '+p);assert.doesNotMatch(I[p][1],/\b(tu|ton|ta|tes|toi)\b/i,p);assert.doesNotMatch(I[p][1],/\S[?:;](\s|$)/,'FR typography: '+I[p][1])}
});
test('About keeps the portrait and has one pilot action in the hero and in the contact block',()=>{const html=read('about.html'),main=html.match(/<main[\s\S]*?<\/main>/)[0];
  assert.match(html,/<header class="hero executive-hero" id="hero">[\s\S]*<img src="img\/author-retouched-720\.jpg" alt="Portret van Erlend Hollebosch"[^>]*fetchpriority="high"/);
  assert.match(html,/<link rel="preload" as="image" href="img\/author-retouched-400\.jpg"/);
  assert.match(main,new RegExp(`<a href="${PILOT.replace(/[.?]/g,'\\$&')}" class="btn primary" id="hero-pilot">Plan een pilotgesprek`));
  const contact=html.match(/<section id="contact" class="tinted" tabindex="-1"[\s\S]*?<\/section>/);assert.ok(contact,'contact block keeps id and tabindex');
  assert.match(contact[0],/id="contact-pilot"/);assert.match(contact[0],/href="https:\/\/www\.linkedin\.com\/in\/erlend-hollebosch-053361181\/" class="btn ghost" id="contact-linkedin" target="_blank" rel="noopener"/);
  assert.doesNotMatch(contact[0],/binnen|uur|dagen|werkdag/i,'no response-time promise');
  assert.doesNotMatch(main,/href="mailto:/);
  assert.doesNotMatch(main,/<form\b/);
});
test('About links the solutions and no longer links books, track record or the reader',()=>{const html=read('about.html'),main=html.match(/<main[\s\S]*?<\/main>/)[0];
  const sol=main.match(/<section id="oplossingen"[\s\S]*?<\/section>/)[0];assert.deepEqual([...sol.matchAll(/href="([^"]+)"/g)].map(m=>m[1]),['orion.html','automatisering.html','coherence.html','oplossingen.html']);
  assert.doesNotMatch(html,/href="(books\.html|transformation\.html|boek\/)[^"]*"/);assert.doesNotMatch(html,/data-books-css|publication-feature|career-y|track-record/);
  for(const f of ['books.html','transformation.html','boek/the-coherent-enterprise/index.html','boek/index.html'])assert.ok(fs.existsSync(path.join(root,f)),f+' stays published');
});
test('About metadata describes the founder of Grow Faster',()=>{const html=read('about.html'),I=I18N();
  const title=html.match(/<title>([^<]+)<\/title>/)[1];assert.equal(title,'Erlend Hollebosch, oprichter van Grow Faster');assert.ok(I[title]?.[1]);
  assert.match(html,/<meta property="og:title" content="Erlend Hollebosch, oprichter van Grow Faster">/);
  assert.match(html,/<meta name="description" content="[^"]*oprichter van Grow Faster[^"]*kmo’s[^"]*">/);assert.match(html,/<link rel="canonical" href="https:\/\/grow-faster\.be\/about\.html">/);
  assert.match(read('assets/ux.js'),/"about\.html": \[\n\s*"Erlend Hollebosch, oprichter van Grow Faster/);
});
