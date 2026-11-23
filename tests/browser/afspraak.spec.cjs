const {test,expect}=require('playwright/test');
// Appointment page (23 Nov 2026): topic first (preselected from the calling page), then our own planner and form.
// The booking function is replaced by a local fake so the browser flow runs without the network and without real bookings;
// the slot rules themselves are covered by tests/booking-rules.test.cjs and the database checks by tests/afspraak.test.cjs.
const SLOTS=[
 {start:'2030-01-08T08:00:00.000Z',date:'2030-01-08',time:'09:00'},{start:'2030-01-08T09:00:00.000Z',date:'2030-01-08',time:'10:00'},
 {start:'2030-01-09T13:00:00.000Z',date:'2030-01-09',time:'14:00'},
 ...Array.from({length:12},(_,i)=>({start:`2030-02-${String(i+1).padStart(2,'0')}T08:00:00.000Z`,date:`2030-02-${String(i+1).padStart(2,'0')}`,time:'09:00'})),
];
async function fake(page,{post}={}){
 const sent=[];
 await page.route('**/functions/v1/booking',async route=>{
  const r=route.request();
  if(r.method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({slots:SLOTS})});
  sent.push(r.postDataJSON());const [status,body]=post?post(sent.length):[200,{ok:true,mailed:true}];
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 });
 return sent;
}
async function fill(page){
 await page.locator('#f-naam').fill('An Peeters');await page.locator('#f-mail').fill('an@voorbeeld.be');await page.locator('#f-tel').fill('+32 470 12 34 56');
 await page.locator('#f-org').fill('Voorbeeld nv');await page.locator('#f-functie').fill('Zaakvoerder');
}
test.beforeEach(async({page})=>{await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))})});

