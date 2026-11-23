const {test,expect}=require('playwright/test');
test('practice reading route works in both languages, with six perspectives and Contact',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{if(!localStorage.getItem('avs-lang'))localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 // Release 1.1: About no longer links the practice route; Insights keeps the in-content link to it.
 await page.goto('/insights.html');await page.locator('.practice-entry a[href="transformation.html"]').click();
 await expect(page).toHaveURL(/\/transformation\.html$/);
 for(const [language,heading,lens,title]of [['nl','Transformatie in de praktijk','Strategie en keuzes','Trackrecord in bedrijfstransformatie | Erlend Hollebosch'],['fr','La transformation en pratique','Stratégie et choix','Parcours en transformation d’entreprise | Erlend Hollebosch']]){
   if(language!=='nl'){await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+language+'"]').click()}
   await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('h1')).toHaveText(heading);
   await expect(page.locator('.practice-questions dt')).toHaveCount(6);
   await expect(page.locator('.practice-questions dd')).toHaveCount(6);
   await expect(page.locator('.practice-questions dt').first()).toHaveText(lens);await expect(page).toHaveTitle(title);
   expect(await page.locator('meta[name="description"]').getAttribute('content')).not.toBe('');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   // Sprint 1: Track record left the customer menu, so no menu item is current on this page.
   await expect(page.locator('#navlist [aria-current="page"]')).toHaveCount(0);await expect(page.locator('#navlist a[href="transformation.html"]')).toHaveCount(0);
   await expect(page.locator('#track-record .career-list li')).toHaveCount(5);
 }
 await page.locator('.practice-index a[href="#working-chain"]').click();await expect(page).toHaveURL(/#working-chain$/);
 await expect(page.locator('#working-chain-h')).toBeInViewport();
 await page.goto('/about.html');await expect(page.locator('a[href^="transformation.html"]')).toHaveCount(0);
 await page.goto('/insights.html');await page.locator('.practice-entry a[href="transformation.html"]').click();await expect(page.locator('h1')).toHaveText('La transformation en pratique');
 if(await page.locator('#burger').isVisible())await page.locator('#burger').click();await page.locator('#navlist a[href="about.html"]').click();
 await expect(page).toHaveURL(/\/about\.html$/);await expect(page.locator('.au-photo')).toBeInViewport();
 expect(errors).toEqual([]);
});

// Release 1.1: the book-thesis route starts on Coherence; its book link now opens the book on Books (About no longer shows books).
test('manuscript vision links AI, coherence, credited Ross sources and the book on Books',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));if(!localStorage.getItem('avs-lang'))localStorage.setItem('avs-lang','nl')});
 await page.goto('/coherence.html#book-thesis');
 await expect(page.locator('#book-thesis-h')).toBeInViewport();
 for(const [language,title]of [['nl','Een snellere taak maakt nog geen betere onderneming'],['fr','Une tâche plus rapide ne suffit pas à améliorer l’entreprise']]){
   if(language!=='nl'){await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+language+'"]').click()}
   await expect(page.locator('#book-thesis-h')).toHaveText(title);
   await expect(page.locator('#book-thesis')).toContainText('Jeanne Ross');
   await expect(page.locator('#book-thesis .book-sources a')).toHaveCount(2);
   await expect(page.locator('#book-thesis .book-sources a').first()).toHaveAttribute('href','https://cisr.mit.edu/publication/2016_0401_DigitalDesign_RossSebastianBeath');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.locator('#book-thesis .book-reading').click();await expect(page).toHaveURL(/\/books\.html#the-coherent-enterprise$/);
 await expect(page.locator('#the-coherent-enterprise')).toBeInViewport();
 const order=page.locator('#order-coherent-enterprise a.ebook-order');await expect(order).toHaveCount(1);
 const message=new URL(await order.getAttribute('href'));expect(message.pathname).toBe('erlendhollebosch@gmail.com');expect(message.searchParams.get('subject')).toContain('The Coherent Enterprise');
});

