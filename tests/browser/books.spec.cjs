const {test,expect}=require('playwright/test');
const fs=require('node:fs'),crypto=require('node:crypto');
const publication=require('../book-publication.json');
const copy={en:{menu:'Books',download:'Read the executive preview',access:'Available as hardcover, softcover and e-book. Buy the full book →'},nl:{menu:'Boeken',download:'Lees de executive preview',access:'Verkrijgbaar als hardcover, softcover en e-book. Koop het volledige boek →'},fr:{menu:'Livres',download:'Lire l’aperçu pour les dirigeants',access:'Disponible en version reliée, brochée et numérique. Acheter le livre complet →'}};
for(const [language,text]of Object.entries(copy))test('free book download and workshop reading route in '+language,async({page},info)=>{
 const errors=[],external=[],pdfs=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/hubspot|hsforms|goatcounter|fonts\.google/i.test(r.url()))external.push(r.url());if(r.url().includes(publication.file))pdfs.push(r.url())});
 await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},language);
 await page.goto('/index.html');if(await page.locator('#burger').isVisible())await page.locator('#burger').click();await page.locator('[aria-controls="nav-coherence"]').click();const book=page.locator('#nav-coherence a[href="books.html"]');await expect(book).toHaveText(text.menu);await book.click();
 await expect(page).toHaveURL(/\/books\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('#nav-coherence a[href="books.html"]')).toHaveAttribute('aria-current','page');
 const feature=page.locator('#design-for-coherence');await expect(feature.locator('h2')).toHaveText(publication.title);await expect(feature.locator('.books-subtitle')).toHaveText(publication.subtitle);await expect(feature.locator('.books-access')).toHaveText(text.access);await expect(feature.locator('form,input')).toHaveCount(0);await expect(feature.locator('.books-meta')).toContainText(language==='nl'?'Online flipbook · preview van 22':language==='fr'?'Livre feuilletable en ligne':'Online flipbook · 22-page preview');
 const typography=await feature.evaluate(el=>({title:parseFloat(getComputedStyle(el.querySelector('h2 cite')).fontSize),label:parseFloat(getComputedStyle(el.querySelector('.eyebrow')).fontSize)}));expect(typography.title).toBeGreaterThan(typography.label);
 expect(pdfs,'The PDF must not load before the visitor chooses the download').toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await expect(feature.locator('.book-download')).toContainText(text.download);await expect(feature.locator('.book-download')).toHaveAttribute('href','boek/index.html');await expect(feature.locator('.book-download')).toHaveAttribute('target','_blank');const bytes=await (await page.request.get('/'+publication.file)).body();expect(bytes.length).toBe(publication.bytes);expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(publication.sha256);
 await page.locator('.books-workshop a').click();await expect(page).toHaveURL(/\/workshop\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('h1')).toBeVisible();
 expect(errors).toEqual([]);expect(external,'Rejecting optional services must still allow the full download').toEqual([]);
});
test('the new full book remains downloadable without JavaScript and the first book retains its request route',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844},acceptDownloads:true});const page=await context.newPage();try{
 await page.goto('http://127.0.0.1:4173/books.html');await expect(page.locator('.book-download')).toBeVisible();await expect(page.locator('.book-download')).toHaveAttribute('href','boek/index.html');await expect(page.locator('#order .order-card')).toHaveCount(3);await expect(page.locator('.book-download')).toHaveAttribute('target','_blank');
 await page.locator('#the-coherent-enterprise a[href="about.html#foundation-book"]').click();await expect(page.locator('#foundation-book')).toBeInViewport();await expect(page.locator('a[data-mail*="full%20manuscript"]')).toHaveCount(1);
 }finally{await context.close()}
});
