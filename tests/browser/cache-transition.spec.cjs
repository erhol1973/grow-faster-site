const {test,expect}=require('playwright/test'),{createCacheServer}=require('../support/cache-server.cjs');
test('revalidated typography HTML bypasses warm old component assets and executes the new diagram geometry',async({page},info)=>{
  const fixture=createCacheServer({typographyTransition:true});await new Promise(r=>fixture.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+fixture.server.address().port;
  try{
    await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));localStorage.setItem('avs-lang','nl');});
    await page.goto(base+'/process.html');await expect.poll(()=>page.evaluate(()=>window.__cachedTypographyFixture)).toBe('old');
    const oldURL='/assets/site.js?v=legacy-typography-fixture';
    // Reuse the same classic-script request context; WebKit may partition a
    // fetch() response separately from a script resource with the same URL.
    await page.evaluate(url=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=()=>{script.remove();resolve()};script.onerror=()=>reject(Error('Cached script failed to load'));document.head.append(script)}),oldURL);
    expect(fixture.requests.filter(request=>request.url===oldURL)).toHaveLength(1);
    fixture.publish();await page.goto(base+'/process.html?release=2');
    await expect(page.locator('html')).toHaveAttribute('data-fixture-release','2');
    await expect(page.locator('#bpmn-a .bp-n.task:not(.small):not(.tall) rect').first()).toHaveAttribute('height','82');
    await expect(page.locator('body')).toHaveCSS('font-size','17px');
    const family=await page.locator('body').evaluate(el=>getComputedStyle(el).fontFamily);
    const normalize=value=>value.replace(/["'\s]/g,'').toLowerCase();expect(normalize(family)).toBe(normalize(require('../typography-contract.json').family));
    expect(await page.evaluate(()=>window.__cachedTypographyFixture)).toBeUndefined();
    const current=fixture.requests.filter(request=>request.version===2&&request.file==='assets/site.js');
    expect(current.some(request=>request.url==='/assets/site.js?v=20261113-typography')).toBe(true);
    expect(fixture.requests.filter(request=>request.url===oldURL)).toHaveLength(1);
  }finally{try{await info.attach('typography-cache-requests',{body:JSON.stringify({previousAssetBytes:'synthetic cache marker; current assets are the real tested build',requests:fixture.requests},null,2),contentType:'application/json'})}finally{await page.close();fixture.server.closeAllConnections();await new Promise(r=>fixture.server.close(r))}}
});
test('old markup with current scripts loads required modules and normalizes menu Contact',async({page},info)=>{
  const fixture=createCacheServer();await new Promise(r=>fixture.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+fixture.server.address().port;
  try{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));window.addEventListener('pageshow',e=>window.__restored=e.persisted)});
    const response=await page.goto(base+'/index.html');
    // Check the HTTP body, before runtime recovery adds the missing modules.
    const markup=await response.text();
    expect(markup).not.toMatch(/<script\b[^>]*\bsrc=["']assets\/(?:models|consent)\.js/i);
    expect(markup).toContain('href="about.html#contact">Contact</a>');
    await expect.poll(()=>page.evaluate(()=>!!window.GFModels&&!!window.GFConsent)).toBe(true);
    for(const name of ['models','consent'])await expect(page.locator(`script[src^="assets/${name}.js"]`)).toHaveCount(1);
    const link=page.locator('.nav .nav-cta');if(!await link.isVisible()){await expect(page.locator('#burger')).toBeInViewport();await page.locator('#burger').click();}await expect(link).toHaveAttribute('href','about.html');await link.click();await expect(page).toHaveURL(base+'/about.html');await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(8);expect(errors).toEqual([]);
    await info.attach('cache-requests',{body:JSON.stringify(fixture.requests,null,2),contentType:'application/json'});
  }finally{await page.close();fixture.server.closeAllConnections();await new Promise(r=>fixture.server.close(r))}
});
test('HTTP revalidation and Back Forward restore remain functional across a release',async({page},info)=>{
  const fixture=createCacheServer();await new Promise(r=>fixture.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+fixture.server.address().port;
  try{
    await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));window.addEventListener('pageshow',e=>window.__restored=e.persisted)});
    const first=await page.goto(base+'/insights.html');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-fixture-release','1');
    // Reload may bypass caching in WebKit. Exercise HTTP validation explicitly,
    // and retain automatic cache behaviour in the request evidence.
    const etag=first.headers().etag;
    const validation=await page.evaluate(async tag=>(await fetch(location.href,{cache:'no-store',headers:{'If-None-Match':tag}})).status,etag);
    expect(validation).toBe(304);expect(fixture.requests.some(r=>r.file==='insights.html'&&r.conditional===etag)).toBe(true);
    fixture.publish();await page.reload();await expect(page.locator('html')).toHaveAttribute('data-fixture-release','2');
    const contact=page.locator('.nav a[href="about.html"]');if(!await contact.isVisible())await page.locator('#burger').click();await contact.click();await page.goBack();await expect(page.locator('#ai-pilot')).toBeVisible();
    const restored=await page.evaluate(()=>window.__restored===true);await info.attach('cache-evidence',{body:JSON.stringify({restoredFromBFCache:restored,requests:fixture.requests},null,2),contentType:'application/json'});
  }finally{await page.close();fixture.server.closeAllConnections();await new Promise(r=>fixture.server.close(r))}
});
