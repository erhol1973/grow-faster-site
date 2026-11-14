const {test,expect}=require('playwright/test');
const fs=require('node:fs'),crypto=require('node:crypto');
const publication=require('../book-publication.json');
const copy={nl:{menu:'Boeken',download:'Lees de executive preview'},fr:{menu:'Livres',download:'Lire l’aperçu pour les dirigeants'}};
for(const [language,text]of Object.entries(copy))test('free book download and workshop reading route in '+language,async({page},info)=>{
 const errors=[],external=[],pdfs=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/hubspot|hsforms|goatcounter|fonts\.google/i.test(r.url()))external.push(r.url());if(r.url().includes(publication.file))pdfs.push(r.url())});
 await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},language);
 await page.goto('/index.html');if(await page.locator('#burger').isVisible())await page.locator('#burger').click();await page.locator('[aria-controls="nav-coherence"]').click();const book=page.locator('#nav-coherence a[href="books.html"]');await expect(book).toHaveText(text.menu);await book.click();
 await expect(page).toHaveURL(/\/books\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('#nav-coherence a[href="books.html"]')).toHaveAttribute('aria-current','page');
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
 await page.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:4173')+'/books.html');await expect(page.locator('.book-download')).toBeVisible();await expect(page.locator('.book-download')).toHaveAttribute('href','boek/index.html');await expect(page.locator('.book-actions a[data-mail]')).toHaveCount(2);await expect(page.locator('.book-download')).toHaveAttribute('target','_blank');
 await page.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:4173')+'/books.html#order-coherent-enterprise');await expect(page.locator('#order-coherent-enterprise')).toBeInViewport();await expect(page.locator('#order-coherent-enterprise a[data-mail]')).toHaveAttribute('href',/^mailto:/);await page.goto((process.env.TEST_BASE_URL||'http://127.0.0.1:4173')+'/about.html#foundation-book');await expect(page.locator('#foundation-book')).toBeInViewport();await expect(page.locator('#foundation-book a[data-mail]')).toHaveCount(1); // the separate full-manuscript card was removed from About on request
 }finally{await context.close()}
});

test('the first lazy book cover retains low request priority instead of competing with initial text',async({browser,browserName},info)=>{
 const {createServer}=require('../../scripts/server.cjs'),server=createServer({cmsTestMode:true,compress:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port,results=[];
 try{
  // CDP exposes the real native priority; other engines still verify the shipped
  // hint, successful decoding and untouched second cover without a skipped test.
  for(const variant of browserName==='chromium'?['default-control','shipped-low']:['shipped-low']){
   const context=await browser.newContext({viewport:{width:412,height:1600},deviceScaleFactor:1.75,...(browserName==='chromium'?{isMobile:true}:{})});
   try{
    const page=await context.newPage(),priorities=[],ids=new Set();
    if(browserName==='chromium'){
     const session=await context.newCDPSession(page);await session.send('Network.enable');await session.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:209715,uploadThroughput:65536,connectionType:'cellular3g'});await session.send('Emulation.setCPUThrottlingRate',{rate:4});
     session.on('Network.requestWillBeSent',event=>{if(new URL(event.request.url).pathname==='/img/design-for-coherence-book-600.webp'){ids.add(event.requestId);priorities.push(event.request.initialPriority);}});
     session.on('Network.resourceChangedPriority',event=>{if(ids.has(event.requestId))priorities.push(event.newPriority);});
    }
    if(variant==='default-control')await page.route('**/books.html',async route=>{const response=await route.fetch();const body=(await response.text()).replace(/<img\b[^>]*data-cms="fc3a07aae55df-0"[^>]*>/,tag=>tag.replace(/\sfetchpriority="low"/,''));await route.fulfill({response,body});});
    await page.goto(origin+'/books.html');const image=page.locator('#design-for-coherence .publication-cover img');await image.evaluate(element=>element.decode());
    const state=await image.evaluate(element=>({src:new URL(element.currentSrc).pathname,width:element.naturalWidth,height:element.naturalHeight,loading:element.loading,hint:element.getAttribute('fetchpriority'),visibleWidth:element.getBoundingClientRect().width}));
    expect(state.width).toBeGreaterThan(0);expect(state.height).toBeGreaterThan(0);expect(state.loading).toBe('lazy');expect(state.visibleWidth).toBe(180);
    await expect(page.locator('#the-coherent-enterprise .publication-cover img')).not.toHaveAttribute('fetchpriority');
    if(variant==='default-control'){expect(state.hint).toBe(null);expect(priorities).toContain('High');}
    else{expect(state.hint).toBe('low');if(browserName==='chromium'){expect(priorities.length).toBeGreaterThan(0);expect(priorities.every(priority=>priority==='Low')).toBe(true);}}
    results.push({variant,state,priorities});
   }finally{await context.close();}
  }
  if(browserName==='chromium'){expect(results[1].state.src).toBe(results[0].state.src);expect(results[1].state.width).toBe(results[0].state.width);expect(results[1].state.height).toBe(results[0].state.height);}
  await info.attach('native-book-cover-priority',{body:JSON.stringify(results,null,2),contentType:'application/json'});
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
