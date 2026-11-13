const {test,expect}=require('playwright/test');

test('The Coherent Enterprise buttons on Books and About open the 12-page HTML flipbook',async({page,context,isMobile})=>{
 const manifest=require('../coherent-preview.json'),crypto=require('node:crypto');
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));localStorage.setItem('flip:hinted','1');localStorage.setItem('flip:mobilehint','1')});
 for(const source of ['/books.html','/about.html']){
  await page.goto(source);const button=page.locator('a[href="boek/the-coherent-enterprise/index.html"]').first();await expect(button).toBeVisible();
  const popup=context.waitForEvent('page');await button.click();const reader=await popup;const errors=[];reader.on('pageerror',e=>errors.push(e.message));await reader.waitForLoadState();
  await expect(reader).toHaveURL(/\/boek\/the-coherent-enterprise\/index.html(#page-\d+)?$/);await reader.goto('/boek/the-coherent-enterprise/index.html#page-1');await reader.reload();
  await expect(reader.locator('#book .page')).toHaveCount(12);await expect(reader.locator('#pgNow')).toHaveText('1');await expect(reader.locator('#pgAll')).toHaveText('12');
  await reader.locator('#btnNext').click();await expect(reader.locator('#pgNow')).toHaveText(isMobile?'2':'2–3');
  await reader.locator('#btnSearch').click();await reader.locator('#q').fill('fragmentation');await reader.locator('#results .result[data-go="7"]').click();await expect(reader.locator('#pgNow')).toContainText('7');
  await expect(reader.locator('.order-link')).toHaveAttribute('href','../../about.html#foundation-book');
  expect(await reader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
  const AxeBuilder=require('@axe-core/playwright').default;const result=await new AxeBuilder({page:reader}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();expect(result.violations.map(v=>v.id)).toEqual([]);
  await reader.close();
 }
 const response=await page.request.get('/'+manifest.file);expect(response.status()).toBe(200);expect(crypto.createHash('sha256').update(await response.body()).digest('hex')).toBe(manifest.sha256);
 for(const [name,sha]of Object.entries(manifest.flipbookPdfs)){const r=await page.request.get('/boek/the-coherent-enterprise/pdf/'+name);expect(r.status()).toBe(200);expect(crypto.createHash('sha256').update(await r.body()).digest('hex')).toBe(sha)}
});

test('The Coherent Enterprise flipbook keeps every page readable if the flip library fails',async({page})=>{
 const external=[];page.on('request',r=>{if(!r.url().startsWith(((process.env.TEST_BASE_URL||'http://127.0.0.1:4173')+'/')))external.push(r.url())});
 await page.addInitScript(()=>{localStorage.setItem('flip:hinted','1');localStorage.setItem('flip:mobilehint','1')});
 await page.route('**/page-flip-2.0.7.js',r=>r.abort());await page.goto('/boek/the-coherent-enterprise/index.html#page-1');await expect(page.locator('#pgNow')).toHaveText('1');
 await page.locator('#btnNext').click();await expect(page.locator('#pgNow')).toHaveText('2');await expect(page.locator('#book .page[data-p="2"]')).toBeVisible();expect(external).toEqual([]);
});

test('home preview opens the HTML flipbook, flips, searches and reaches its final page',async({page,context,isMobile})=>{
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));localStorage.setItem('flip:hinted','1');localStorage.setItem('flip:mobilehint','1')});
 await page.goto('/index.html');const popupPromise=context.waitForEvent('page');await page.locator('#design-for-coherence .book-download').click();const reader=await popupPromise;
 const errors=[];reader.on('pageerror',e=>errors.push(e.message));await reader.waitForLoadState();await expect(reader).toHaveURL(/\/boek\/index.html(#page-1)?$/);await expect(reader.locator('html')).toHaveAttribute('lang','en');
 await expect(reader.locator('#book .page')).toHaveCount(22);await expect(reader.locator('#pgNow')).toHaveText('1');await expect(reader.locator('#pgAll')).toHaveText('22');
 await reader.locator('#btnNext').click();await expect(reader.locator('#pgNow')).toHaveText(isMobile?'2':'2–3');
 expect(await reader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await reader.locator('#btnSearch').click();await reader.locator('#q').fill('heatmap');await expect(reader.locator('#results .result').first()).toBeVisible();
 await reader.locator('#results .result[data-go="16"]').click();await expect(reader.locator('#pgNow')).toContainText('16');
 await reader.locator('#btnText').click();await expect(reader.locator('#textview')).toBeVisible();await expect(reader.locator('#textview .tv-page')).toHaveCount(22);await reader.locator('#btnText').click();await expect(reader.locator('#textview')).toBeHidden();
 await reader.goto('/boek/index.html#page-22');await reader.reload();await expect(reader.locator('#pgNow')).toHaveText('22');await expect(reader.locator('.order-link')).toHaveAttribute('href','../books.html#order');expect(errors).toEqual([]);
 const AxeBuilder=require('@axe-core/playwright').default;const result=await new AxeBuilder({page:reader}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();expect(result.violations.map(v=>v.id)).toEqual([]);
});
test('flipbook works without external services and keeps every page readable when its script is unavailable',async({page})=>{
 const external=[];page.on('request',r=>{if(!r.url().startsWith(((process.env.TEST_BASE_URL||'http://127.0.0.1:4173')+'/')))external.push(r.url())});
 await page.addInitScript(()=>{localStorage.setItem('flip:hinted','1');localStorage.setItem('flip:mobilehint','1')});
 await page.route('**/page-flip-2.0.7.js',r=>r.abort());await page.goto('/boek/index.html#page-1');await expect(page.locator('#pgNow')).toHaveText('1');
 await page.locator('#btnNext').click();await expect(page.locator('#pgNow')).toHaveText('2');await expect(page.locator('#book .page[data-p="2"]')).toBeVisible();expect(external).toEqual([]);
});
test('flipbook offers the full preview, the executive summary and the current chapter as PDF downloads',async({page,isMobile})=>{
 test.skip(isMobile,'Download events are verified on desktop profiles');
 const manifest=require('../book-reader-pdfs.json'),crypto=require('node:crypto');
 await page.addInitScript(()=>{localStorage.setItem('flip:hinted','1')});await page.goto('/boek/index.html#page-9');await expect(page.locator('#pgNow')).toContainText('9');
 await page.locator('#btnDownload').click();const chapterId=(await page.locator('#dlChapName').textContent()).match(/Chapter (\d\d)/)[1];await page.keyboard.press('Escape');await expect(page.locator('#popDownload')).toBeHidden();
 for(const [kind,file]of [['full','turning-ai-potential-executive-preview.pdf'],['summary','executive-summary.pdf'],['chapter','chapter-'+chapterId+'.pdf']]){
  await page.locator('#btnDownload').click();await expect(page.locator('#popDownload')).toHaveClass(/open/);const wait=page.waitForEvent('download');await page.locator('[data-dl="'+kind+'"]').click();const download=await wait;await expect(page.locator('#popDownload')).toBeHidden();
  const response=await page.request.get('/boek/pdf/'+file);expect(response.status()).toBe(200);expect(crypto.createHash('sha256').update(await response.body()).digest('hex')).toBe(manifest[file]);expect(download.url().endsWith('/boek/pdf/'+file)).toBe(true);
 }
});
test('the flipbook explains the PDF alternative without JavaScript',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false});try{const page=await context.newPage();await page.goto(baseURL+'/boek/index.html');await expect(page.locator('.noscript')).toBeVisible();await expect(page.locator('.noscript a').first()).toHaveAttribute('href','pdf/turning-ai-potential-executive-preview.pdf')}finally{await context.close()}
});
