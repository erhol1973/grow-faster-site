const {test,expect}=require('playwright/test');
test('home preview opens the delivered reader, flips, enlarges and reaches its final page',async({page,context,isMobile})=>{
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','en');localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/index.html');const popupPromise=context.waitForEvent('page');await page.locator('#design-for-coherence .book-download').click();const reader=await popupPromise;
 const errors=[];reader.on('pageerror',e=>errors.push(e.message));await reader.waitForLoadState();await expect(reader).toHaveURL(/\/boek\/index.html$/);await expect(reader.locator('#loader')).toHaveCount(0);await expect(reader.locator('html')).toHaveAttribute('lang','en');
 await expect(reader.locator('#book')).toHaveAttribute('data-orientation',isMobile?'portrait':'landscape');
 await expect(reader.locator('#prev')).toBeDisabled();await reader.locator('#next').click();await expect(reader.locator('#pageInfo')).not.toHaveText('1 / 26');
 await reader.locator('#zoomButton').click();await expect(reader.locator('#zoom')).toHaveClass(/open/);await expect(reader.locator('#zoomInner img').first()).toBeVisible();await reader.keyboard.press('Escape');await expect(reader.locator('#zoom')).not.toHaveClass(/open/);await expect(reader.locator('#zoomButton')).toBeFocused();
 expect(await reader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await reader.goto('/boek/index.html?p=26');await expect(reader.locator('#loader')).toHaveCount(0);await expect(reader.locator('#pageInfo')).toHaveText('26 / 26');await expect(reader.locator('#next')).toBeDisabled();await expect(reader.locator('.buy')).toHaveAttribute('href','../books.html#order');expect(errors).toEqual([]);
});
test('reader works without external services and retains pages when its script is unavailable',async({page})=>{
 const external=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173/'))external.push(r.url())});
 await page.route('**/page-flip-2.0.7.js',r=>r.abort());await page.goto('/boek/index.html');await expect(page.locator('#fallback')).toHaveAttribute('open','');await expect(page.locator('#fallback img')).toHaveCount(26);await expect(page.locator('#loader')).toHaveCount(0);expect(external).toEqual([]);
});
test('reader controls follow Dutch and French preferences and remain accessible when enlarged',async({page})=>{
 const AxeBuilder=require('@axe-core/playwright').default;
 for(const [lang,label]of [['nl','Vergroot pagina'],['fr','Agrandir la page']]){
  await page.goto('/boek/index.html');await page.evaluate(l=>localStorage.setItem('avs-lang',l),lang);await page.reload();await expect(page.locator('#loader')).toHaveCount(0);await expect(page.locator('html')).toHaveAttribute('lang',lang);await expect(page.locator('#zoomButton')).toHaveText(label);
  let result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();expect(result.violations.map(v=>v.id)).toEqual([]);
  await page.locator('#zoomButton').click();result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();expect(result.violations.map(v=>v.id)).toEqual([]);await page.keyboard.press('Escape');
 }
});
test('the supplied pages remain readable without JavaScript',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false});try{const page=await context.newPage();await page.goto(baseURL+'/boek/index.html');await page.locator('#fallback summary').click();await expect(page.locator('#fallback img').first()).toBeVisible();await expect(page.locator('#fallback img')).toHaveCount(26);await expect(page.locator('.loader')).not.toBeVisible()}finally{await context.close()}
});
