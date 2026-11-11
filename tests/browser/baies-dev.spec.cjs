'use strict';
const {test,expect}=require('playwright/test');

async function navigate(page,view){
  const toggle=page.locator('#navigation-toggle');
  if(await toggle.isVisible()&&await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
  await page.locator('.nav-link[data-view="'+view+'"]').click();
}
async function language(page,lang){await page.locator('[data-language="'+lang+'"]').click();}

// Preview only: browser tests run against the locally built artifact, never the live site.
test('BAEIS: evidence-backed executive navigation and filters',async({page})=>{
  await page.goto('/baies-dev/');
  await expect(page.locator('#hero-signal-list .preview-signal')).toHaveCount(3);
  await navigate(page,'radar');
  await expect(page.locator('#signal-grid .signal-card')).toHaveCount(5);
  await page.locator('#role-filter').selectOption('CFO');
  await page.locator('#sector-filter').selectOption('Manufacturing');
  await expect(page.locator('#signal-grid .signal-card')).toHaveCount(1);
  await page.locator('.signal-card .text-btn').click();
  await expect(page.locator('#evidence-dialog')).toBeVisible();
  await expect(page.locator('#dialog-body a')).toHaveAttribute('href',/^https:\/\/www\.nbb\.be\//);
  await page.locator('#dialog-close').click();
  await navigate(page,'evidence');
  await expect(page.locator('#evidence-rows tr')).toHaveCount(5);
});

test('BAEIS: editorial simulation never enables external publication',async({page})=>{
  await page.goto('/baies-dev/');
  await navigate(page,'editorial');
  for(let i=0;i<3;i++)await page.locator('#advance-review').click();
  await expect(page.locator('#advance-review')).toBeDisabled();
  await expect(page.locator('#external-publish')).toBeDisabled();
  await page.locator('#reset-review').click();
  await expect(page.locator('#advance-review')).toBeEnabled();
  await language(page,'fr');
  await expect(page.locator('html')).toHaveAttribute('lang','fr-BE');
  await expect(page.locator('#external-publish')).toBeDisabled();
});

test('BAEIS: newsletter consent remains local, no HTTP submission',async({page})=>{
  const posts=[];page.on('request',r=>{if(r.method()!=='GET')posts.push(r.url());});
  await page.goto('/baies-dev/');
  await navigate(page,'about');
  await page.locator('#signup-email').fill('demo@example.com');
  await page.locator('#signup-consent').check();
  await page.locator('#signup-form button[type=submit]').click();
  await expect(page.locator('#signup-feedback')).toContainText('niets opgeslagen of verstuurd');
  await expect(page.locator('#signup-email')).toBeEmpty();
  expect(posts).toEqual([]);
});
const AxeBuilder=require('@axe-core/playwright').default;
test('BAEIS branding: readable responsive layouts',async({page})=>{
  await page.goto('/baies-dev/');
  const logo=page.locator('.site-header .brand-logo');
  await page.locator('[data-language=fr]').focus();
  await expect(page.locator('[data-language=fr]')).toHaveCSS('outline-color','rgb(33, 137, 225)');
  await expect(logo).toHaveJSProperty('naturalWidth',1110);
  await expect(page.locator('body')).toHaveCSS('font-size','17px');
  await expect(page.locator('.nav-link').first()).toHaveCSS('font-size','15px');
  for(const width of [320,390,500,768,1440]){
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const box=await logo.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
  }
});

// Each locale is an independent scenario: retain all ten scans without extending timeouts.
for(const lang of ['nl-BE','fr-BE'])test('BAEIS branding: all '+lang+' views meet AA contrast',async({page})=>{
  await page.goto('/baies-dev/');
  if(lang==='fr-BE')await language(page,'fr');
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
  for(const view of ['overview','radar','evidence','editorial','about']){
    await navigate(page,view);
    const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(scan.violations).toEqual([]);
  }
});

test('BAEIS navigation: French deep links, history and preserved filters',async({page})=>{
  await page.goto('/baies-dev/?lang=fr#radar');
  await expect(page.locator('html')).toHaveAttribute('lang','fr-BE');
  await expect(page.locator('#radar')).toBeVisible();
  await expect(page.locator('[data-language=fr]')).toHaveAttribute('aria-pressed','true');
  await expect(page).toHaveTitle('Radar IA | BAEIS · Grow Faster');
  await page.locator('#role-filter').selectOption('CFO');
  await page.locator('#sector-filter').selectOption('Manufacturing');
  await expect(page.locator('#signal-grid .signal-card')).toHaveCount(1);
  await page.setViewportSize({width:page.viewportSize().width,height:600});
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await navigate(page,'evidence');
  await expect(page).toHaveURL(/\?lang=fr#evidence$/);
  await expect(page.locator('#heading-evidence')).toBeFocused();
  await expect(page.locator('.nav-link[aria-current=page]')).toHaveCount(1);
  await navigate(page,'editorial');
  await page.goBack();await expect(page.locator('#evidence')).toBeVisible();
  await page.goBack();await expect(page.locator('#radar')).toBeVisible();
  await expect(page.locator('#heading-radar')).toBeFocused();
  expect(await page.locator('#heading-radar').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('.main-nav').getBoundingClientRect().bottom)).toBe(true);
  await expect(page.locator('#role-filter')).toHaveValue('CFO');
  await expect(page.locator('#sector-filter')).toHaveValue('Manufacturing');
  await expect(page.locator('#signal-grid .signal-card')).toHaveCount(1);
  await page.goForward();await expect(page.locator('#evidence')).toBeVisible();
  await page.reload();await expect(page.locator('#evidence')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang','fr-BE');
});

test('BAEIS navigation: language choices preserve review and form state',async({page})=>{
  const writes=[];page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
  await page.goto('/baies-dev/#editorial');
  await page.locator('#advance-review').click();await page.locator('#advance-review').click();
  await language(page,'fr');
  await expect(page).toHaveURL(/\?lang=fr#editorial$/);
  await expect(page.locator('#editorial')).toBeVisible();
  await page.locator('#advance-review').click();
  await expect(page.locator('#advance-review')).toBeDisabled();
  await expect(page.locator('#external-publish')).toBeDisabled();
  await language(page,'nl');await expect(page.locator('#advance-review')).toBeDisabled();
  await navigate(page,'about');
  await page.locator('#signup-email').fill('demo@example.com');await page.locator('#signup-consent').check();
  await language(page,'fr');
  await expect(page.locator('#signup-email')).toHaveValue('demo@example.com');
  await expect(page.locator('#signup-consent')).toBeChecked();
  await expect(page.locator('[data-language][aria-pressed=true]')).toHaveCount(1);
  expect(page.url()).not.toContain('demo');
  await page.goBack();await expect(page.locator('#editorial')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang','nl-BE');
  await expect(page.locator('#advance-review')).toBeDisabled();
  expect(writes).toEqual([]);
});

test('BAEIS navigation: mobile disclosure, keyboard, outside click and resize',async({page,isMobile})=>{
  await page.goto('/baies-dev/');await page.setViewportSize({width:390,height:900});
  const toggle=page.locator('#navigation-toggle');const links=page.locator('#product-links');
  await expect(toggle).toHaveAttribute('aria-controls','product-links');
  await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(links).toBeHidden();
  if(isMobile)await toggle.tap();else await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');await expect(links.locator('a')).toHaveCount(5);
  for(const link of await links.locator('a').all()){
    await expect(link).toBeVisible();const box=await link.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(390);expect(box.height).toBeGreaterThanOrEqual(44);
  }
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(scan.violations).toEqual([]);
  await links.locator('a').first().focus();await page.keyboard.press('Escape');
  await expect(links).toBeHidden();await expect(toggle).toBeFocused();
  await toggle.click();await page.locator('.dev-strip').click();await expect(links).toBeHidden();
  await toggle.click();await links.locator('a').last().focus();await page.keyboard.press('Tab');
  await expect(page.locator('.hero-copy [data-goto=radar]')).toBeFocused();await expect(links).toBeHidden();
  await toggle.focus();await page.setViewportSize({width:1440,height:900});
  await expect(toggle).toBeHidden();await expect(page.locator('.nav-link[aria-current=page]')).toBeFocused();
  await page.setViewportSize({width:390,height:900});await expect(toggle).toBeFocused();
  await navigate(page,'evidence');await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#heading-evidence')).toBeFocused();
  await expect(page).toHaveURL(/#evidence$/);
  await page.locator('.identity').click();await expect(page.locator('#overview')).toBeVisible();
  await expect(page.locator('#heading-overview')).toBeFocused();
});

test('BAEIS navigation: unsupported language and unknown hashes fall back safely',async({page})=>{
  await page.goto('/baies-dev/?lang=en#%3Cscript%3E');
  await expect(page.locator('html')).toHaveAttribute('lang','nl-BE');
  await expect(page.locator('#overview')).toBeVisible();
  await expect(page).toHaveURL(/\?lang=nl#overview$/);
  await expect(page.locator('[data-language=nl]')).toHaveAttribute('aria-pressed','true');
  await page.locator('.hero-copy [data-goto=radar]').click();await expect(page).toHaveURL(/#radar$/);
});

test('BAEIS navigation: native section links remain readable without JavaScript',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false,baseURL,viewport:{width:390,height:900}});
  try{const page=await context.newPage();await page.goto('/baies-dev/');
    await expect(page.locator('#navigation-toggle')).toBeHidden();
    await expect(page.locator('#product-links')).toBeVisible();
    await page.locator('.nav-link[href="#evidence"]').click();
    await expect(page).toHaveURL(/#evidence$/);await expect(page.locator('#evidence')).toBeVisible();
  }finally{await context.close();}
});
