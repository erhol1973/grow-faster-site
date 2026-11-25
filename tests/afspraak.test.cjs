'use strict';
// Appointment page. 23 Nov 2026, owner decisions: topic first, no address asked. Later the same day the Google booking page was
// replaced by our own planner (Supabase function, mails from info@ with a calendar invitation), because Google mails came from Gmail.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..','dist');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('afspraak.html: five topics, own planner and form, no third-party booking page',()=>{
  const html=read('afspraak.html'),main=html.match(/<main[\s\S]*?<\/main>/)[0];
  assert.deepEqual([...main.matchAll(/<input type="radio" name="onderwerp" value="([^"]+)"/g)].map(m=>m[1]),['algemeen','vragenlijsten','workflow','organisatie','training']);
  assert.equal((main.match(/ checked>/g)||[]).length,1,'one default topic');
  assert.doesNotMatch(html,/calendar\.app\.google|<iframe\b/,'no Google booking page and no embedded third-party content');
  assert.deepEqual([...main.matchAll(/<input id="f-[a-z]+" name="([a-z_]+)"/g)].map(m=>m[1]),['name','email','phone','organisation','job_title','website']);
  assert.match(main,/<textarea id="f-vraag" name="note"/);
  assert.match(main,/name="website" tabindex="-1"/,'hidden spam trap');
  assert.doesNotMatch(main,/postadres|>Adres<|autocomplete="(street|postal|address)/i,'no postal address asked');
  for(const id of ['f-naam','f-mail','f-tel','f-org','f-functie'])assert.match(main,new RegExp(`<input id="${id}"[^>]* required`),id);
  assert.match(html,/<script defer src="assets\/booking\.js\?v=[^"]+"><\/script>/);
  const js=fs.readFileSync(path.join(root,'assets/booking.js'),'utf8');
  assert.match(js,/https:\/\/dbooobckaqbkrmkpcuem\.supabase\.co\/functions\/v1\/booking/,'production endpoint');
  assert.match(js,/host === 'grow-faster\.be'/,'test endpoint everywhere except the live domain');
  assert.match(js,/new URLSearchParams\(location\.search\)\.get\('onderwerp'\)/);
  const I=(()=>{const c={window:{}};vm.runInNewContext(read('assets/i18n.js'),c);return c.window.I18N})();
  for(const t of ['Plan een gesprek','Waarover wilt u praten?','Algemene vraag','Vragenlijsten automatisch invullen met AI','Workflow-automatisering','Organisatieontwikkeling','Training','Kies een dag en een uur','Uw gegevens','Voornaam en familienaam','Telefoonnummer','Bevestig de afspraak','Uw afspraak staat vast','Wat gebeurt er daarna?','Plan een gesprek | Grow Faster'])assert.ok(I[t]?.[1],'FR missing: '+t);
});
test('booking administration page is private, uses the CMS administrator login and a strict CSP',()=>{
  const html=read('admin-afspraken.html');
  assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
  assert.match(html,/Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https:\/\/dbooobckaqbkrmkpcuem\.supabase\.co https:\/\/gqsvoioccvklzfmdmexy\.supabase\.co;/);
  assert.doesNotMatch(html,/<script>(?!\s*$)|onclick=/,'no inline script');
  const js=fs.readFileSync(path.join(root,'assets/booking-admin.js'),'utf8');
  for(const f of ['booking_admin_overview','booking_admin_block','booking_admin_unblock','booking_admin_cancel'])assert.match(js,new RegExp(f));
  assert.doesNotMatch(js,/service_role|sb_secret_|confirm\(|alert\(/,'no secret key and no blocking browser dialogs');
  assert.doesNotMatch(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),/admin-afspraken/);
});
test('database migration keeps personal data private and blocks double bookings',()=>{
  const sql=fs.readFileSync(path.resolve(__dirname,'..','supabase','migrations','20261123_booking.sql'),'utf8');
  assert.match(sql,/create table private\.booking_appointments/);
  assert.match(sql,/create unique index booking_one_per_slot on private\.booking_appointments\(start_at\) where status = 'confirmed'/);
  assert.match(sql,/grant execute on function public\.booking_busy\(timestamptz, timestamptz\), public\.booking_create\(jsonb, text\), public\.booking_mark_mailed\(uuid\) to service_role;/);
  assert.doesNotMatch(sql,/to anon|grant select on private/,'nothing granted to anonymous visitors');
  assert.equal((sql.match(/if not private\.is_cms_admin\(\) then raise insufficient_privilege/g)||[]).length,4,'every admin function checks the allowlist');
  assert.match(sql,/interval '12 months'/,'retention as in the privacy policy');
});
test('every conversation button points to the appointment page with a known topic',()=>{
  const topics=new Set(['algemeen','vragenlijsten','workflow','organisatie','training']);let n=0;
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){const html=read(f);
    assert.doesNotMatch(html,/subject=Pilot%20Orion/,f);
    for(const m of html.matchAll(/href="afspraak\.html(?:\?onderwerp=([^"]+))?"/g)){n++;if(m[1])assert.ok(topics.has(m[1]),f+': '+m[1])}}
  assert.ok(n>30);
  assert.match(read('orion.html'),/href="afspraak\.html\?onderwerp=vragenlijsten" class="btn primary"/);
});
test('privacy policy names the own booking storage and mail in Dutch and French',()=>{
  const html=read('privacy.html');
  assert.doesNotMatch(html,/Google Agenda|Agenda Google/);
  assert.match(html,/Je plant een gesprek via onze afspraakpagina[\s\S]*versleutelde code van je IP-adres/);assert.match(html,/Vous planifiez un entretien via notre page de rendez-vous[\s\S]*code chiffré de votre adresse IP/);
  assert.match(html,/Supabase \(opslag van afspraken, servers in Londen\)/);assert.match(html,/Supabase \(stockage des rendez-vous, serveurs à Londres\)/);
  assert.match(html,/adequaatheidsbesluit/);assert.match(html,/décision d’adéquation/);
  assert.match(html,/Versie 1\.6/);assert.match(html,/Version 1\.6/);
});
