// Coherence for kmo's (23 Nov 2026): approved text for owners and management of SMEs, Belgian French with formal "vous".
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const I18N=()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);return c.window.I18N};
// Release 2 (23 Nov 2026): the page is now Bedrijfsontwikkeling in the menu; its mail subject follows the new name.
const MAIL='mailto:erlendhollebosch@gmail.com?subject=Bedrijfsontwikkeling';
const text=html=>html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ').replaceAll('&amp;','&').replace(/\s+/g,' ');
const approved=['Sneller groeien begint bij samenhang.','AI en automatisering versnellen wat er al is. Werken uw mensen, processen en systemen langs elkaar heen, dan versnelt u vooral de verwarring. Coherentie zorgt dat alles in dezelfde richting trekt.','Plan een gesprek','Ontdek uw coherentieprofiel','Herkenbaar voor een groeiende kmo?','Beslissingen blijven liggen.','Iedereen wacht op de zaakvoerder, omdat niet duidelijk is wie wat mag beslissen.','Elke afdeling haar eigen werkwijze.','Verkoop, productie en kwaliteit werken met eigen lijsten en systemen, en stemmen af via mails en vergaderingen.','Nieuwe tools, oude problemen.','Een nieuw systeem of een AI-tool lost weinig op als het werk eromheen niet mee verandert.','Wat coherentie is','Coherentie betekent dat de keuzes in uw bedrijf elkaar versterken: wat u wilt bereiken, hoe u beslist, hoe het werk loopt, welke systemen u gebruikt en wat uw mensen kunnen. Zit daar samenhang in, dan levert elke verbetering meer op, ook AI en automatisering. Daarom is coherentie het fundament van onze aanpak.','Geen AI-waarde zonder samenhang','Zo pakken we het aan','Coherentiescan.','In een gesprek en een korte vragenlijst brengen we in kaart waar beslissingen, processen en systemen botsen.','Eén knelpunt kiezen.','Samen kiezen we het knelpunt dat vandaag de meeste tijd en geld kost.','Aanpakken en meten.','We passen afspraken, processen of systemen aan en meten wat het oplevert.','Dan pas automatiseren.','Automatisering en AI komen daarna, op een fundament dat klopt.','Wat het u oplevert','Snellere beslissingen en minder wachten op één persoon.','Minder afstemmingsoverleg en minder dubbel werk.','Automatisering en AI die blijven werken, omdat het werk eromheen klopt.','Waar wringt het in uw bedrijf?','Vertel ons waar het vandaag stroef loopt. In een eerste gesprek kijken we samen waar tijd en geld weglekt.','Wat onderzoek laat zien'];
test('Coherence publishes the approved text with a French translation for every line',()=>{const body=text(read('coherence.html')),I=I18N();
  for(const p of approved){assert.ok(body.includes(p),'missing: '+p);assert.ok(I[p]?.[1]&&I[p][1]!==p,'FR missing: '+p);assert.doesNotMatch(I[p][1],/\b(tu|ton|ta|tes|toi)\b/i,p);assert.doesNotMatch(I[p][1],/\S[?:;](\s|$)/,'FR typography: '+I[p][1])}
});
test('Bedrijfsontwikkeling has a conversation mail with its own subject and the profile scan as second button, no forms',()=>{const html=read('coherence.html'),main=html.match(/<main[\s\S]*?<\/main>/)[0];
  const hero=main.match(/<header[\s\S]*?<\/header>/)[0];
  assert.match(hero,new RegExp(`<a href="${MAIL.replace(/[.?]/g,'\\$&')}" class="btn primary" id="hero-gesprek">Plan een gesprek`));
  assert.match(hero,/<a href="eca\.html" class="btn ghost" id="hero-scan">Ontdek uw coherentieprofiel/);assert.ok(fs.existsSync(path.join(root,'eca.html')));
  const contact=main.match(/<section id="contact" class="tinted" tabindex="-1"[\s\S]*?<\/section>/);assert.ok(contact);assert.match(contact[0],/id="contact-gesprek"/);
  for(const m of main.matchAll(/href="(mailto:[^"]+)"/g))assert.equal(m[1],MAIL);
  assert.doesNotMatch(main,/<form\b|topic-links|book-thesis|class="lgx"|ec-sim/);
  // 23 Nov 2026 (owner): the film section has no "De film" label above its title.
  assert.doesNotMatch(main.match(/<section id="ec-film"[\s\S]*?<\/section>/)[0],/class="eyebrow"|De film/);
});
test('Coherence figures name their sources; supplier surveys are not used',()=>{const main=read('coherence.html').match(/<section id="cijfers"[\s\S]*?<\/section>/)[0];
  assert.equal((main.match(/<article class="cijfer">/g)||[]).length,3);
  for(const s of ['hbr.org/2015/03/why-strategy-execution-unravels','mckinsey.com/capabilities/people-and-organizational-performance/our-insights/decision-making-in-the-age-of-urgency','econpapers.repec.org/RePEc:fpb:wpaper:202401'])assert.ok(main.includes(s),s);
  for(const n of ['9%','84%','61%','5,99 miljard','1,08%'])assert.ok(main.includes(n),n);
  assert.doesNotMatch(main,/Smartsheet|Asana|Zapier|Automation Anywhere/);
  assert.doesNotMatch(read('coherence.html').match(/<header[\s\S]*?<\/header>/)[0],/\d+ ?%/,'no figure in the hero');
});
test('Orion names the manual transcription error rate with peer-reviewed sources',()=>{const html=read('orion.html'),I=I18N();const p='Onderzoek in de zorg, waar overgetypte gegevens nauwkeurig worden nagekeken, vindt 2 tot 4 fouten per 100 overgetypte velden. In vrije tekstvelden zijn dat er meer.';
  const sec=html.match(/<section id="probleem"[\s\S]*?<\/section>/)[0];assert.ok(text(sec).includes(p));assert.ok(I[p]?.[1]);
  assert.match(sec,/href="https:\/\/doi\.org\/10\.1136\/bmjopen-2012-002406"/);assert.match(sec,/href="https:\/\/doi\.org\/10\.1093\/jamia\/ocy170"/);
});
test('Coherence metadata speaks to SMEs',()=>{const html=read('coherence.html');const t='Bedrijfsontwikkeling: groeien begint bij samenhang | Grow Faster';
  assert.equal(html.match(/<title>([^<]+)<\/title>/)[1],t);assert.ok(I18N()[t]?.[1]);assert.match(html,/<meta name="description" content="[^"]*kmo’s[^"]*">/);assert.match(read('assets/ux.js'),/"coherence\.html": \[\n\s*"Voor zaakvoerders en directie van kmo’s/);
});
