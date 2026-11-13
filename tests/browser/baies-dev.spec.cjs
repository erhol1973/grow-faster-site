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
  await page.goto('/executive-radar/');
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
  await expect(page.locator('#evidence-rows .evidence-record')).toHaveCount(5);
});

test('BAEIS: editorial simulation never enables external publication',async({page})=>{
  await page.goto('/executive-radar/');
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

// Replaces the removed internal newsletter-prototype flow with public-surface and legacy-route regressions.
for(const lang of ['nl','fr'])test('Executive Radar: '+lang+' removed internal about routes fall back to public overview',async({page})=>{
  const writes=[],errors=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['executive-radar','baies-dev']){
    await page.goto('/'+route+'/?lang='+lang+'#about');
    await expect(page).toHaveURL(new RegExp('/'+route+'/[?]lang='+lang+'#overview$'));
    await expect(page.locator('html')).toHaveAttribute('lang',lang+'-BE');
    await expect(page.locator('#overview')).toBeVisible();
    await expect(page.locator('.nav-link[data-view=overview]')).toHaveAttribute('aria-current','page');
    await expect(page.locator('#about,#heading-about,[data-view=about],[href="#about"],[id^=signup-]')).toHaveCount(0);
    await expect(page.locator('#product-links .nav-link')).toHaveCount(5);
    await language(page,lang==='fr'?'nl':'fr');
    await expect(page).toHaveURL(new RegExp('/'+route+'/[?]lang='+(lang==='fr'?'nl':'fr')+'#overview$'));
    await expect(page.locator('#overview')).toBeVisible();
    await page.reload();await expect(page.locator('#overview')).toBeVisible();
    await expect(page.locator('[data-i18n=footer]')).toContainText(lang==='fr'?'Vaste referentiedata':'Données de référence fixes');
    // Restore a legacy history entry, then verify both directions retain the locale.
    const activeLang=lang==='fr'?'nl':'fr';
    await page.evaluate(()=>{const old=new URL(location.href);old.hash='about';history.pushState(null,'',old);});
    await navigate(page,'radar');await page.locator('#role-filter').selectOption('CFO');
    await page.goBack();await expect(page).toHaveURL(new RegExp('/'+route+'/[?]lang='+activeLang+'#overview$'));
    await expect(page.locator('#overview')).toBeVisible();await expect(page.locator('#heading-overview')).toBeFocused();
    await page.goForward();await expect(page).toHaveURL(new RegExp('/'+route+'/[?]lang='+activeLang+'#radar$'));
    await expect(page.locator('#radar')).toBeVisible();await expect(page.locator('#role-filter')).toHaveValue('CFO');
    await expect(page.locator('html')).toHaveAttribute('lang',activeLang+'-BE');
  }
  expect(writes).toEqual([]);expect(errors).toEqual([]);
});
const AxeBuilder=require('@axe-core/playwright').default;
test('BAEIS branding: readable responsive layouts',async({page})=>{
  await page.goto('/executive-radar/');
  const logo=page.locator('.site-header .brand-logo');
  await page.locator('[data-language=fr]').focus();
  await expect(page.locator('[data-language=fr]')).toHaveCSS('outline-color','rgb(33, 137, 225)');
  await expect(logo).toHaveJSProperty('naturalWidth',1920);
  await expect(page.locator('body')).toHaveCSS('font-size','17px');
  await expect(page.locator('.nav-link').first()).toHaveCSS('font-size','15px');
  for(const width of [320,390,500,768,1440]){
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const box=await logo.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
  }
});

// Each locale scans all five remaining public views without extending timeouts.
for(const lang of ['nl-BE','fr-BE'])test('BAEIS branding: all '+lang+' views meet AA contrast',async({page})=>{
  await page.goto('/executive-radar/');
  if(lang==='fr-BE')await language(page,'fr');
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
  await expect(page.locator('.dev-strip strong')).toHaveText(lang==='fr-BE'?'DÉMONSTRATION':'DEMONSTRATIE');
  await expect(page.locator('[data-i18n=footer]')).toContainText(lang==='fr-BE'?'Données de référence fixes':'Vaste referentiedata');
  for(const view of ['overview','dashboard','radar','evidence','editorial']){
    await navigate(page,view);
    const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(scan.violations).toEqual([]);
  }
});

test('BAEIS navigation: French deep links, history and preserved filters',async({page})=>{
  await page.goto('/executive-radar/?lang=fr#radar');
  await expect(page.locator('html')).toHaveAttribute('lang','fr-BE');
  await expect(page.locator('#radar')).toBeVisible();
  await expect(page.locator('[data-language=fr]')).toHaveAttribute('aria-pressed','true');
  await expect(page).toHaveTitle('Radar IA | Executive Radar · Grow Faster');
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

test('BAEIS navigation: language choices preserve review state and history',async({page})=>{
  const writes=[];page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
  await page.goto('/executive-radar/#editorial');
  await page.locator('#advance-review').click();await page.locator('#advance-review').click();
  await language(page,'fr');
  await expect(page).toHaveURL(/\?lang=fr#editorial$/);
  await expect(page.locator('#editorial')).toBeVisible();
  await page.locator('#advance-review').click();
  await expect(page.locator('#advance-review')).toBeDisabled();
  await expect(page.locator('#external-publish')).toBeDisabled();
  await language(page,'nl');await expect(page.locator('#advance-review')).toBeDisabled();
  await expect(page.locator('[data-language][aria-pressed=true]')).toHaveCount(1);
  await navigate(page,'evidence');await expect(page.locator('#evidence')).toBeVisible();
  await page.goBack();await expect(page.locator('#editorial')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang','nl-BE');
  await expect(page.locator('#advance-review')).toBeDisabled();
  expect(writes).toEqual([]);
});

test('BAEIS navigation: mobile disclosure, keyboard, outside click and resize',async({page,isMobile})=>{
  await page.goto('/executive-radar/');await page.setViewportSize({width:390,height:900});
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
  await expect(page.locator('.hero-copy [data-goto=dashboard]')).toBeFocused();await expect(links).toBeHidden();
  await toggle.focus();await page.setViewportSize({width:1440,height:900});
  await expect(toggle).toBeHidden();await expect(page.locator('.nav-link[aria-current=page]')).toBeFocused();
  await page.setViewportSize({width:390,height:900});await expect(toggle).toBeFocused();
  await navigate(page,'evidence');await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#heading-evidence')).toBeFocused();
  await expect(page).toHaveURL(/#evidence$/);
  await navigate(page,'overview');await expect(page.locator('#overview')).toBeVisible();
  await expect(page.locator('#heading-overview')).toBeFocused();
});

test('BAEIS navigation: unsupported language and unknown hashes fall back safely',async({page})=>{
  await page.goto('/executive-radar/?lang=en#%3Cscript%3E');
  await expect(page.locator('html')).toHaveAttribute('lang','nl-BE');
  await expect(page.locator('#overview')).toBeVisible();
  await expect(page).toHaveURL(/\?lang=nl#overview$/);
  await expect(page.locator('[data-language=nl]')).toHaveAttribute('aria-pressed','true');
  await page.locator('.hero-copy [data-goto=radar]').click();await expect(page).toHaveURL(/#radar$/);
});

test('BAEIS navigation: native section links remain readable without JavaScript',async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false,baseURL,viewport:{width:390,height:900}});
  try{const page=await context.newPage();await page.goto('/executive-radar/');
    await expect(page.locator('#navigation-toggle')).toBeHidden();
    await expect(page.locator('#product-links')).toBeVisible();
    await page.locator('.nav-link[href="#evidence"]').click();
    await expect(page).toHaveURL(/#evidence$/);await expect(page.locator('#evidence')).toBeVisible();
  }finally{await context.close();}
});


test('BAEIS navigation: skip preserves the screen and Back closes evidence detail',async({page})=>{
  await page.goto('/executive-radar/?lang=fr');
  await page.keyboard.press('Tab');await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#main')).toBeFocused();
  await navigate(page,'radar');
  await page.locator('.identity').focus();await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('#radar')).toBeVisible();await expect(page).toHaveURL(/#radar$/);
  await navigate(page,'evidence');
  await page.locator('#evidence-rows .text-btn').first().click();await expect(page.locator('#evidence-dialog')).toBeVisible();
  await page.goBack();await expect(page.locator('#evidence-dialog')).toBeHidden();
  await expect(page.locator('#radar')).toBeVisible();await expect(page.locator('#heading-radar')).toBeFocused();
});


test('BAEIS palette: verified, evidence, score and blocked states use Grow Faster blues',async({page})=>{
  await page.goto('/executive-radar/');
  await expect(page.locator('.value-icon.verified')).toHaveCSS('background-color','rgb(217, 238, 249)');
  await expect(page.locator('.value-icon.verified')).toHaveCSS('color','rgb(0, 106, 156)');
  await navigate(page,'radar');
  await expect(page.locator('.signal-score').first()).toHaveCSS('background-color','rgb(217, 238, 249)');
  await expect(page.locator('.signal-score').first()).toHaveCSS('color','rgb(0, 106, 156)');
  await navigate(page,'evidence');
  await expect(page.locator('.evidence-banner')).toHaveCSS('background-color','rgb(237, 244, 250)');
  await expect(page.locator('.evidence-banner')).toHaveCSS('border-top-color','rgb(217, 238, 249)');
  await navigate(page,'editorial');
  for(let i=0;i<3;i++)await page.locator('#advance-review').click();
  await expect(page.locator('.step.done i')).toHaveCount(4);
  await expect(page.locator('.step.done i').first()).toHaveCSS('background-color','rgb(217, 238, 249)');
  await expect(page.locator('.guardrail-icon.blocked')).toHaveText('L4');
  await expect(page.locator('.guardrail-icon.blocked')).toHaveCSS('background-color','rgb(11, 37, 69)');
  await expect(page.locator('.guardrail-icon.blocked')).toHaveCSS('color','rgb(255, 255, 255)');
  await expect(page.locator('#external-publish')).toBeDisabled();
});

for(const lang of ['nl','fr'])test('BAEIS C: '+lang+' dashboard agenda, source detail, download and role handoff',async({page})=>{
  const writes=[];page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
  await page.goto('/executive-radar/?lang='+lang+'#dashboard');
  await expect(page.locator('#dashboard')).toBeVisible();
  expect(await page.locator('#heading-dashboard').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('.main-nav').getBoundingClientRect().bottom)).toBe(true);
  await expect(page.locator('.nav-link[aria-current=page]')).toHaveAttribute('data-view','dashboard');
  await expect(page.locator('#dashboard-records')).toHaveText('5');
  await expect(page.locator('#dashboard-publishers')).toHaveText('3');
  await expect(page.locator('#dashboard-types')).toHaveText('4');
  await page.locator('[data-role=CIO]').click();
  await expect(page.locator('#dashboard-records')).toHaveText('2');
  await expect(page.locator('#brief-items li')).toHaveCount(2);
  await expect(page.locator('#brief-items li').first()).toContainText('34,5%');
  await page.locator('#brief-items .text-btn').first().click();
  await expect(page.locator('#dialog-body')).toContainText('BE-AI-001');
  await expect(page.locator('#dialog-body')).toContainText(lang==='fr'?'Limites de recherche':'Onderzoeksbeperkingen');
  await page.locator('#dialog-done').click();
  const downloadPromise=page.waitForEvent('download');await page.locator('#download-brief').click();const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('Executive_Radar_Brief_CIO.txt');
  const content=require('fs').readFileSync(await download.path(),'utf8');
  expect(content).toContain(lang==='fr'?'Fonction: CIO':'Directiefunctie: CIO');expect(content).toContain('https://statbel.fgov.be');expect(content).toContain('https://www.vlaio.be');expect(content).not.toContain('https://www.nbb.be');
  expect(content).toContain(lang==='fr'?'Limites de recherche':'Onderzoeksbeperkingen');
  await page.locator('#dashboard-radar').click();await expect(page.locator('#role-filter')).toHaveValue('CIO');await expect(page.locator('#signal-grid .signal-card')).toHaveCount(2);
  await navigate(page,'dashboard');await expect(page.locator('[data-role=CIO]')).toHaveAttribute('aria-pressed','true');
  await language(page,lang==='fr'?'nl':'fr');await expect(page.locator('#brief-items li')).toHaveCount(2);expect(writes).toEqual([]);
});

for(const lang of ['nl','fr'])test('BAEIS C: '+lang+' radar ordering, bilingual search, empty state and reset',async({page})=>{
  await page.goto('/executive-radar/?lang='+lang+'#radar');
  const cards=page.locator('#signal-grid .signal-card');await expect(cards.first()).toHaveAttribute('data-record','BE-EC-003');
  await page.locator('#signal-sort').selectOption('date');await expect(cards.first()).toHaveAttribute('data-record','BE-EC-004');
  await page.locator('#signal-sort').selectOption('source');await expect(cards.last()).toHaveAttribute('data-record','BE-AI-002');
  await page.locator('#signal-search').fill('exploitables');await expect(cards).toHaveCount(1);await expect(cards).toHaveAttribute('data-record','BE-AI-002');
  await cards.locator('summary').click();await expect(cards.locator('details')).toHaveAttribute('open','');
  await page.locator('#sector-filter').selectOption('Manufacturing');await expect(cards).toHaveCount(0);await expect(page.locator('#signal-grid .empty')).toBeVisible();await expect(page.locator('#visible-count')).toHaveText('0');
  await page.locator('#reset-radar').click();await expect(cards).toHaveCount(5);await expect(page.locator('#signal-sort')).toHaveValue('priority');await expect(page.locator('#signal-search')).toBeEmpty();
});

for(const lang of ['nl','fr'])test('BAEIS C: '+lang+' register combines source and evidence filters without hiding caveats',async({page})=>{
  await page.goto('/executive-radar/?lang='+lang+'#evidence');const cards=page.locator('.evidence-record');await expect(cards).toHaveCount(5);
  await page.locator('#evidence-source').selectOption('Nationale Bank van België');await expect(cards).toHaveCount(2);
  await page.locator('#evidence-type').selectOption('Economic forecast');await expect(cards).toHaveCount(1);await expect(cards).toHaveAttribute('data-record','BE-EC-003');
  await cards.locator('summary').click();await expect(cards.locator('details p')).toBeVisible();
  await language(page,lang==='fr'?'nl':'fr');await expect(page.locator('#evidence-type')).toHaveValue('Economic forecast');await expect(cards).toHaveCount(1);
  await cards.locator('.text-btn').click();await expect(page.locator('#dialog-body')).toContainText('BE-EC-003');await expect(page.locator('#dialog-body a')).toHaveAttribute('href',/^https:\/\/www\.nbb\.be\//);
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(scan.violations).toEqual([]);
  await page.locator('#dialog-close').click();await expect(cards.locator('.text-btn')).toBeFocused();
  await cards.locator('.text-btn').click();await page.keyboard.press('Escape');await expect(page.locator('#evidence-dialog')).toBeHidden();await expect(cards.locator('.text-btn')).toBeFocused();
  await page.locator('#evidence-search').fill('no-results-here');await expect(cards).toHaveCount(0);await expect(page.locator('#evidence-count')).toContainText('0 / 5');
  await page.locator('#reset-evidence').click();await expect(cards).toHaveCount(5);await expect(page.locator('#evidence-source')).toHaveValue('ALL');await expect(page.locator('#evidence-type')).toHaveValue('ALL');
});

// Independent locales preserve all 24 viewport/view checks within the existing timeout.
for(const lang of ['nl','fr'])test('BAEIS C: '+lang+' workspaces remain usable at narrow and wide viewports',async({page})=>{
  await page.goto('/executive-radar/?lang='+lang);
  for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});for(const view of ['overview','dashboard','radar','evidence']){await navigate(page,view);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const heading=page.locator('#heading-'+view);await expect(heading).toBeVisible();expect(await heading.evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('.main-nav').getBoundingClientRect().bottom)).toBe(true);}}
});

for(const lang of ['nl','fr'])test('BAEIS D: '+lang+' concept search and transparent role widening',async({page})=>{
  await page.goto('/executive-radar/?lang='+lang+'#radar');await page.locator('#role-filter').selectOption('CFO');
  for(const query of ['AI','IA']){await page.locator('#signal-search').fill(query);await expect(page.locator('.signal-card')).toHaveCount(2);await expect(page.locator('.signal-card').first()).toHaveAttribute('data-record','BE-AI-001');await expect(page.locator('.signal-card').last()).toHaveAttribute('data-record','BE-AI-002');}
  await page.locator('#signal-search').fill('factur');await expect(page.locator('.signal-card')).toHaveCount(0);await expect(page.locator('#signal-grid .empty')).toBeVisible();
  await page.locator('#role-filter').selectOption('CIO');await page.locator('#sector-filter').selectOption('Manufacturing');await page.locator('#signal-sort').selectOption('date');await page.locator('#signal-search').fill('BE-EC-004');
  await expect(page.locator('#role-coverage')).toContainText('CIO');await expect(page.locator('#role-coverage')).toContainText('1');await expect(page.locator('#expand-role-filter')).toBeVisible();
  await page.locator('#expand-role-filter').click();await expect(page.locator('#role-filter')).toHaveValue('ALL');await expect(page.locator('#role-filter')).toBeFocused();await expect(page.locator('#sector-filter')).toHaveValue('Manufacturing');await expect(page.locator('#signal-search')).toHaveValue('BE-EC-004');await expect(page.locator('#signal-sort')).toHaveValue('date');await expect(page.locator('.signal-card')).toHaveCount(1);await expect(page.locator('#expand-role-filter')).toBeHidden();
  await navigate(page,'evidence');for(const query of ['AI','IA']){await page.locator('#evidence-search').fill(query);await expect(page.locator('.evidence-record')).toHaveCount(2);}await page.locator('#evidence-search').fill('factur');await expect(page.locator('.evidence-record')).toHaveCount(0);await page.locator('#reset-evidence').click();await expect(page.locator('.evidence-record')).toHaveCount(5);
});

for(const role of ['CEO','CFO'])for(const lang of ['nl','fr'])test('BAEIS D: '+role+' '+lang+' size-specific research agenda and complete local brief',async({page})=>{
  const writes=[];page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});await page.goto('/executive-radar/?lang='+lang+'#dashboard');await page.locator('[data-role='+role+']').click();
  await expect(page.locator('#dashboard-records')).toHaveText('5');if(role==='CFO')await expect(page.locator('#cfo-context')).toBeVisible();else await expect(page.locator('#cfo-context')).toBeHidden();
  const expected={small:lang==='fr'?'minutes par opération':'minuten per handeling',medium:lang==='fr'?'par équipe':'per betrokken team',large:lang==='fr'?'Dossier par entité':'Beoordelingsdossier per eenheid'};
  for(const size of ['small','medium','large']){
    await page.locator('#company-size').selectOption(size);await expect(page.locator('#brief-items .decision-plan')).toHaveCount(3);await expect(page.locator('#brief-items .decision-plan').first()).toHaveAttribute('data-context',size);await page.locator('#brief-items .decision-plan summary').first().click();await expect(page.locator('#brief-items .decision-plan').first().locator('details')).toHaveAttribute('open','');await expect(page.locator('#brief-items .decision-plan').first().locator('dd').first()).toBeVisible();await expect(page.locator('#brief-items .decision-plan').first()).toContainText(expected[size]);
    const promise=page.waitForEvent('download');await page.locator('#download-brief').click();const d=await promise;const text=require('fs').readFileSync(await d.path(),'utf8');expect(d.suggestedFilename()).toBe('Executive_Radar_Brief_'+role+'.txt');expect(text).toContain((lang==='fr'?'Fonction: ':'Directiefunctie: ')+role);expect(text).toContain(expected[size]);expect(text).toContain('BE-EC-003');expect(text).toContain('https://www.nbb.be/');expect(text).toContain(lang==='fr'?'Prochaine étape proposée':'Voorgestelde vervolgstap');expect(text).toContain(lang==='fr'?'pas des faits sourcés':'geen bronfeiten');expect(text).toContain(lang==='fr'?'Limites de recherche':'Onderzoeksbeperkingen');
  }
  await language(page,lang==='fr'?'nl':'fr');await expect(page.locator('#company-size')).toHaveValue('large');await expect(page.locator('[data-role='+role+']')).toHaveAttribute('aria-pressed','true');
  await navigate(page,'radar');await navigate(page,'dashboard');await expect(page.locator('#company-size')).toHaveValue('large');await expect(page.locator('#brief-items .decision-plan').first()).toHaveAttribute('data-context','large');
  await page.locator('#brief-items .decision-plan summary').first().focus();await page.keyboard.press('Enter');await expect(page.locator('#brief-items .decision-plan details').first()).toHaveAttribute('open','');
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(scan.violations).toEqual([]);expect(writes).toEqual([]);
});

// Existing shared URLs remain usable; only the commercial product name changes.
for(const lang of ['nl','fr'])test('Executive Radar: '+lang+' legacy deep link and locale-aware website return',async({page})=>{
  await page.goto('/baies-dev/?lang='+lang+'#evidence');
  await expect(page.locator('html')).toHaveAttribute('lang',lang+'-BE');
  await expect(page.locator('#evidence')).toBeVisible();
  await expect(page.locator('.product-identity strong')).toHaveText('Executive Radar');
  await expect(page).toHaveTitle(/Executive Radar · Grow Faster$/);
  await expect(page.locator('meta[name=description]')).toHaveAttribute('content',/Executive Radar/);
  await page.locator('#evidence-search').fill(lang==='fr'?'IA':'AI');
  await expect(page.locator('.evidence-record')).toHaveCount(2);
  await language(page,lang==='fr'?'nl':'fr');
  await expect(page.locator('#evidence-search')).toHaveValue(lang==='fr'?'IA':'AI');
  await language(page,lang);
  const home=page.locator('.identity');
  await expect(home).toHaveAttribute('href','../index.html?lang='+lang);
  await home.click();
  await expect(page).toHaveURL(new RegExp('/index[.]html[?]lang='+lang+'$'));
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
});
