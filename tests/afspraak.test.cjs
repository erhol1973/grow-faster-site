'use strict';
// Appointment page (23 Nov 2026, owner decisions): topic first, then the free Google Calendar booking page (one hour, opened in
// a new window so the site itself loads nothing from Google), no address asked, privacy policy names Google Agenda.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const BOOK='https://calendar.app.google/VGYG8kHB7tkqJcYp9';
test('afspraak.html offers five topics, preselects from the link and opens the Google booking page',()=>{
  const html=read('afspraak.html'),main=html.match(/<main[\s\S]*?<\/main>/)[0];
  assert.deepEqual([...main.matchAll(/<input type="radio" name="onderwerp" value="([^"]+)"/g)].map(m=>m[1]),['algemeen','vragenlijsten','workflow','organisatie','training']);
  assert.equal((main.match(/ checked>/g)||[]).length,1,'one default topic');
  assert.match(main,new RegExp(`<a href="${BOOK}" class="btn primary" id="boek" target="_blank" rel="noopener">Kies een tijdstip`));
  assert.doesNotMatch(main,/<form\b|<iframe\b/,'no form and no Google content loaded on the site');
  assert.doesNotMatch(main,/adres(?!se)|address/i,'no postal address asked');
  assert.match(html,/new URLSearchParams\(location\.search\)\.get\('onderwerp'\)/);
  const I=(()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);return c.window.I18N})();
  for(const t of ['Plan een gesprek','Waarover wilt u praten?','Algemene vraag','Vragenlijsten automatisch invullen met AI','Workflow-automatisering','Organisatieontwikkeling','Training','Kies een tijdstip','Wat gebeurt er daarna?','Plan een gesprek | Grow Faster'])assert.ok(I[t]?.[1],'FR missing: '+t);
});
test('every conversation button points to the appointment page with a known topic',()=>{
  const topics=new Set(['algemeen','vragenlijsten','workflow','organisatie','training']);let n=0;
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){const html=read(f);
    assert.doesNotMatch(html,/subject=Pilot%20Orion/,f);
    for(const m of html.matchAll(/href="afspraak\.html(?:\?onderwerp=([^"]+))?"/g)){n++;if(m[1])assert.ok(topics.has(m[1]),f+': '+m[1])}}
  assert.ok(n>30);
  assert.match(read('orion.html'),/href="afspraak\.html\?onderwerp=vragenlijsten" class="btn primary"/);
});
test('privacy policy names bookings via Google Agenda in Dutch and French',()=>{
  const html=read('privacy.html');
  assert.match(html,/Je plant een gesprek via onze afspraakpagina[\s\S]*Google Agenda/);assert.match(html,/Vous planifiez un entretien via notre page de rendez-vous/);
  assert.match(html,/Google \(Gmail, Google Agenda voor afspraken/);assert.match(html,/Versie 1\.5/);
});
