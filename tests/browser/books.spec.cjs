const {test,expect}=require('playwright/test');
const fs=require('node:fs'),crypto=require('node:crypto');
const publication=require('../book-publication.json');
const copy={nl:{menu:'Boeken',coherence:'Coherentie',download:'Lees de executive preview'},fr:{menu:'Livres',coherence:'Cohérence',download:'Lire l’aperçu pour les dirigeants'}};
for(const [language,text]of Object.entries(copy))test('free book download and workshop reading route in '+language,async({page},info)=>{
 const errors=[],external=[],pdfs=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/hubspot|hsforms|goatcounter|fonts\.google/i.test(r.url()))external.push(r.url());if(r.url().includes(publication.file))pdfs.push(r.url())});
 await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},language);
 // Sprint 1 v2: Books is reached through Oplossingen ▸ Coherentie and the Coherence overview's topic links.
 await page.goto('/index.html');if(await page.locator('#burger').isVisible())await page.locator('#burger').click();await page.locator('[aria-controls="nav-oplossingen"]').click();const coherence=page.locator('#nav-oplossingen a[href="coherence.html"]');await expect(coherence).toHaveText(text.coherence);await coherence.click();
 await expect(page).toHaveURL(/\/coherence\.html$/);const book=page.locator('.topic-links a[href="books.html"]');await expect(book).toHaveText(text.menu);await book.click();
 await expect(page).toHaveURL(/\/books\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('#navlist a.l[href="oplossingen.html"]')).toHaveClass(/\bcur\b/);
 const feature=page.locator('#design-for-coherence');await expect(feature.locator('h2')).toHaveText(publication.title);await expect(feature.locator('.books-subtitle')).toHaveText(publication.subtitle);await expect(feature.locator('.book-actions a')).toHaveCount(2);await expect(feature.locator('form,input')).toHaveCount(0);await expect(feature.locator('.books-meta')).toContainText(language==='nl'?'Online flipbook · preview van 22':'Livre feuilletable en ligne');
 const typography=await feature.evaluate(el=>({title:parseFloat(getComputedStyle(el.querySelector('h2 cite')).fontSize),label:parseFloat(getComputedStyle(el.querySelector('.eyebrow')).fontSize)}));expect(typography.title).toBeGreaterThan(typography.label);
 expect(pdfs,'The PDF must not load before the visitor chooses the download').toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await expect(feature.locator('.book-download')).toContainText(text.download);await expect(feature.locator('.book-download')).toHaveAttribute('href','boek/index.html');await expect(feature.locator('.book-download')).toHaveAttribute('target','_blank');const bytes=await (await page.request.get('/'+publication.file)).body();expect(bytes.length).toBe(publication.bytes);expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(publication.sha256);
 for (const [id,title] of [['the-coherent-enterprise','The Coherent Enterprise'],['design-for-coherence',publication.title]]) {
   const row=page.locator('#'+id);
   await expect(row.locator('h2')).toHaveText(title);
   await expect(row.locator('.book-actions .primary')).toHaveText(new RegExp(text.download));
   const button=row.locator('.book-actions .ghost');
   await expect(button).toHaveAccessibleName(language==='nl'?/Bestel het e-book/:/Commander le livre numérique/);
   const message=new URL(await button.getAttribute('href'));
   expect(message.protocol).toBe('mailto:');
   expect(message.searchParams.get('subject')).toBe((language==='nl'?'Bestelling':'Commande')+' – '+title+' (e-book)');
   expect(message.searchParams.get('body')).toContain(title);
 }
 await page.locator('.books-workshop a').click();await expect(page).toHaveURL(/\/workshop\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('h1')).toBeVisible();
 expect(errors).toEqual([]);expect(external,'Rejecting optional services must still allow the full download').toEqual([]);
});
test('the new full book remains downloadable without JavaScript and the first book retains its request route',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844},acceptDownloads:true});const page=await context.newPage();try{
 await page.goto('http://127.0.0.1:4173/books.html');await expect(page.locator('.book-download')).toBeVisible();await expect(page.locator('.book-download')).toHaveAttribute('href','boek/index.html');await expect(page.locator('.book-actions a[data-mail]')).toHaveCount(2);await expect(page.locator('.book-download')).toHaveAttribute('target','_blank');
 await page.goto('http://127.0.0.1:4173/books.html#order-coherent-enterprise');await expect(page.locator('#order-coherent-enterprise')).toBeInViewport();await expect(page.locator('#order-coherent-enterprise a[data-mail]')).toHaveAttribute('href',/^mailto:/);// Release 1.1: About no longer presents the books; the manuscript route is the e-book order on Books (checked above).
 await page.goto('http://127.0.0.1:4173/about.html');await expect(page.locator('#foundation-book, a[href^="books.html"]')).toHaveCount(0);
 }finally{await context.close()}
});
