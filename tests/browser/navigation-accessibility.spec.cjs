const {test,expect}=require('playwright/test');const AxeBuilder=require('@axe-core/playwright').default;
for(const lang of ['nl','fr'])test('expanded navigation has accessible labels, contrast and targets in '+lang,async({page},info)=>{
 await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},lang);await page.goto('/index.html');
 if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
 for(const id of ['nav-coherence','nav-approach']){
  await page.locator('[aria-controls="'+id+'"]').click();await expect(page.locator('#'+id)).toBeVisible();
  const result=await new AxeBuilder({page}).include('.nav').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();await info.attach(id+'-'+lang,{body:JSON.stringify(result,null,2),contentType:'application/json'});expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
});

test('opening the mobile menu changes text colours without low-contrast intermediate frames',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/index.html');
 await page.locator('#burger').click();
 const frames=await page.locator('#navlist a.cur').evaluate(async e=>{
  const frames=[];
  for(let n=0;n<5;n++){
   frames.push({colour:getComputedStyle(e).color,transition:getComputedStyle(e).transitionDuration});
   await new Promise(requestAnimationFrame);
  }
  return frames;
 });
 for(const frame of frames){expect(frame.transition).toBe('0s');expect(frame.colour).toBe('rgb(0, 106, 156)')}
});

test('header logo variants load at low priority and reuse their actual HTTP cache across background changes',async({page})=>{
 const requests=[];page.on('request',request=>{const file=new URL(request.url()).pathname;if(file==='/img/grow-faster-logo-light.svg'||file==='/img/grow-faster-logo-dark.svg')requests.push(file)});
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/index.html');await expect(page.locator('html')).toHaveClass(/nav-over/);
 const onDark=page.locator('.nav .gf-wordmark-dark'),onLight=page.locator('.nav .gf-wordmark-light');
 for(const logo of [onDark,onLight]){await expect(logo).toHaveAttribute('loading','lazy');await expect(logo).toHaveAttribute('decoding','async');await expect(logo).toHaveAttribute('fetchpriority','low');await expect(logo).toHaveAttribute('width','1920');await expect(logo).toHaveAttribute('height','320')}
 await expect(onDark).toBeVisible();await expect.poll(()=>onDark.evaluate(e=>e.complete&&e.naturalWidth===1920&&e.naturalHeight===320)).toBe(true);
 // Desktop may paint the initial white header before deferred site.js applies nav-over.
 // Both native requests are low priority; the initial navy variant may load once, then must reuse its HTTP cache.
 await expect(onLight).toBeHidden();expect(requests.filter(file=>file==='/img/grow-faster-logo-light.svg').length).toBeLessThanOrEqual(1);expect(requests.filter(file=>file==='/img/grow-faster-logo-dark.svg')).toHaveLength(1);
 if(await page.locator('#burger').isVisible())await page.locator('#burger').click();else await page.locator('footer.foot').scrollIntoViewIfNeeded();
 await expect(page.locator('html')).not.toHaveClass(/nav-over/);await expect(onLight).toBeVisible();await expect.poll(()=>onLight.evaluate(e=>e.complete&&e.naturalWidth===1920&&e.naturalHeight===320)).toBe(true);
 await expect(onDark).toBeHidden();expect(requests.filter(file=>file==='/img/grow-faster-logo-light.svg')).toHaveLength(1);
});
