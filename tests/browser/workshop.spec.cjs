const {test,expect}=require('playwright/test');
const cases={
 nl:{title:'Van AI-pilot naar bedrijfswaarde',cta:'Bespreek jullie AI-toepassing',subject:'Kennismaking: Van AI-pilot naar bedrijfswaarde',greeting:'Beste Erlend,',missing:'Beschrijf kort jullie AI-toepassing of vraag.'},
 fr:{title:'Du pilote IA à la valeur pour l’entreprise',cta:'Parlons de votre application IA',subject:'Premier échange : du pilote IA à la valeur pour l’entreprise',greeting:'Bonjour Erlend,',missing:'Décrivez brièvement votre application IA ou votre question.'}
};
async function seed(page,lang='nl'){
 await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));window.workshopMails=[];document.addEventListener('click',event=>{const a=event.target.closest('a[href^="mailto:"]');if(a){event.preventDefault();window.workshopMails.push(a.href)}},true)},lang);
}
for(const [lang,copy]of Object.entries(cases)){
 test('workshop stays discoverable without being a main-menu action in '+lang,async({page})=>{
  await seed(page,lang);await page.goto('/index.html');
  await expect(page.locator('#navlist a[href="workshop.html"]')).toHaveCount(0);
  await expect(page.locator('footer a[href="workshop.html"]').first()).toBeAttached();
  await page.goto('/approach.html');expect(await page.evaluate(()=>scrollY)).toBeLessThan(8);await expect(page.locator('#approach-workshop-cta')).toBeInViewport({ratio:1});await page.locator('#approach-workshop-cta').click();await expect(page.locator('h1')).toContainText(copy.title);
  await expect(page.locator('#navlist a.l[href="approach.html"]')).toHaveClass(/\bcur\b/);
 });
 test('workshop entry routes and shared navigation in '+lang,async({page})=>{
  await seed(page,lang);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/index.html');await page.locator('#workshop-entry a').click();
  await expect(page).toHaveURL(/\/workshop\.html$/);await expect(page.locator('h1')).toContainText(copy.title);
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
  await expect(page.locator('.ws-hero .ws-btn')).toContainText(copy.cta);await expect(page.locator('.ws-result')).toHaveCount(3);
  await expect(page.locator('#request-form')).toBeVisible();
  const summaryHeights=await page.locator('.workshop summary').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height).filter(h=>h>0));
  for(const height of summaryHeights)expect(height,'Workshop disclosures must retain compact, readable headings').toBeLessThanOrEqual(96);
  expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(await page.locator('#voorbeeldplan').evaluate(e=>e.open)).toBe(await page.evaluate(()=>innerWidth>=900));
  await expect(page.locator('.ws-eca-link')).toHaveAttribute('href','eca.html?lang='+lang);
  await page.locator('.ws-eca-link').click();await expect(page.locator('html')).toHaveAttribute('lang',lang);await expect(page.locator('#assessment')).toBeVisible();
  await page.goto('/approach.html');await page.locator('#workshop-entry a').click();await expect(page.locator('h1')).toContainText(copy.title);
  if(await page.locator('#burger').isVisible())await page.locator('#burger').click();await page.locator('#navlist a[href="about.html"]').click();
  await expect(page).toHaveURL(/\/about\.html$/);await expect(page.locator('h1')).toBeInViewport();
  await page.locator('footer a[href="workshop.html"]').first().click();await expect(page.locator('h1')).toContainText(copy.title);
  expect(errors).toEqual([]);
 });
 test('voluntary workshop request is local, encoded and language-correct in '+lang,async({page})=>{
  await seed(page,lang);const external=[];page.on('request',r=>{const url=r.url();if(/^https?:\/\//.test(url)&&!url.startsWith(((process.env.TEST_BASE_URL||'http://127.0.0.1:4173')+'/')))external.push(url)});
  await page.goto('/workshop.html?lang='+lang);await page.locator('.ws-hero .ws-btn').click();
  await expect(page).toHaveURL(new RegExp('lang='+lang+'#kennismaking$'));
  await page.locator('#request-form button[type="submit"]').click();
  await expect(page.locator('#request-result')).toBeHidden();expect(await page.locator('#request-question').evaluate(e=>e.validationMessage)).toBe(copy.missing);
  await page.locator('#request-question').fill(' \n ');await page.locator('#request-form button[type="submit"]').click();
  expect(await page.evaluate(()=>window.workshopMails)).toEqual([]);
  const question='<script>alert(1)</script>\nA & B: qui décide?';
  await page.locator('#request-name').fill("Nina D'Haene");await page.locator('#request-company').fill('A&B / Équipe');await page.locator('#request-question').fill(question);
  await page.locator('#request-form button[type="submit"]').click();await expect(page.locator('#request-result')).toBeVisible();
  const mails=await page.evaluate(()=>window.workshopMails);expect(mails).toHaveLength(1);const mail=new URL(mails[0]);
  expect(mail.pathname).toBe('erlendhollebosch@gmail.com');expect(mail.searchParams.get('subject')).toBe(copy.subject);expect(mail.searchParams.get('body')).toContain(copy.greeting);expect(mail.searchParams.get('body')).toContain(question);expect(mail.searchParams.get('body')).toContain('A&B / Équipe');
  await expect(page.locator('#request-preview script')).toHaveCount(0);
  expect(new URL(page.url()).searchParams.toString()).toBe('lang='+lang);
  expect(await page.evaluate(()=>Object.keys(localStorage).sort())).toEqual(['avs-consent','avs-lang']);expect(await page.evaluate(()=>sessionStorage.length)).toBe(0);
  expect(external).toEqual([]);await expect(page.locator('input[name*="consent"],input[name*="subscription"]')).toHaveCount(0);
  if(lang==='nl'){
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}}));await page.locator('#copy-request').click();await expect(page.locator('#draft-details')).toHaveAttribute('open','');await expect(page.locator('#copy-status')).toContainText('Automatisch kopiëren lukt niet');expect(await page.evaluate(()=>getSelection().toString())).toContain(question);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>window.copiedRequest=value}}));await page.locator('#copy-request').click();await expect(page.locator('#copy-status')).toContainText('Aanvraag gekopieerd');expect(await page.evaluate(()=>window.copiedRequest)).toContain(question);
  }
  const next=lang==='fr'?'nl':'fr';await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+next+'"]').click();await expect(page.locator('html')).toHaveAttribute('lang',next);
  await expect(page.locator('#request-name')).toHaveValue("Nina D'Haene");await expect(page.locator('#request-question')).toHaveValue(question);await expect(page.locator('#request-result')).toBeHidden();await expect(page.locator('#request-mail')).not.toHaveAttribute('href');
  await page.locator('#request-form button[type="submit"]').click();const changed=new URL((await page.evaluate(()=>window.workshopMails)).at(-1));expect(changed.searchParams.get('subject')).toBe(cases[next].subject);expect(changed.searchParams.get('body')).toContain(cases[next].greeting);
  await page.locator('#request-question').fill('Updated question');await expect(page.locator('#request-result')).toBeHidden();await expect(page.locator('#request-preview')).toHaveText('');
 });
}
test('anonymous ECA profile offers a paid workshop without transferring answers or scores',async({page})=>{
 await seed(page);const requests=[];page.on('request',r=>{if(new URL(r.url()).origin!==new URL(process.env.TEST_BASE_URL||'http://127.0.0.1:4173').origin)requests.push(r.url())});
 await page.goto('/eca.html?lang=nl');for(const prefix of ['S','O','D','T','C'])for(let n=1;n<=4;n++)await page.locator(`input[name="${prefix+n}"][value="4"]`).check();
 await page.locator('#ecaForm button[type="submit"]').click();await expect(page.locator('#overall')).toHaveText('75/100');
 for(const lang of ['nl','fr']){await page.locator('#ecaLanguage').selectOption(lang);await expect(page.locator('#ecaWorkshop')).toHaveAttribute('href','workshop.html?lang='+lang);}
 expect(requests).toEqual([]);await page.locator('#ecaWorkshop').click();await expect(page).toHaveURL(/\/workshop\.html\?lang=fr$/);await expect(page.locator('html')).toHaveAttribute('lang','fr');
 expect(new URL(page.url()).searchParams.toString()).toBe('lang=fr');await expect(page.locator('#request-question')).toHaveValue('');expect(requests).toEqual([]);
});
test('workshop example, agenda, skip link and privacy choices support keyboard use',async({page})=>{
 await seed(page);await page.goto('/workshop.html');await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();
 const sample=page.locator('#voorbeeldplan'),before=await sample.evaluate(e=>e.open);await page.locator('#voorbeeldplan>summary').focus();await page.keyboard.press('Enter');expect(await sample.evaluate(e=>e.open)).toBe(!before);
 await page.locator('#programma>summary').focus();await page.keyboard.press('Enter');await expect(page.locator('.ws-agenda li')).toHaveCount(6);await expect(page.locator('.ws-agenda')).toBeVisible();
 await page.locator('.open-consent').first().click();await expect(page.locator('#consent')).toBeVisible();await page.locator('#c-none').click();await expect(page.locator('#consent')).toBeHidden();
});
test('workshop retains direct email and native disclosures without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 try{await page.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:4173')+'/workshop.html');await expect(page.locator('#request-form')).toBeHidden();await expect(page.locator('#kennismaking>a')).toHaveCount(0);await expect(page.locator('#kennismaking a[href^="mailto:"]').first()).toBeVisible();await page.locator('#voorbeeldplan>summary').click();await expect(page.locator('#voorbeeldplan')).toHaveAttribute('open','');}finally{await context.close()}
});
test('explicit workshop language survives unavailable preference storage',async({page})=>{
 await seed(page,'nl');
 await page.addInitScript(()=>{localStorage.removeItem('avs-lang');const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='avs-lang')throw new DOMException('Storage unavailable','SecurityError');return original.call(this,key,value)}});
 await page.goto('/workshop.html?lang=fr');await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page.locator('h1')).toContainText(cases.fr.title);await expect(page.locator('#request-form')).toBeVisible();
});
