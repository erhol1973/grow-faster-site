const {test,expect}=require('playwright/test');
// Customer menu, sprint 1 (22 Nov 2026): Home plus four direct links without submenus and one pilot mailto action.
// The former grouped-disclosure cases are replaced by direct-link, keyboard, resize and no-JavaScript cases below.
const PILOT='mailto:erlendhollebosch@gmail.com?subject=Pilot%20Orion';
const copy={nl:{primary:['Home','Orion','Automatisering','Coherentie','Over'],work:'Plan een pilotgesprek',orion:'Uw klantvragenlijsten, ingevuld vanuit uw eigen documenten.'},fr:{primary:['Accueil','Orion','Automatisation','Cohérence','À propos'],work:'Planifier un entretien pilote',orion:'Vos questionnaires clients, remplis à partir de vos propres documents.'}};
async function seed(page,lang='nl'){await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},lang)}
async function activate(locator,info){if(info.project.use.isMobile)await locator.tap();else await locator.click()}
async function openMenu(page,info){if(await page.locator('#burger').isVisible()&&!await page.locator('#navlist').isVisible())await activate(page.locator('#burger'),info)}
for(const [lang,text]of Object.entries(copy))test('Home, four direct menu links and the pilot action route correctly in '+lang,async({page},info)=>{
 await seed(page,lang);await page.goto('/index.html');await openMenu(page,info);
 await expect(page.locator('#navlist a.l:not(.nav-work)')).toHaveText(text.primary);
 await expect(page.locator('#navlist .nav-work')).toHaveAccessibleName(text.work);await expect(page.locator('#navlist .nav-work')).toHaveAttribute('href',PILOT);
 await expect(page.locator('#navlist .nav-toggle, #navlist .nav-sub')).toHaveCount(0);await expect(page.locator('#navlist [aria-current]')).toHaveCount(1);await expect(page.locator('#navlist a.l[href="index.html"]')).toHaveAttribute('aria-current','page');
 await expect(page.locator('.nav .brand')).toHaveAttribute('href','index.html');
 if(await page.locator('.nav').evaluate(e=>e.classList.contains('open')))await expect.poll(()=>page.locator('.nav').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');else{await expect(page.locator('html')).toHaveClass(/nav-over/);await expect.poll(()=>page.locator('#navlist a.l:not(.cur):not(.nav-work)').first().evaluate(e=>getComputedStyle(e).color)).toBe('rgb(255, 255, 255)');}
 await activate(page.locator('#navlist a.l[href="orion.html"]'),info);
 await expect(page).toHaveURL(/\/orion\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',lang);await expect(page.locator('h1')).toHaveText(text.orion);
 await expect(page.locator('#navlist a.l[href="orion.html"]')).toHaveAttribute('aria-current','page');await expect(page.locator('#navlist a.l[href="orion.html"]')).toHaveClass(/\bcur\b/);
 // The Veiligheid page is deliberately not in this release.
 await expect(page.locator('a[href="veiligheid.html"]')).toHaveCount(0);
 await openMenu(page,info);await activate(page.locator('#navlist a.l[href="automatisering.html"]'),info);
 await expect(page).toHaveURL(/\/automatisering\.html$/);await expect(page.locator('#hero a[href^="mailto:"]')).toHaveAttribute('href',PILOT);
 await activate(page.locator('.nav .brand'),info);await expect(page).toHaveURL(/\/index\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',lang);
});
test('keyboard order, Escape, outside click and language choice close predictably',async({page},info)=>{
 await seed(page);await page.goto('/index.html');await openMenu(page,info);
 const links=page.locator('#navlist a');await links.first().focus();
 for(const href of ['orion.html','automatisering.html','coherence.html','about.html',PILOT]){await page.keyboard.press('Tab');await expect(page.locator('#navlist a[href="'+href+'"]')).toBeFocused();}
 await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page.locator('#navlist a.l[href="about.html"]')).toHaveText('À propos');
 if(await page.locator('#burger').isVisible()){
  await openMenu(page,info);await page.mouse.click(4,page.viewportSize().height-4);await expect(page.locator('#navlist')).toBeHidden();
  await openMenu(page,info);await page.keyboard.press('Escape');await expect(page.locator('#navlist')).toBeHidden();await expect(page.locator('#burger')).toBeFocused();
 }
});
test('resizing keeps the same ordered menu with a single final pilot action on mobile and desktop',async({page})=>{
 await seed(page,'fr');await page.setViewportSize({width:1440,height:900});await page.goto('/index.html');
 await expect(page.locator('#burger')).toBeHidden();await expect(page.locator('#navlist >li').last()).toHaveClass('nav-action');await expect(page.locator('#navlist >li')).toHaveCount(6);
 for(const link of await page.locator('#navlist a').all())await expect(link).toBeInViewport();
 await page.setViewportSize({width:320,height:568});await expect(page.locator('#burger')).toBeVisible();await page.locator('#burger').click();
 await expect(page.locator('#navlist >li').last()).toHaveClass('nav-action');await expect(page.locator('#navlist .nav-work')).toHaveCount(1);
 await page.locator('html').evaluate(e=>e.style.fontSize='200%');await page.locator('#navlist .nav-work').scrollIntoViewIfNeeded();await expect(page.locator('#navlist .nav-work')).toBeInViewport();await page.locator('html').evaluate(e=>e.style.fontSize='');
 const box=await page.locator('#navlist .nav-work').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(321);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.setViewportSize({width:1440,height:900});await expect(page.locator('#navlist >li').last()).toHaveClass('nav-action');await expect(page.locator('#burger')).toHaveAttribute('aria-expanded','false');
});
for(const reducedMotion of ['no-preference','reduce'])test('menu and former submenu routes work without JavaScript and '+reducedMotion+' motion',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,reducedMotion,viewport:{width:390,height:844}});const page=await context.newPage();try{
 await page.goto(baseURL+'/index.html');await expect(page.locator('main')).toHaveCSS('visibility','visible');await expect(page.locator('#navlist a[href="orion.html"]')).toBeVisible();await page.locator('#navlist a[href="orion.html"]').click();
 await expect(page).toHaveURL(/\/orion\.html$/);await expect(page.locator('main')).toHaveCSS('visibility','visible');await expect(page.locator('h1')).toHaveText('Uw klantvragenlijsten, ingevuld vanuit uw eigen documenten.');
 await page.locator('#navlist a[href="coherence.html"]').click();await expect(page.locator('.topic-links a')).toHaveCount(4);await page.locator('.topic-links a[href="value.html"]').click();await expect(page).toHaveURL(/\/value\.html$/);
 await page.goto(baseURL+'/approach.html');await expect(page.locator('main')).toHaveCSS('visibility','visible');await expect(page.locator('.topic-links a[href="eca.html"]')).toBeVisible();await page.locator('.topic-links a[href="eca.html"]').click();await expect(page).toHaveURL(/\/eca\.html$/);
 }finally{await context.close()}
});

// Executive Radar left the menu; its URL keeps working and its logo return preserves the language.
for(const lang of ['nl','fr'])test('Executive Radar stays reachable outside the menu and logo return preserves '+lang,async({page},info)=>{
 await seed(page,lang);await page.goto('/index.html');await openMenu(page,info);await expect(page.locator('#navlist a.l')).toHaveText([...copy[lang].primary,copy[lang].work+' →']);await expect(page.locator('#navlist a[href^="executive-radar"]')).toHaveCount(0);
 await page.goto('/executive-radar/?lang='+lang);await expect(page.locator('html')).toHaveAttribute('lang',lang+'-BE');await expect(page.locator('.product-identity > strong')).toContainText('Executive Radar');await page.locator('.site-header .identity').click();await expect(page).toHaveURL(new RegExp('/index.html[?]lang='+lang));await expect(page.locator('html')).toHaveAttribute('lang',lang);
});
