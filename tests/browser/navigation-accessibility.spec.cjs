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


test('critical component styles are inline and the existing deferred dictionary loads once',async({page})=>{
 const requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));
 await page.route('**/assets/cms-config.js*',route=>route.fulfill({contentType:'application/javascript',body:'window.GF_CMS_CONFIG={url:"https://gqsvoioccvklzfmdmexy.supabase.co",key:"sb_publishable_fixture"};'}));
 await page.route('https://gqsvoioccvklzfmdmexy.supabase.co/**',route=>route.fulfill({contentType:'application/json',body:'[]',headers:{'access-control-allow-origin':'*'}}));
 await page.addInitScript(()=>{
  localStorage.setItem('avs-lang','fr');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));
  window.translationEvents=[];
  document.addEventListener('gf:language',event=>window.translationEvents.push({language:event.detail.language,loaded:typeof window.I18N==='object'}));
 });
 await page.goto('/index.html');await expect(page.locator('html')).toHaveClass(/i18n-ready/);
 expect(requests.filter(path=>path==='/assets/i18n.js')).toHaveLength(1);
 expect(requests.filter(path=>/^\/assets\/(navigation|home-hero|books|journal)\.css$/.test(path))).toEqual([]);
 await expect(page.locator('style[data-gf-component-style]')).toHaveCount(4);
 const scripts=await page.locator('script[src]').evaluateAll(elements=>elements.map(script=>({src:new URL(script.src).pathname,defer:script.defer})));
 expect(scripts.filter(script=>script.src==='/assets/i18n.js')).toEqual([{src:'/assets/i18n.js',defer:true}]);
 expect(scripts.findIndex(script=>script.src==='/assets/i18n.js')).toBeLessThan(scripts.findIndex(script=>script.src==='/assets/site.js'));
 expect(await page.evaluate(()=>window.translationEvents)).toContainEqual({language:'fr',loaded:true});
 await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page.locator('#hero h1')).toBeVisible();
});

