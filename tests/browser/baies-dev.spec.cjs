'use strict';
const {test,expect}=require('playwright/test');

// Preview only: browser tests run against the locally built artifact, never the live site.
test('BAEIS: evidence-backed executive navigation and filters',async({page})=>{
  await page.goto('/baies-dev/');
  await expect(page.locator('#hero-signal-list .preview-signal')).toHaveCount(3);
  await page.getByRole('button',{name:'Trend Radar',exact:true}).click();
  await expect(page.locator('#signal-grid .signal-card')).toHaveCount(5);
  await page.locator('#role-filter').selectOption('CFO');
  await page.locator('#sector-filter').selectOption('Manufacturing');
  await expect(page.locator('#signal-grid .signal-card')).toHaveCount(1);
  await page.locator('.signal-card .text-btn').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
  await expect(page.locator('#dialog-body a')).toHaveAttribute('href',/^https:\/\/www\.nbb\.be\//);
  await page.locator('#dialog-close').click();
  await page.getByRole('button',{name:'Evidence Register',exact:true}).click();
  await expect(page.locator('#evidence-rows tr')).toHaveCount(5);
});

test('BAEIS: editorial simulation never enables external publication',async({page})=>{
  await page.goto('/baies-dev/');
  await page.getByRole('button',{name:'Redactie & Governance'}).click();
  for(let i=0;i<3;i++)await page.locator('#advance-review').click();
  await expect(page.locator('#advance-review')).toBeDisabled();
  await expect(page.locator('#external-publish')).toBeDisabled();
  await page.locator('#reset-review').click();
  await expect(page.locator('#advance-review')).toBeEnabled();
  await page.locator('#language-switch').click();
  await expect(page.locator('html')).toHaveAttribute('lang','fr-BE');
  await expect(page.locator('#external-publish')).toBeDisabled();
});

test('BAEIS: newsletter consent remains local, no HTTP submission',async({page})=>{
  const posts=[];page.on('request',r=>{if(r.method()!=='GET')posts.push(r.url());});
  await page.goto('/baies-dev/');
  await page.getByRole('button',{name:'4 Sprint MVP'}).click();
  await page.locator('#signup-email').fill('demo@example.com');
  await page.locator('#signup-consent').check();
  await page.locator('#signup-form button[type=submit]').click();
  await expect(page.locator('#signup-feedback')).toContainText('niets opgeslagen of verstuurd');
  await expect(page.locator('#signup-email')).toBeEmpty();
  expect(posts).toEqual([]);
});
const AxeBuilder=require('@axe-core/playwright').default;
test('BAEIS branding: readable responsive NL/FR views and AA contrast',async({page})=>{
  await page.goto('/baies-dev/');
  const initialViewport=page.viewportSize();
  const logo=page.locator('.site-header .brand-logo');
  await expect(logo).toHaveJSProperty('naturalWidth',1110);
  await expect(page.locator('body')).toHaveCSS('font-size','17px');
  await expect(page.locator('.nav-link').first()).toHaveCSS('font-size','15px');
  for(const width of [390,768,1440]){
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const box=await logo.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize(initialViewport);
  for(const lang of ['nl-BE','fr-BE']){
    await expect(page.locator('html')).toHaveAttribute('lang',lang);
    for(const view of ['overview','radar','evidence','editorial','about']){
      await page.locator(`[data-view="${view}"]`).click();
      const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      expect(scan.violations).toEqual([]);
    }
    await page.locator('#language-switch').click();
  }
});
