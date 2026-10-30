const {test,expect}=require('playwright/test');
test('practice reading route works in three languages, with six perspectives and Contact',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{if(!localStorage.getItem('avs-lang'))localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/index.html');await page.locator('.hero-grid a[href="transformation.html"]').click();
 await expect(page).toHaveURL(/\/transformation\.html$/);
 for(const [language,heading,lens,title]of [['nl','Transformatie in de praktijk','Strategie en keuzes','Bedrijfstransformatie in de praktijk | Erlend Hollebosch'],['fr','La transformation en pratique','Stratégie et choix','La transformation des entreprises en pratique | Erlend Hollebosch'],['en','Transformation in practice','Strategy and choices','Business Transformation in Practice | Erlend Hollebosch']]){
   if(language!=='nl'){await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+language+'"]').click()}
   await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('h1')).toHaveText(heading);
   await expect(page.locator('.practice-questions dt')).toHaveCount(6);
   await expect(page.locator('.practice-questions dd')).toHaveCount(6);
   await expect(page.locator('.practice-questions dt').first()).toHaveText(lens);await expect(page).toHaveTitle(title);
   expect(await page.locator('meta[name="description"]').getAttribute('content')).not.toBe('');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
 }
 await page.locator('.practice-index a[href="#working-chain"]').click();await expect(page).toHaveURL(/#working-chain$/);
 await expect(page.locator('#working-chain-h')).toBeInViewport();
 await page.goto('/about.html');await expect(page.locator('main a[href="transformation.html"]')).toHaveCount(1);
 await page.goto('/insights.html');await page.locator('.practice-entry a[href="transformation.html"]').click();await expect(page.locator('h1')).toHaveText('Transformation in practice');
 if(await page.locator('#burger').isVisible())await page.locator('#burger').click();await page.locator('#navlist a[href="about.html"]').click();
 await expect(page).toHaveURL(/\/about\.html$/);await expect(page.locator('.au-photo')).toBeInViewport();
 expect(errors).toEqual([]);
});

test('manuscript vision links AI, coherence, credited Ross sources and the manuscript request',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}));if(!localStorage.getItem('avs-lang'))localStorage.setItem('avs-lang','nl')});
 await page.goto('/index.html');await expect(page.locator('h1')).toContainText('Ontwerp voor samenhang.');
 await page.locator('.hero-grid a[href="coherence.html#book-thesis"]').click();
 await expect(page.locator('#book-thesis-h')).toBeInViewport();
 for(const [language,title]of [['nl','Een snellere taak maakt nog geen betere onderneming'],['fr','Une tâche plus rapide ne suffit pas à améliorer l’entreprise'],['en','A faster task is not automatically a better enterprise']]){
   if(language!=='nl'){await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+language+'"]').click()}
   await expect(page.locator('#book-thesis-h')).toHaveText(title);
   await expect(page.locator('#book-thesis')).toContainText('Jeanne Ross');
   await expect(page.locator('#book-thesis .book-sources a')).toHaveCount(2);
   await expect(page.locator('#book-thesis .book-sources a').first()).toHaveAttribute('href','https://cisr.mit.edu/publication/2016_0401_DigitalDesign_RossSebastianBeath');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.locator('#book-thesis .book-reading').click();await expect(page).toHaveURL(/\/about\.html#book$/);
 await expect(page.locator('#book')).toBeInViewport();
 const request=page.locator('a[data-mail*="full%20manuscript"]');await expect(request).toHaveCount(1);await expect(request).toHaveAttribute('href',/^mailto:/);
 const message=new URL(await request.getAttribute('href'));expect(message.pathname).toBe('erlendhollebosch@gmail.com');expect(message.searchParams.get('subject')).toContain('full manuscript');expect(message.searchParams.get('body')).toContain('I would like to receive the full manuscript');
 await expect(page.locator('#intellectual-foundation')).toContainText('Jeanne Ross');
});

test('executive contact presents identity and working contact and book actions in three languages',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('avs-lang'))localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/about.html');
 for(const [language,eyebrow]of [['nl','Perspectieven op bedrijfstransformatie'],['fr','Perspectives sur la transformation des entreprises'],['en','Perspectives on enterprise transformation']]){
   if(language!=='nl'){await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+language+'"]').click()}
   await expect(page.locator('h1')).toHaveText('Erlend Hollebosch');await expect(page.locator('.executive-eyebrow')).toHaveText(eyebrow);
   await expect(page.locator('.executive-portrait img')).toBeVisible();expect(await page.locator('.executive-portrait img').evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.locator('.executive-hero a[href="#contact"]').click();await expect(page.locator('#contact h2')).toBeInViewport();
 const email=page.locator('#contact a[data-mail]');await expect(email).toHaveAttribute('href',/^mailto:/);const message=new URL(await email.getAttribute('href'));expect(message.searchParams.get('subject')).toBe('Enterprise coherence and transformation');
 await page.goto('/about.html');await page.locator('.executive-book-link').click();await expect(page.locator('#book')).toBeInViewport();
 await expect(page.locator('a[href="books/the-coherent-enterprise-executive-preview.pdf"]')).toBeVisible();
 if(await page.locator('#burger').isVisible())await page.locator('#burger').click();await page.locator('#navlist a[href="about.html"]').click();await expect(page).toHaveURL(/\/about\.html$/);await expect(page.locator('h1')).toBeInViewport();
});

test('initialise the scorecard and decision matrix once in the saved language and update on language change',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}));window.scorecardRenders=0;window.matrixRenders=0;new MutationObserver(records=>{for(const record of records)if(record.type==='childList'){if(record.target.id==='dg-rows')window.scorecardRenders++;if(record.target.id==='quad')window.matrixRenders++}}).observe(document,{childList:true,subtree:true})});
 await page.goto('/approach.html');await expect(page.locator('#dg-rows .dg-row')).toHaveCount(8);await expect(page.locator('#dg-rows')).toContainText('Strategisch');expect(await page.evaluate(()=>window.scorecardRenders)).toBe(1);expect(await page.evaluate(()=>window.matrixRenders)).toBe(1);
 await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();await expect(page.locator('#dg-rows')).toContainText('Stratégique');expect(await page.evaluate(()=>window.scorecardRenders)).toBe(2);expect(await page.evaluate(()=>window.matrixRenders)).toBe(2);
});