for(const route of ['coherence.html','insights.html'])test(route+' preloads the original responsive hero exactly once',async({page},info)=>{
 await page.setViewportSize({width:info.project.use.isMobile?390:1440,height:900});
 const requests=[];page.on('request',request=>{if(/\/img\/hero-\d+\.webp$/.test(new URL(request.url()).pathname))requests.push(request.url())});
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/'+route);
 const image=page.locator('.hero-bg picture img');await expect.poll(()=>image.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
 const result=await image.evaluate(e=>({src:e.currentSrc,mobile:innerWidth<=600,pixels:innerWidth*devicePixelRatio,entries:performance.getEntriesByName(e.currentSrc).map(x=>x.initiatorType)}));
 const width=result.mobile?640:([640,1280,1920,2400].find(w=>w>=result.pixels)||2400);
 expect(new URL(result.src).pathname).toBe('/img/hero-'+width+'.webp');expect(requests).toEqual([result.src]);expect(result.entries).toEqual(['link']);
 const preloads=await page.locator('head link[rel=preload][as=image]').evaluateAll(els=>els.filter(e=>matchMedia(e.media).matches).map(e=>({type:e.type,priority:e.fetchPriority})));
 expect(preloads).toEqual([{type:'image/webp',priority:'high'}]);
 if(route==='coherence.html'){
  await expect(page.locator('link[href="assets/coherence-film.css"]')).toHaveCount(0);
  await expect(page.locator('style[data-gf-component-style="assets/coherence-film.css"]')).toHaveCount(1);
 }
});
test('About preloads one selected AVIF portrait and keeps its JPEG fallback geometry',async({page},info)=>{
 await page.setViewportSize({width:info.project.use.isMobile?390:1440,height:900});
 const requests=[];page.on('request',request=>{if(/\/img\/author-retouched-\d+\.(avif|jpg)$/.test(new URL(request.url()).pathname))requests.push(request.url())});
 await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});await page.goto('/about.html');
 const image=page.locator('img[data-cms="f9e1d98ca6f92-0"]');await expect.poll(()=>image.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
 const src=await image.evaluate(e=>e.currentSrc);expect(src).toMatch(/author-retouched-(400|720)\.avif$/);expect(requests).toEqual([src]);
 const preload=page.locator('head link[rel=preload][as=image]');const source=page.locator('picture:has(img[data-cms="f9e1d98ca6f92-0"]) source[type="image/avif"]');
 await expect(preload).toHaveAttribute('type','image/avif');await expect(preload).toHaveAttribute('imagesrcset',await source.getAttribute('srcset'));await expect(preload).toHaveAttribute('imagesizes',await source.getAttribute('sizes'));
 await expect(image).toHaveAttribute('src','img/author-retouched-720.jpg');await expect(image).toHaveAttribute('width','720');await expect(image).toHaveAttribute('height','900');
 await expect(page.locator('picture:has(img[data-cms="f9e1d98ca6f92-0"]) source[type="image/jpeg"]')).toHaveCount(1);
});
test('a published CMS portrait replaces all fixed AVIF and JPEG picture sources',async({page})=>{
 const base='https://gqsvoioccvklzfmdmexy.supabase.co';const object='00000000-0000-4000-8000-000000000099.jpg';
 await page.route('**/assets/cms-config.js*',route=>route.fulfill({contentType:'application/javascript',body:'window.GF_CMS_CONFIG={url:'+JSON.stringify(base)+',key:"public-test-key"};'}));
 await page.route(base+'/**',async route=>{
  const request=route.request(),url=new URL(request.url());const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'};
  const json=data=>route.fulfill({contentType:'application/json',headers,body:JSON.stringify(data)});
  if(request.method()==='OPTIONS')return json({});
  if(url.pathname==='/rest/v1/cms_publications')return json([{content:{settings:{fields:{'f9e1d98ca6f92-0':{type:'media',path:object,alt:{nl:'CMS-testportret',fr:'Portrait test CMS'}}}}}}]);
  if(request.method()==='POST'&&url.pathname==='/storage/v1/object/sign/cms-media/'+object)return json({signedURL:'/object/sign/cms-media/'+object+'?token=synthetic'});
  if(url.pathname==='/storage/v1/object/sign/cms-media/'+object)return route.fulfill({body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#f03a6d"/><circle cx="200" cy="250" r="100" fill="#10457a"/></svg>',contentType:'image/svg+xml',headers});
  return route.fulfill({status:400,headers,body:'Unexpected fixture request'});
 });
 await page.goto('/about.html?lang=nl');const image=page.locator('img[data-cms="f9e1d98ca6f92-0"]');
 await expect(image).toHaveAttribute('src',base+'/storage/v1/object/sign/cms-media/'+object+'?token=synthetic');await expect(image).toHaveAttribute('alt','CMS-testportret');await expect.poll(()=>image.evaluate(e=>({complete:e.complete,decoded:e.naturalWidth>0&&e.naturalHeight>0,aspect:e.naturalWidth/e.naturalHeight,current:e.currentSrc,sources:e.closest('picture').querySelectorAll('source').length}))).toEqual({complete:true,decoded:true,aspect:0.8,current:base+'/storage/v1/object/sign/cms-media/'+object+'?token=synthetic',sources:0});
 await image.evaluate(e=>e.decode());await expect(image).toBeVisible();
 // Responsive candidates can retain a density-corrected natural size. An independent
 // decoder proves the unique replacement fixture's intrinsic pixel geometry.
 expect(await image.evaluate(async e=>{const probe=new Image();probe.src=e.currentSrc;await probe.decode();return [probe.naturalWidth,probe.naturalHeight];})).toEqual([400,500]);
 await expect(page.locator('picture:has(img[data-cms="f9e1d98ca6f92-0"]) source')).toHaveCount(0);
});

for(const language of ['nl','fr'])test('bundled member navigation has no extra request and keeps '+language+' account links',async({page})=>{
 const requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));
 await page.route('**/assets/cms-config.js*',route=>route.fulfill({contentType:'application/javascript',body:'window.GF_CMS_CONFIG={url:"https://gqsvoioccvklzfmdmexy.supabase.co",key:"sb_publishable_fixture"};'}));
 await page.route('https://gqsvoioccvklzfmdmexy.supabase.co/**',route=>route.fulfill({contentType:'application/json',body:'[]',headers:{'access-control-allow-origin':'*'}}));
 await page.addInitScript(()=>{let value;window.memberBoots=0;Object.defineProperty(window,'GFMember',{configurable:true,get:()=>value,set:next=>{window.memberBoots++;value=next}});document.addEventListener('DOMContentLoaded',()=>{window.memberAtDOM=!!window.GFMember});});
 await page.goto('/about.html?lang='+language);
 const link=page.locator('.member-nav .member-login-link');await expect(link).toHaveText(language==='fr'?'Se connecter':'Aanmelden');
 await expect(page.locator('[data-member-placeholder]')).toHaveCount(0);await expect(page.locator('.member-nav')).toHaveCount(1);
 const result=await link.evaluate(element=>({href:element.href,boots:window.memberBoots,atDOM:window.memberAtDOM,available:window.GFMember.available,url:window.GF_CMS_CONFIG.url}));
 expect(new URL(result.href).searchParams.get('lang')).toBe(language);expect(result.boots).toBe(1);expect(result.atDOM).toBe(false);expect(result.available).toBe(true);expect(result.url).toBe('https://gqsvoioccvklzfmdmexy.supabase.co');
 expect(requests.filter(path=>path==='/assets/member-menu.js')).toHaveLength(0);expect(requests.filter(path=>path==='/assets/models.js')).toHaveLength(1);
 // A cached older loader can still request the standalone asset without adding a second menu or identity.
 await page.evaluate(()=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/assets/member-menu.js?v=members-1';script.onload=resolve;script.onerror=reject;document.head.append(script)}));
 expect(await page.evaluate(()=>window.memberBoots)).toBe(1);await expect(page.locator('.member-nav')).toHaveCount(1);
});