test('the menu action opens the planner with a general question selected',async({page})=>{
 await fake(page);
 await page.goto('/index.html');if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
 await page.locator('#navlist .nav-work').click();await expect(page).toHaveURL(/\/afspraak\.html$/);
 await expect(page.locator('input[value="algemeen"]')).toBeChecked();await expect(page.locator('#gekozen-onderwerp')).toHaveText('Algemene vraag');
 await expect(page.locator('#dag-knoppen .dag-kaart')).toHaveCount(14,{timeout:10000});
 const first=page.locator('#dag-knoppen .dag-kaart').first();
 await expect(first.locator('.dk-nr')).toHaveText('8jan');await expect(first.locator('.dk-boven')).toHaveText('dinsdag');await expect(first.locator('.dk-vrij')).toHaveText('2 uren vrij');
 await expect(page.locator('#dag-knoppen .dag-kaart').nth(1).locator('.dk-vrij')).toHaveText('1 uur vrij');
 await expect(first).toHaveAttribute('aria-label','dinsdag 8 januari, 2 uren vrij');
 await expect(page.locator('#uren')).toBeHidden();await expect(page.locator('#keuze-balk')).toBeHidden();
 expect(await page.locator('#dag-knoppen').evaluate(e=>getComputedStyle(e).overflowX)).toBe('auto');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('book a slot: day, hour, details, confirmation with the chosen topic',async({page})=>{
 const sent=await fake(page);
 await page.goto('/afspraak.html?onderwerp=training');await expect(page.locator('input[value="training"]')).toBeChecked();
 await page.locator('#dag-knoppen .dag-kaart').first().click();await expect(page.locator('#dag-knoppen .dag-kaart').first()).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#uren-vm .uurknop')).toHaveText(['09:00','10:00']);await expect(page.locator('#uren-nm')).toHaveText('Geen vrij uur in de namiddag.');
 await page.locator('#uren-vm .uurknop',{hasText:'10:00'}).click();
 await expect(page.locator('#keuze-balk')).toBeVisible();await expect(page.locator('#keuze-tekst')).toHaveText('di 8 jan · 10:00 - 11:00');
 await page.locator('#keuze-verder').click();await expect(page.locator('#f-naam')).toBeFocused();
 await expect(page.locator('#moment-tekst')).toHaveText('dinsdag 8 januari om 10:00 · Training');
 await fill(page);await page.waitForTimeout(3100);await page.locator('#boek').click();
 await expect(page.locator('#bevestigd')).toBeVisible();await expect(page.locator('#bevestigd')).toBeFocused();
 await expect(page.locator('#bevestigd-tekst')).toHaveText('U hebt een gesprek op dinsdag 8 januari om 10:00. Onderwerp: Training.');
 await expect(page.locator('#boek-form')).toBeHidden();
 expect(sent).toHaveLength(1);
 expect(sent[0]).toMatchObject({topic:'training',start:'2030-01-08T09:00:00.000Z',lang:'nl',name:'An Peeters',email:'an@voorbeeld.be',phone:'+32 470 12 34 56',organisation:'Voorbeeld nv',job_title:'Zaakvoerder',note:'',website:''});
 expect(sent[0].elapsed).toBeGreaterThan(3000);
});

test('missing choices and fields are explained and nothing is sent',async({page})=>{
 const sent=await fake(page);
 await page.goto('/afspraak.html');await expect(page.locator('#dag-knoppen .dag-kaart').first()).toBeVisible();
 await fill(page);await page.locator('#boek').click();
 await expect(page.locator('#boek-melding')).toHaveText('Kies eerst een dag en een uur.');
 await page.locator('#dag-knoppen .dag-kaart').nth(1).click();await expect(page.locator('#uren-vm')).toHaveText('Geen vrij uur in de voormiddag.');await page.locator('#uren-nm .uurknop').first().click();
 await page.locator('#f-mail').fill('geen-adres');await page.locator('#f-tel').fill('12');await page.locator('#boek').click();
 await expect(page.locator('#boek-melding')).toHaveText('Vul de gemarkeerde velden in.');
 await expect(page.locator('#f-mail')).toHaveAttribute('aria-invalid','true');await expect(page.locator('#f-tel')).toHaveAttribute('aria-invalid','true');
 await expect(page.locator('#f-naam')).toHaveAttribute('aria-invalid','false');await expect(page.locator('#f-mail')).toBeFocused();
 expect(sent).toHaveLength(0);
});

test('a slot taken in the meantime asks for another hour and reloads the agenda',async({page})=>{
 await fake(page,{post:()=>[409,{error:'taken'}]});
 await page.goto('/afspraak.html');await page.locator('#dag-knoppen .dag-kaart').first().click();await page.locator('#uren-vm .uurknop').first().click();
 await fill(page);await page.locator('#boek').click();
 await expect(page.locator('#boek-melding')).toHaveText('Dat uur is intussen geboekt. Kies een ander uur.');
 await expect(page.locator('#gekozen-moment')).toBeHidden();await expect(page.locator('#keuze-balk')).toBeHidden();await expect(page.locator('#boek')).toBeEnabled();
});

test('when the agenda cannot be loaded the visitor gets the mail address',async({page})=>{
 await page.route('**/functions/v1/booking',route=>route.fulfill({status:500,body:'{}'}));
 await page.goto('/afspraak.html');
 await expect(page.locator('#planner-status')).toContainText('info@grow-faster.be');await expect(page.locator('#dagen')).toBeHidden();
});

test('topic and planner follow the language switch',async({page})=>{
 await fake(page);
 await page.goto('/orion.html');await page.locator('#hero-pilot').click();await expect(page).toHaveURL(/\/afspraak\.html\?onderwerp=vragenlijsten$/);
 await expect(page.locator('#gekozen-onderwerp')).toHaveText('Vragenlijsten automatisch invullen met AI');
 await page.locator('label').filter({hasText:'Training'}).click();await expect(page.locator('#gekozen-onderwerp')).toHaveText('Training');
 await page.locator('input[value="workflow"]').focus();await page.keyboard.press('Space');await expect(page.locator('#gekozen-onderwerp')).toHaveText('Workflow-automatisering');
 await page.locator('#dag-knoppen .dag-kaart').first().click();await page.locator('#uren-vm .uurknop').first().click();
 await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();
 await expect(page.locator('#gekozen-onderwerp')).toHaveText('Automatisation des workflows');
 await expect(page.locator('#dag-knoppen .dag-kaart').first()).toHaveAttribute('aria-label','mardi 8 janvier, 2 heures libres');
 await expect(page.locator('#keuze-tekst')).toHaveText('mar 8 janv · 09:00 - 10:00');await expect(page.locator('#keuze-verder')).toContainText('Continuer');await expect(page.locator('.dagdeel h4').first()).toHaveText('Matin');
 await expect(page.locator('#boek')).toContainText('Confirmer le rendez-vous');await expect(page.locator('#stap3-h')).toHaveText('Vos coordonnées');
});

test('administration: sign in, see appointments, block a period in Brussels time, two-step cancel',async({page})=>{
 const calls=[];
 await page.route('**/auth/v1/token*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:'a.b.c',expires_in:3600})}));
 await page.route('**/rest/v1/rpc/*',async r=>{
  const name=r.request().url().split('/rpc/')[1];calls.push([name,r.request().postDataJSON()]);
  if(name==='cms_is_admin')return r.fulfill({status:200,contentType:'application/json',body:'true'});
  if(name==='booking_admin_overview')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({blocks:[],appointments:[{id:'x1',start_at:'2030-01-08T09:00:00Z',topic:'training',full_name:'An Peeters',job_title:'Zaakvoerder',organisation:'Voorbeeld nv',email:'an@voorbeeld.be',phone:'+32 470 12 34 56',lang:'nl',status:'confirmed',mailed:false,note:'Graag over onboarding'}]})});
  return r.fulfill({status:200,contentType:'application/json',body:'null'});
 });
 await page.goto('/admin-afspraken.html');await expect(page.locator('#omgeving')).toHaveText('Afspraken · TEST');
 await page.locator('input[name="email"]').fill('beheer@voorbeeld.be');await page.locator('input[name="password"]').fill('geheim-wachtwoord');await page.locator('#login-submit').click();
 await expect(page.locator('#workspace')).toBeVisible();await expect(page.locator('input[name="password"]')).toHaveValue('');
 const row=page.locator('#afspraken li').first();
 await expect(row).toContainText('Training');await expect(row).toContainText('An Peeters, Zaakvoerder bij Voorbeeld nv');await expect(row).toContainText('de bevestigingsmail is niet verstuurd');
 await page.locator('input[name="van_datum"]').fill('2030-07-01');await page.locator('input[name="van_uur"]').fill('09:00');
 await page.locator('input[name="tot_datum"]').fill('2030-07-01');await page.locator('input[name="tot_uur"]').fill('12:00');
 await page.locator('#blok-form button[type="submit"]').click();await expect(page.locator('#notice')).toHaveText('Periode geblokkeerd.');
 expect(calls.find(c=>c[0]==='booking_admin_block')[1]).toEqual({range_start:'2030-07-01T07:00:00.000Z',range_end:'2030-07-01T10:00:00.000Z',note:''});
 await row.getByRole('button',{name:'Annuleren'}).click();await expect(page.locator('#notice')).toContainText('Klik nog eens');
 expect(calls.some(c=>c[0]==='booking_admin_cancel')).toBe(false);
 await page.locator('#afspraken li').first().getByRole('button',{name:'Annuleren'}).click();
 await expect(page.locator('#notice')).toContainText('Afspraak geannuleerd');
 expect(calls.find(c=>c[0]==='booking_admin_cancel')[1]).toEqual({appointment_id:'x1'});
});
