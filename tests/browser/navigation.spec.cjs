const {test,expect}=require('playwright/test');
const copy={en:{primary:['Home','Enterprise Coherence','Approach','Insights','About Erlend'],workshop:'Workshop',value:'AI & business value',eca:'Coherence assessment (ECA)'},nl:{primary:['Home','Enterprise Coherence','Aanpak','Inzichten','Over Erlend'],workshop:'Werksessie',value:'AI & bedrijfswaarde',eca:'Coherentiescan (ECA)'},fr:{primary:['Accueil','Enterprise Coherence','Approche','Analyses','À propos d’Erlend'],workshop:'Atelier',value:'IA & valeur métier',eca:'Diagnostic de cohérence (ECA)'}};
async function seed(page,lang='nl'){await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}))},lang)}
async function activate(locator,info){if(info.project.use.isMobile)await locator.tap();else await locator.click()}
async function openMenu(page,info){if(await page.locator('#burger').isVisible()&&!await page.locator('#navlist').isVisible())await activate(page.locator('#burger'),info)}
for(const [lang,text]of Object.entries(copy))test('Home plus four navigation categories, grouped depth and direct ECA route in '+lang,async({page},info)=>{
 await seed(page,lang);await page.goto('/index.html');await openMenu(page,info);
 await expect(page.locator('#navlist a.l:not(.nav-workshop)')).toHaveText(text.primary);
 await expect(page.locator('#navlist .nav-workshop')).toHaveAccessibleName(text.workshop);
 await expect(page.locator('.nav .brand')).toHaveAttribute('href','index.html');
 expect(await page.locator('.nav').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(255, 255, 255)');
 const toggle=page.locator('[aria-controls="nav-coherence"]');await activate(toggle,info);await expect(toggle).toHaveAttribute('aria-expanded','true');
 const value=page.locator('#nav-coherence a[href="value.html"]');await expect(value).toHaveText(text.value);await activate(value,info);
 await expect(page).toHaveURL(/\/value\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',lang);
 await expect(page.locator('#nav-coherence a[href="value.html"]')).toHaveAttribute('aria-current','page');await expect(page.locator('#navlist a.l[href="coherence.html"]')).toHaveClass(/\bcur\b/);
 await activate(page.locator('.nav .brand'),info);await expect(page).toHaveURL(/\/index\.html$/);await openMenu(page,info);
 await activate(page.locator('[aria-controls="nav-coherence"]'),info);await activate(page.locator('[aria-controls="nav-approach"]'),info);await expect(page.locator('#nav-coherence')).toBeHidden();
 const eca=page.locator('#nav-approach a[href="eca.html"]');await expect(eca).toHaveText(text.eca);await expect(eca).toBeInViewport();await activate(eca,info);
 await expect(page).toHaveURL(/\/eca\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',lang);await expect(page.locator('#assessment')).toBeVisible();
});
test('disclosure keyboard focus, Escape, outside click and language choice close predictably',async({page},info)=>{
 await seed(page);await page.goto('/index.html');await openMenu(page,info);
 const coherence=page.locator('[aria-controls="nav-coherence"]'),approach=page.locator('[aria-controls="nav-approach"]');
 await coherence.focus();await page.keyboard.press('Enter');await expect(page.locator('#nav-coherence')).toBeVisible();await page.keyboard.press('Tab');await expect(page.locator('#nav-coherence a').first()).toBeFocused();
 await page.keyboard.press('Escape');await expect(page.locator('#nav-coherence')).toBeHidden();await expect(coherence).toBeFocused();
 await page.keyboard.press('Space');await expect(page.locator('#nav-coherence')).toBeVisible();await approach.focus();await page.keyboard.press('Enter');await expect(page.locator('#nav-coherence')).toBeHidden();await expect(page.locator('#nav-approach')).toBeVisible();
 await page.locator('#lang-btn-top').click();await expect(page.locator('#nav-approach')).toBeHidden();await page.locator('.lang-top [data-lang="en"]').click();
 await openMenu(page,info);await coherence.click();await page.mouse.click(4,page.viewportSize().height-4);await expect(page.locator('#nav-coherence')).toBeHidden();
 if(await page.locator('#burger').isVisible()){await openMenu(page,info);await page.keyboard.press('Escape');await expect(page.locator('#navlist')).toBeHidden();await expect(page.locator('#burger')).toBeFocused()}
});
test('resizing keeps a single workshop action first on mobile and restores desktop order',async({page})=>{
 await seed(page,'fr');await page.setViewportSize({width:1440,height:900});await page.goto('/index.html');
 await expect(page.locator('#burger')).toBeHidden();await expect(page.locator('#navlist >li').last()).toHaveClass('nav-action');
 await page.locator('[aria-controls="nav-coherence"]').click();await page.setViewportSize({width:320,height:568});await expect(page.locator('#burger')).toBeVisible();await page.locator('#burger').click();
 await expect(page.locator('#navlist >li').first()).toHaveClass('nav-action');await expect(page.locator('#navlist .nav-workshop')).toHaveCount(1);await expect(page.locator('#nav-coherence')).toBeHidden();
 await page.locator('[aria-controls="nav-approach"]').click();const box=await page.locator('#nav-approach').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(321);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.setViewportSize({width:1440,height:900});await expect(page.locator('#navlist >li').last()).toHaveClass('nav-action');await expect(page.locator('#nav-approach')).toBeHidden();await expect(page.locator('#burger')).toHaveAttribute('aria-expanded','false');
});
test('overview pages retain the grouped reading routes without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await context.newPage();try{
 await page.goto('http://127.0.0.1:4173/index.html');await expect(page.locator('#navlist a[href="coherence.html"]')).toBeVisible();await page.locator('#navlist a[href="coherence.html"]').click();
 await expect(page.locator('.topic-links a')).toHaveCount(4);await page.locator('.topic-links a[href="value.html"]').click();await expect(page).toHaveURL(/\/value\.html$/);
 await page.locator('.nav .brand').click();await page.locator('#navlist a[href="approach.html"]').click();await expect(page.locator('.topic-links a[href="eca.html"]')).toBeVisible();
 }finally{await context.close()}
});