// Release 1.1: About presents the founder of Grow Faster to customers (portrait, approach, contact), without books or work routes.
test('customer About presents identity, portrait and a working contact block in both languages',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('avs-lang'))localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/about.html');
 for(const [language,heading,how,contact]of [['nl','Erlend Hollebosch, oprichter van Grow Faster','Hoe ik werk','Laten we kennismaken'],['fr','Erlend Hollebosch, fondateur de Grow Faster','Ma façon de travailler','Faisons connaissance']]){
   if(language!=='nl'){await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+language+'"]').click()}
   await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('h1')).toHaveText(heading);
   await expect(page.locator('#werkwijze h2')).toHaveText(how);await expect(page.locator('#werkwijze .vcard')).toHaveCount(3);await expect(page.locator('#contact h2')).toHaveText(contact);
   await expect(page.locator('.executive-portrait img')).toBeVisible();expect(await page.locator('.executive-portrait img').evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
   await expect(page.locator('.executive-portrait img')).toHaveAttribute('alt',language==='nl'?'Portret van Erlend Hollebosch':'Portrait d’Erlend Hollebosch');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await expect(page.locator('#work-with-me, #route-role, .publication-feature, a[href^="books.html"], a[href^="boek/"]')).toHaveCount(0);
 await page.goto('/about.html#contact');await expect(page.locator('#contact')).toBeInViewport();
 await expect(page.locator('#contact-pilot')).toHaveAttribute('href','mailto:erlendhollebosch@gmail.com?subject=Pilot%20Orion');await expect(page.locator('#contact-linkedin')).toHaveAttribute('href','https://www.linkedin.com/in/erlend-hollebosch-053361181/');
 await page.locator('#oplossingen a[href="oplossingen.html"]').click();await expect(page).toHaveURL(/\/oplossingen\.html$/);
 await page.goto('/about.html');if(await page.locator('#burger').isVisible())await page.locator('#burger').click();await page.locator('#navlist a[href="about.html"]').click();await expect(page).toHaveURL(/\/about\.html$/);await expect(page.locator('h1')).toBeInViewport();
});

test('initialise the scorecard and decision matrix once in the saved language and update on language change',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));window.scorecardRenders=0;window.matrixRenders=0;new MutationObserver(records=>{for(const record of records)if(record.type==='childList'){if(record.target.id==='dg-rows')window.scorecardRenders++;if(record.target.id==='quad')window.matrixRenders++}}).observe(document,{childList:true,subtree:true})});
 await page.goto('/approach.html');await expect(page.locator('#dg-rows .dg-row')).toHaveCount(8);await expect(page.locator('#dg-rows')).toContainText('Strategisch');expect(await page.evaluate(()=>window.scorecardRenders)).toBe(1);expect(await page.evaluate(()=>window.matrixRenders)).toBe(1);
 await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();await expect(page.locator('#dg-rows')).toContainText('Stratégique');expect(await page.evaluate(()=>window.scorecardRenders)).toBe(2);expect(await page.evaluate(()=>window.matrixRenders)).toBe(2);
});
test('cross-page fragment landing shows its target as soon as the page is translated and keeps it after load',async({page})=>{
 // Regression for Firefox CI (PR #94): after books.html#the-coherent-enterprise was opened from Coherence, Firefox ended
 // out of view of the target: main is hidden and untranslated while the browser applies the fragment, and the browser's
 // own (smooth) fragment scroll is left to the end of loading. The page is held between translation and load here
 // (ux.js, the deferred script after site.js, delayed), so the target must already be in view when main is revealed.
 await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));localStorage.setItem('avs-lang','fr')});
 await page.route(/\/assets\/ux\.js/,async route=>{await new Promise(r=>setTimeout(r,1500));await route.continue()});
 await page.goto('/books.html#the-coherent-enterprise',{waitUntil:'commit'});await expect(page.locator('html')).toHaveClass(/i18n-ready/);
 // Measured once, without polling, while loading is still held: a retrying assertion would wait for the browser's late scroll.
 const early=await page.evaluate(()=>{const r=document.getElementById('the-coherent-enterprise').getBoundingClientRect();return {state:document.readyState,visible:r.bottom>0&&r.top<innerHeight}});
 expect(early).toEqual({state:'interactive',visible:true});
 await page.waitForLoadState('load');await expect(page.locator('#the-coherent-enterprise')).toBeInViewport();
});
