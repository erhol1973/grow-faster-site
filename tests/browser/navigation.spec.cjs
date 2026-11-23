const {test,expect}=require('playwright/test');
// Customer menu, sprint 1 v2 (22 Nov 2026): Home · Oplossingen ▾ (Orion, Workflow-automatisering, Coherentie) · Over
// and one pilot mailto action. The disclosure cases follow the pattern main used for its grouped menu.
const PILOT='mailto:erlendhollebosch@gmail.com?subject=Pilot%20Orion';
const copy={nl:{primary:['Home','Oplossingen','Over'],children:['Orion','Workflow-automatisering','Coherentie'],work:'Plan een pilotgesprek',toggle:'Oplossingen submenu',orion:'Uw klantvragenlijsten, ingevuld vanuit uw eigen documenten.',overview:'Sneller werken met AI en automatisering'},fr:{primary:['Accueil','Solutions','À propos'],children:['Orion','Automatisation des workflows','Cohérence'],work:'Planifier un entretien pilote',toggle:'Solutions sous-menu',orion:'Vos questionnaires clients, remplis à partir de vos propres documents.',overview:'Travailler plus vite avec l’IA et l’automatisation'}};
async function seed(page,lang='nl'){await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},lang)}
async function activate(locator,info){if(info.project.use.isMobile)await locator.tap();else await locator.click()}
async function openMenu(page,info){if(await page.locator('#burger').isVisible()&&!await page.locator('#navlist').isVisible())await activate(page.locator('#burger'),info)}
for(const [lang,text]of Object.entries(copy))test('Home, the Oplossingen group, Over and the pilot action route correctly in '+lang,async({page},info)=>{
 await seed(page,lang);await page.goto('/index.html');await openMenu(page,info);
 await expect(page.locator('#navlist a.l:not(.nav-work)')).toHaveText(text.primary);
 await expect(page.locator('#navlist .nav-work')).toHaveAccessibleName(text.work);await expect(page.locator('#navlist .nav-work')).toHaveAttribute('href',PILOT);
 await expect(page.locator('#navlist .nav-toggle')).toHaveCount(1);await expect(page.locator('#navlist .nav-toggle')).toHaveAccessibleName(text.toggle);
 await expect(page.locator('#navlist [aria-current]')).toHaveCount(1);await expect(page.locator('#navlist a.l[href="index.html"]')).toHaveAttribute('aria-current','page');
 await expect(page.locator('.nav .brand')).toHaveAttribute('href','index.html');
 if(await page.locator('.nav').evaluate(e=>e.classList.contains('open')))await expect.poll(()=>page.locator('.nav').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');else{await expect(page.locator('html')).toHaveClass(/nav-over/);await expect.poll(()=>page.locator('#navlist .nav-parent>a.l').first().evaluate(e=>getComputedStyle(e).color)).toBe('rgb(255, 255, 255)');}
 const toggle=page.locator('[aria-controls="nav-oplossingen"]');await activate(toggle,info);await expect(toggle).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('#nav-oplossingen a')).toHaveText(text.children);
 const orion=page.locator('#nav-oplossingen a[href="orion.html"]');await expect(orion).toBeInViewport();await activate(orion,info);
 await expect(page).toHaveURL(/\/orion\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',lang);await expect(page.locator('h1')).toHaveText(text.orion);
 await expect(page.locator('#nav-oplossingen a[href="orion.html"]')).toHaveAttribute('aria-current','page');await expect(page.locator('#navlist a.l[href="oplossingen.html"]')).toHaveClass(/\bcur\b/);
 await expect(page.locator('#navlist [aria-current]')).toHaveCount(1);
 await openMenu(page,info);await activate(page.locator('#navlist a.l[href="oplossingen.html"]'),info);
 await expect(page).toHaveURL(/\/oplossingen\.html$/);await expect(page.locator('h1')).toHaveText(text.overview);await expect(page.locator('#navlist a.l[href="oplossingen.html"]')).toHaveAttribute('aria-current','page');
 await openMenu(page,info);await activate(page.locator('[aria-controls="nav-oplossingen"]'),info);await activate(page.locator('#nav-oplossingen a[href="automatisering.html"]'),info);
 await expect(page).toHaveURL(/\/automatisering\.html$/);await expect(page.locator('#nav-oplossingen a[href="automatisering.html"]')).toHaveAttribute('aria-current','page');await expect(page.locator('#navlist a.l[href="oplossingen.html"]')).toHaveClass(/\bcur\b/);
 await expect(page.locator('a[href="veiligheid.html"]')).toHaveCount(0);
 await activate(page.locator('.nav .brand'),info);await expect(page).toHaveURL(/\/index\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',lang);
});
test('disclosure keyboard focus, Escape, outside click and language choice close predictably',async({page},info)=>{
 await seed(page);await page.goto('/index.html');await openMenu(page,info);
 const toggle=page.locator('[aria-controls="nav-oplossingen"]'),submenu=page.locator('#nav-oplossingen');
 await toggle.focus();await page.keyboard.press('Enter');await expect(submenu).toBeVisible();await page.keyboard.press('Tab');await expect(page.locator('#nav-oplossingen a').first()).toBeFocused();
 await page.keyboard.press('Escape');await expect(submenu).toBeHidden();await expect(toggle).toBeFocused();
 await page.keyboard.press('Space');await expect(submenu).toBeVisible();await page.keyboard.press('Space');await expect(submenu).toBeHidden();
 await page.keyboard.press('Enter');await expect(submenu).toBeVisible();
 await page.locator('#lang-btn-top').click();await expect(submenu).toBeHidden();await page.locator('.lang-top [data-lang="fr"]').click();await expect(page.locator('html')).toHaveAttribute('lang','fr');
 await openMenu(page,info);await toggle.click();await expect(submenu).toBeVisible();await expect(page.locator('#nav-oplossingen a[href="automatisering.html"]')).toHaveText('Automatisation des workflows');
 await page.mouse.click(4,page.viewportSize().height-4);await expect(submenu).toBeHidden();
 if(await page.locator('#burger').isVisible()){await openMenu(page,info);await page.keyboard.press('Escape');await expect(page.locator('#navlist')).toBeHidden();await expect(page.locator('#burger')).toBeFocused()}
});
test('resizing keeps the same ordered menu with a single final pilot action on mobile and desktop',async({page})=>{
 await seed(page,'fr');await page.setViewportSize({width:1440,height:900});await page.goto('/index.html');
 await expect(page.locator('#burger')).toBeHidden();await expect(page.locator('#navlist >li').last()).toHaveClass('nav-action');await expect(page.locator('#navlist >li')).toHaveCount(4);
 for(const link of await page.locator('#navlist a.l').all())await expect(link).toBeInViewport();
 await page.locator('[aria-controls="nav-oplossingen"]').click();await page.setViewportSize({width:320,height:568});await expect(page.locator('#burger')).toBeVisible();await page.locator('#burger').click();
 await expect(page.locator('#navlist >li').last()).toHaveClass('nav-action');await expect(page.locator('#navlist .nav-work')).toHaveCount(1);await expect(page.locator('#nav-oplossingen')).toBeHidden();
 await page.locator('html').evaluate(e=>e.style.fontSize='200%');await page.locator('#navlist .nav-work').scrollIntoViewIfNeeded();await expect(page.locator('#navlist .nav-work')).toBeInViewport();await page.locator('html').evaluate(e=>e.style.fontSize='');await page.locator('[aria-controls="nav-oplossingen"]').scrollIntoViewIfNeeded();
 await page.locator('[aria-controls="nav-oplossingen"]').click();const box=await page.locator('#nav-oplossingen').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(321);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.setViewportSize({width:1440,height:900});await expect(page.locator('#navlist >li').last()).toHaveClass('nav-action');await expect(page.locator('#nav-oplossingen')).toBeHidden();await expect(page.locator('#burger')).toHaveAttribute('aria-expanded','false');
});
for(const reducedMotion of ['no-preference','reduce'])test('overview pages retain the grouped routes without JavaScript and '+reducedMotion+' motion',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,reducedMotion,viewport:{width:390,height:844}});const page=await context.newPage();try{
 await page.goto(baseURL+'/index.html');await expect(page.locator('main')).toHaveCSS('visibility','visible');await expect(page.locator('#navlist a[href="oplossingen.html"]')).toBeVisible();await page.locator('#navlist a[href="oplossingen.html"]').click();
 await expect(page).toHaveURL(/\/oplossingen\.html$/);await expect(page.locator('main')).toHaveCSS('visibility','visible');await expect(page.locator('.topic-links a')).toHaveCount(3);await page.locator('.topic-links a[href="orion.html"]').click();await expect(page).toHaveURL(/\/orion\.html$/);
 // Coherence for kmo's (23 Nov 2026): Coherentie has no topic links; value.html stays a published route.
 await page.goto(baseURL+'/coherence.html');await expect(page.locator('.topic-links')).toHaveCount(0);expect((await page.request.get(baseURL+'/value.html')).status()).toBe(200);
 await page.goto(baseURL+'/approach.html');await expect(page.locator('main')).toHaveCSS('visibility','visible');await expect(page.locator('.topic-links a[href="eca.html"]')).toBeVisible();await page.locator('.topic-links a[href="eca.html"]').click();await expect(page).toHaveURL(/\/eca\.html$/);
 }finally{await context.close()}
});

// Executive Radar left the menu; its URL keeps working and its logo return preserves the language.
for(const lang of ['nl','fr'])test('Executive Radar stays reachable outside the menu and logo return preserves '+lang,async({page},info)=>{
 await seed(page,lang);await page.goto('/index.html');await openMenu(page,info);await expect(page.locator('#navlist a.l')).toHaveText([...copy[lang].primary,copy[lang].work+' →']);await expect(page.locator('#navlist a[href^="executive-radar"]')).toHaveCount(0);
 await page.goto('/executive-radar/?lang='+lang);await expect(page.locator('html')).toHaveAttribute('lang',lang+'-BE');await expect(page.locator('.product-identity > strong')).toContainText('Executive Radar');await page.locator('.site-header .identity').click();await expect(page).toHaveURL(new RegExp('/index.html[?]lang='+lang));await expect(page.locator('html')).toHaveAttribute('lang',lang);
});
