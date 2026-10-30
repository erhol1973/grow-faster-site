const {test,expect}=require('playwright/test'),{createCacheServer}=require('../support/cache-server.cjs');
test('old markup with current scripts loads required modules and normalizes menu Contact',async({page},info)=>{
  const fixture=createCacheServer();await new Promise(r=>fixture.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+fixture.server.address().port;
  try{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}));window.addEventListener('pageshow',e=>window.__restored=e.persisted)});
    const response=await page.goto(base+'/index.html');
    // Check the HTTP body, before runtime recovery adds the missing modules.
    const markup=await response.text();
    expect(markup).not.toMatch(/<script\b[^>]*\bsrc=["']assets\/(?:models|consent)\.js/i);
    expect(markup).toContain('href="about.html#contact">Contact</a>');
    await expect.poll(()=>page.evaluate(()=>!!window.GFModels&&!!window.GFConsent)).toBe(true);
    for(const name of ['models','consent'])await expect(page.locator(`script[src^="assets/${name}.js"]`)).toHaveCount(1);
    const link=page.locator('.nav .nav-cta');if(!await link.isVisible())await page.locator('#burger').click();await expect(link).toHaveAttribute('href','about.html');await link.click();await expect(page).toHaveURL(base+'/about.html');await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(8);expect(errors).toEqual([]);
    await info.attach('cache-requests',{body:JSON.stringify(fixture.requests,null,2),contentType:'application/json'});
  }finally{await page.close();fixture.server.closeAllConnections();await new Promise(r=>fixture.server.close(r))}
});
test('HTTP revalidation and Back Forward restore remain functional across a release',async({page},info)=>{
  const fixture=createCacheServer();await new Promise(r=>fixture.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+fixture.server.address().port;
  try{
    await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}));window.addEventListener('pageshow',e=>window.__restored=e.persisted)});
    const first=await page.goto(base+'/insights.html');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-fixture-release','1');
    // Reload may bypass caching in WebKit. Exercise HTTP validation explicitly,
    // and retain automatic cache behaviour in the request evidence.
    const etag=first.headers().etag;
    const validation=await page.evaluate(async tag=>(await fetch(location.href,{cache:'no-store',headers:{'If-None-Match':tag}})).status,etag);
    expect(validation).toBe(304);expect(fixture.requests.some(r=>r.file==='insights.html'&&r.conditional===etag)).toBe(true);
    fixture.publish();await page.reload();await expect(page.locator('html')).toHaveAttribute('data-fixture-release','2');
    const contact=page.locator('.nav .nav-cta');if(!await contact.isVisible())await page.locator('#burger').click();await contact.click();await page.goBack();await expect(page.locator('#ai-pilot')).toBeVisible();
    const restored=await page.evaluate(()=>window.__restored===true);await info.attach('cache-evidence',{body:JSON.stringify({restoredFromBFCache:restored,requests:fixture.requests},null,2),contentType:'application/json'});
  }finally{await page.close();fixture.server.closeAllConnections();await new Promise(r=>fixture.server.close(r))}
});
