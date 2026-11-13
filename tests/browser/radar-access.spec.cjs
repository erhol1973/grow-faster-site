'use strict';
const {test,expect}=require('playwright/test');
const {edition}=require('../../scripts/radar-release.cjs');

test('Radar preview never requests private data as a guest', async ({page}) => {
  let attempts=0;
  await page.route('**/assets/member-auth.js',route=>route.fulfill({contentType:'text/javascript',
    body:"window.GFMember={ready:async()=>null,accountUrl:()=>'/account.html',request:async()=>fetch('/__private_radar')};"}));
  await page.route('**/__private_radar',route=>{attempts++;return route.fulfill({status:403});});
  await page.goto('/executive-radar/?lang=fr');
  await expect(page.locator('article:visible')).toHaveCount(1);
  await expect(page.locator('article:visible h2')).toContainText('entreprise belge');
  await expect(page.locator('#dashboard')).toHaveCount(0);
  expect(attempts).toBe(0);
});
for(const scenario of ['denied','tampered template','unsafe source','internal copy']) {
  test('Radar member reader fails closed for '+scenario, async ({page}) => {
    await page.route('**/assets/member-auth.js',route=>route.fulfill({contentType:'text/javascript',
      body:"window.GFMember={ready:async()=>({id:'member'}),accountUrl:()=>'/account.html',request:async()=>fetch('/__private_radar')};"}));
    const payload=structuredClone(edition());
    if(scenario==='tampered template') payload.body+='<img src=x onerror=alert(1)>';
    if(scenario==='internal copy') payload.copy.nl.roadmapTitle='Internal owner roadmap';
    if(scenario==='unsafe source') payload.data.records[1].url='javascript:alert(1)';
    await page.route('**/__private_radar',route=>route.fulfill({status:scenario==='denied'?403:200,
      contentType:'application/json',body:JSON.stringify(payload)}));
    await page.goto('/baies-dev/');
    await expect(page.getByRole('status')).toContainText('niet beschikbaar');
    await expect(page.locator('#dashboard')).toHaveCount(0);
    await expect(page.locator('article:visible')).toHaveCount(1);
  });
}

for (const target of ['skip', 'main']) {
  test('Radar keeps keyboard focus on '+target+' while the private edition opens', async ({page}) => {
    let releaseEdition;
    const waiting = new Promise(resolve => { releaseEdition = resolve; });
    await page.route('**/assets/member-auth.js', route => route.fulfill({
      contentType:'text/javascript',
      body:"window.GFMember={ready:async()=>({id:'member'}),accountUrl:()=>'/account.html',request:async()=>fetch('/__private_radar')};"
    }));
    await page.route('**/__private_radar', async route => {
      await waiting;
      await route.fulfill({contentType:'application/json',body:JSON.stringify(edition())});
    });
    try {
      await page.goto('/baies-dev/?lang=fr#radar');
      await page.keyboard.press('Tab');
      await expect(page.locator('.skip')).toBeFocused();
      if (target === 'main') await page.keyboard.press('Enter');
      const focused = page.locator(target === 'main' ? '#main' : '.skip');
      await expect(focused).toBeFocused();
      releaseEdition();
      await expect(page.locator('#radar')).toBeVisible();
      await expect(focused).toBeFocused();
      await expect(page).toHaveURL(/#radar$/);
    } finally {
      releaseEdition();
    }
  });
}
for(const lang of ['nl','fr'])test('Radar guest '+lang+' website return preserves locale and removed About safely falls back',async({page})=>{
  await page.route('**/assets/member-auth.js',route=>route.fulfill({contentType:'text/javascript',body:"window.GFMember={ready:async()=>null,accountUrl:()=>'/account.html'};"}));
  await page.goto('/executive-radar/?lang='+lang+'#about');
  await expect(page).toHaveURL(new RegExp('lang='+lang+'#overview$'));
  await expect(page.locator('.site-header .identity')).toHaveAttribute('href','../index.html?lang='+lang);
  await expect(page.locator('article[data-language='+lang+']')).toBeVisible();
  await expect(page.locator('#about,#dashboard,[id^=signup-]')).toHaveCount(0);
});

test('Radar public-surface verifier checks gated previews on both routes and languages',async({page,baseURL})=>{
  await page.route('**/assets/member-auth.js',route=>route.fulfill({contentType:'text/javascript',body:"window.GFMember={ready:async()=>null,accountUrl:()=>'/account.html'};"}));
  const {verifyRadarPublicSurface}=require('../../scripts/verify-production.cjs');
  const result=await verifyRadarPublicSurface(page,baseURL);
  expect(result.routes).toHaveLength(4);
  expect(result.routes.every(route=>route.memberContentProtected&&route.featuredSignalAvailable)).toBe(true);
});
