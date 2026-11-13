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

test('header logo variants load at low priority and reuse native loaded images across background changes',async({page})=>{
 const requests=[];page.on('request',request=>{const file=new URL(request.url()).pathname;if(file==='/img/grow-faster-logo-light.svg'||file==='/img/grow-faster-logo-dark.svg')requests.push(file)});
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/index.html');await expect(page.locator('html')).toHaveClass(/nav-over/);
 const onDark=page.locator('.nav .gf-wordmark-dark'),onLight=page.locator('.nav .gf-wordmark-light');
 for(const logo of [onDark,onLight]){await expect(logo).toHaveAttribute('loading','lazy');await expect(logo).toHaveAttribute('decoding','async');await expect(logo).toHaveAttribute('fetchpriority','low');await expect(logo).toHaveAttribute('width','1920');await expect(logo).toHaveAttribute('height','320')}
 await expect(onDark).toBeVisible();await expect.poll(()=>onDark.evaluate(e=>e.complete&&e.naturalWidth===1920&&e.naturalHeight===320)).toBe(true);
 // Desktop may paint the initial white header before deferred site.js applies nav-over.
 // Both native requests are low priority; the initial navy variant may load once, then must reuse its already loaded native image.
 await expect(onLight).toBeHidden();expect(requests.filter(file=>file==='/img/grow-faster-logo-light.svg').length).toBeLessThanOrEqual(1);expect(requests.filter(file=>file==='/img/grow-faster-logo-dark.svg')).toHaveLength(1);
 if(await page.locator('#burger').isVisible())await page.locator('#burger').click();else await page.locator('footer.foot').scrollIntoViewIfNeeded();
 await expect(page.locator('html')).not.toHaveClass(/nav-over/);await expect(onLight).toBeVisible();await expect.poll(()=>onLight.evaluate(e=>e.complete&&e.naturalWidth===1920&&e.naturalHeight===320)).toBe(true);
 await expect(onDark).toBeHidden();expect(requests.filter(file=>file==='/img/grow-faster-logo-light.svg')).toHaveLength(1);
});

test('home responsive hero preloads the selected AVIF once and preserves WebP fallback',async({page},info)=>{
 await page.setViewportSize({width:info.project.use.isMobile?390:1440,height:900});
 const requests=[];page.on('request',request=>{if(/\/img\/hero-executive-meeting-\d+\.(?:avif|webp)$/.test(new URL(request.url()).pathname))requests.push(request.url())});
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});await page.goto('/index.html');
 const image=page.locator('#hero .hero-bg picture img'),source=page.locator('#hero .hero-bg picture source[type="image/avif"]'),preload=page.locator('head link[rel=preload][as=image]');
 await expect(preload).toHaveCount(1);await expect(preload).toHaveAttribute('type','image/avif');await expect(preload).toHaveAttribute('fetchpriority','high');await expect(preload).toHaveAttribute('imagesrcset',await source.getAttribute('srcset'));await expect(preload).toHaveAttribute('imagesizes',await source.getAttribute('sizes'));
 await expect.poll(()=>image.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
 const result=await image.evaluate(e=>({currentSrc:e.currentSrc,pixels:innerWidth*devicePixelRatio,entries:performance.getEntriesByName(e.currentSrc).map(x=>({initiatorType:x.initiatorType,transferSize:x.transferSize}))}));
 const candidate=[640,1280,1774].find(width=>width>=result.pixels)||1774;expect(new URL(result.currentSrc).pathname).toBe('/img/hero-executive-meeting-'+candidate+'.avif');
 await expect(page.locator('#hero .hero-bg picture source[type="image/webp"]')).toHaveAttribute('srcset','img/hero-executive-meeting-640.webp 640w, img/hero-executive-meeting-1280.webp 1280w, img/hero-executive-meeting-1774.webp 1774w');
 await expect(image).toHaveAttribute('src','img/hero-executive-meeting-1774.webp');await expect(image).toHaveAttribute('width','1774');await expect(image).toHaveAttribute('height','887');
 expect(requests).toEqual([result.currentSrc]);expect(result.entries).toHaveLength(1);expect(result.entries[0].initiatorType).toBe('link');
});


test('the existing deferred translation request receives high network priority exactly once',async({page})=>{
 const client=await page.context().newCDPSession(page);await client.send('Network.enable');
 const dictionaries=[];
 client.on('Network.requestWillBeSent',event=>{if(new URL(event.request.url).pathname==='/assets/i18n.js')dictionaries.push(event.request.initialPriority)});
 await page.addInitScript(()=>{
  localStorage.setItem('avs-lang','fr');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));
  window.translationEvents=[];
  document.addEventListener('gf:language',event=>window.translationEvents.push({language:event.detail.language,loaded:typeof window.I18N==='object'}));
 });
 await page.goto('/index.html');await expect(page.locator('html')).toHaveClass(/i18n-ready/);
 expect(dictionaries).toEqual(['High']);
 const scripts=await page.locator('script[src]').evaluateAll(elements=>elements.map(script=>({src:new URL(script.src).pathname,defer:script.defer,priority:script.fetchPriority})));
 const translation=scripts.filter(script=>script.src==='/assets/i18n.js');expect(translation).toEqual([{src:'/assets/i18n.js',defer:true,priority:'high'}]);
 expect(scripts.findIndex(script=>script.src==='/assets/i18n.js')).toBeLessThan(scripts.findIndex(script=>script.src==='/assets/site.js'));
 expect(await page.evaluate(()=>window.translationEvents)).toContainEqual({language:'fr',loaded:true});
 await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page.locator('#hero h1')).toBeVisible();
 await client.detach();
});
