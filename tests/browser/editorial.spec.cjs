const {test,expect}=require('playwright/test');

for(const [language,heading,primary,secondary] of [
 ['nl','Van AI-investering naar bedrijfswaarde.','Plan een kennismaking','Ontdek de aanpak'],
 ['fr','De l’investissement en IA à la valeur pour l’entreprise.','Planifier un premier échange','Découvrez l’approche']
])test('minimal hero layout and approach keyboard action in '+language,async({page})=>{
 await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},language);
 for(const width of [390,768,1024,1440]){
  await page.setViewportSize({width,height:1000});await page.goto('/index.html');
  await expect(page.locator('#consent')).toBeHidden();await expect(page.locator('#hero h1')).toHaveText(heading);
  await expect(page.locator('#hero-work')).toContainText(primary);await expect(page.locator('#hero-approach')).toContainText(secondary);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(await page.locator('#hero img').evaluate(async image=>{await image.decode();return image.naturalWidth>0})).toBe(true);
  const bounds=await page.locator('#hero h1,#hero .sub,#hero .btn').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,right:r.right,width:r.width,height:r.height,bottom:r.bottom}}));
  for(const r of bounds){expect(r.x).toBeGreaterThanOrEqual(0);expect(r.right).toBeLessThanOrEqual(width+1)}
  for(const r of bounds.slice(2)){expect(r.height).toBeGreaterThanOrEqual(44);expect(r.width).toBeGreaterThanOrEqual(44)}
 }
 await page.locator('#hero-approach').focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/approach\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',language);
});

for(const [language,heading,choices]of [['nl','Kies een verdieping',['De visie','De praktijk','De toepassing']],['fr','Choisissez un angle d’approfondissement',['La perspective','La pratique','L’application']]])test(`editorial home gives working reading routes in ${language}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(l=>{if(!localStorage.getItem('avs-lang'))localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},language);
  await page.goto('/index.html');await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+language+'"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('#sum-h')).toHaveText(heading);
  await expect(page.locator('#reading-route .eyebrow')).toHaveText(choices);await expect(page.locator('.lang-top [data-lang]')).toHaveCount(2);await expect(page.locator('[data-lang="de"], [lang="de"]')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  for(const [href,visible]of [['coherence.html#book-thesis','#book-thesis-h'],['transformation.html','.practice-index'],['approach.html','#rm-h']]){
   await page.locator('#reading-route a[href="'+href+'"]').click();await expect(page.locator(visible)).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang',language);
   await page.goto('/index.html');
  }
  await page.locator('#selected-insight a').click();await expect(page.locator('#ai-pilot')).toBeVisible();await expect(page.locator('#ai-pilot [data-article-lang="'+language+'"]')).toBeVisible();
 await page.goto('/index.html#final');await expect(page.locator('#fn-h')).toBeInViewport();
 expect(errors).toEqual([]);
});
test('a late book cover does not move the article link between pointer down and up',async({page})=>{
 let releaseCover;const coverReady=new Promise(resolve=>{releaseCover=resolve});
 await page.route('**/img/the-coherent-enterprise-book-*.webp',async route=>{await coverReady;await route.continue()});
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 try{
  await page.goto('/index.html');const link=page.locator('#selected-insight a');await link.scrollIntoViewIfNeeded();
  const before=await link.boundingBox();await page.mouse.move(before.x+before.width/2,before.y+before.height/2);await page.mouse.down();
  releaseCover();await page.locator('#the-coherent-enterprise img').evaluate(async image=>{image.loading='eager';await image.decode();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))});
  const after=await link.boundingBox();expect(Math.abs(after.y-before.y),'Loading the cover must not move a pressed link').toBeLessThan(1);
  await page.mouse.up();await expect(page.locator('#ai-pilot')).toBeVisible();await expect(page.locator('#ai-pilot [data-article-lang="nl"]')).toBeVisible();
 }finally{releaseCover()}
});

test('retired saved German migrates safely across pages and the simulation',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('avs-lang'))localStorage.setItem('avs-lang','de');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/index.html');await expect(page.locator('html')).toHaveAttribute('lang','nl');expect(await page.evaluate(()=>localStorage.getItem('avs-lang'))).toBe('nl');
 await expect(page.locator('[data-lang="de"], [lang="de"], meta[content="de_DE"]')).toHaveCount(0);
 await page.goto('/coherence.html');await expect(page.locator('html')).toHaveAttribute('lang','nl');await expect(page.locator('.lgx[lang="de"]')).toHaveCount(0);
 await page.goto('/coherence-sim.html?lang=de');await expect(page.locator('html')).toHaveAttribute('lang','nl');await page.locator('#b-step').click();await expect(page.locator('#b-reset')).toBeEnabled();
});
