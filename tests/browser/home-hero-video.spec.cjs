const {test,expect}=require('playwright/test');
// Homepage hero video (24 Nov 2026). Playback itself depends on the browser's codecs; these checks cover what the site decides:
// which variant loads, that nothing loads for reduced motion, and that the pause control is reachable and labelled.
const init=async page=>page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});

test('the video variant follows the viewport and the pause button is labelled and toggles',async({page},info)=>{
  await init(page);await page.goto('/index.html');
  const v=page.locator('#hero-video'),btn=page.locator('#hero-pauze');
  await expect(v).toBeVisible();
  const src=await v.evaluate(e=>e.getAttribute('src'));
  expect(src).toBe(info.project.use.isMobile?'media/hero-toepassingen-1280.mp4':'media/hero-toepassingen-1920.mp4');
  expect(await v.evaluate(e=>e.muted&&e.loop&&e.playsInline)).toBe(true);
  await expect(btn).toBeVisible();
  const before=await btn.getAttribute('aria-pressed');
  await btn.click();await expect(btn).not.toHaveAttribute('aria-pressed',before);
  const pressed=await btn.getAttribute('aria-pressed');
  await expect(btn.locator(pressed==='true'?'.hp-speel':'.hp-pauze')).toBeVisible();
  await expect(page.locator('#hero-pilot')).toBeInViewport();
  const box=await btn.boundingBox(),cta=await page.locator('#hero-pilot').boundingBox();
  expect(box.y>=cta.y+cta.height||box.x>=cta.x+cta.width,'pause button does not cover the main button').toBe(true);
});

test('wide, sharp screens get the premium 4K variant',async({browser},info)=>{
  test.skip(info.project.use.isMobile,'desktop case');
  const ctx=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2});const page=await ctx.newPage();await init(page);
  await page.goto('/index.html');await expect(page.locator('#hero-video')).toHaveAttribute('src','media/hero-toepassingen-4k.mp4');
  await ctx.close();
});

test('reduced motion keeps the still image and loads no video',async({browser})=>{
  const ctx=await browser.newContext({reducedMotion:'reduce'});const page=await ctx.newPage();await init(page);
  const videos=[];page.on('request',r=>{if(r.url().endsWith('.mp4'))videos.push(r.url())});
  await page.goto('/index.html');await expect(page.locator('#hero .hero-bg img')).toBeVisible();
  await expect(page.locator('#hero-video')).toBeHidden();await expect(page.locator('#hero-pauze')).toBeHidden();
  expect(await page.locator('#hero-video').getAttribute('src')).toBeNull();expect(videos).toEqual([]);
  await ctx.close();
});

test('application cards are links in reading order and the French texts follow the language switch',async({page})=>{
  await init(page);await page.goto('/index.html');
  await expect(page.locator('#toepassingen .toep-kaart')).toHaveCount(4);
  await expect(page.locator('#toepassingen .toep-kaart h3')).toHaveText(['Kwaliteit in de voedingsproductie','Technisch onderhoud','Administratie','Logistiek']);
  await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();
  await expect(page.locator('#toepassingen-h')).toHaveText('Quel travail répétitif coûte du temps à votre équipe ?');
  await expect(page.locator('#hero-pauze .hp-pauze, #hero-pauze .hp-speel').filter({visible:true})).toHaveText(/vidéo/);
  await page.locator('#toep-administratie').click();await expect(page).toHaveURL(/automatisering\.html/);
});
