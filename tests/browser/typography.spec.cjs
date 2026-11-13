'use strict';
const {test,expect}=require('playwright/test');
const {routes,collect,renderedFonts}=require('../../scripts/typography-audit.cjs');
const widths=process.env.TYPOGRAPHY_WIDTHS?process.env.TYPOGRAPHY_WIDTHS.split(',').map(Number):[320,390,768,1366];
const fixedLanguages={'/journal.html':'nl','/journal-fr.html':'fr','/admin.html':'nl','/boek/index.html':'en','/boek/the-coherent-enterprise/index.html':'en'};
for(const route of routes())for(const language of (fixedLanguages[route]?[fixedLanguages[route]]:['nl','fr']))for(const width of widths){
 test(`typography ${route} ${language} ${width}`,async({page,browserName},info)=>{
  await page.setViewportSize({width,height:900});
  await page.addInitScript(lang=>{localStorage.setItem('avs-lang',lang);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));},language);
  await page.goto(`${route}?lang=${language}`);
  if(['/executive-radar/index.html','/baies-dev/index.html'].includes(route))await page.locator('[data-language="'+language+'"]').click();
  const effectiveLanguage=['/executive-radar/index.html','/baies-dev/index.html'].includes(route)?language+'-BE':language;
  await expect(page.locator('html')).toHaveAttribute('lang',effectiveLanguage);
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('font-size','17px');
  if(await page.locator('main').count())await expect(page.locator('main').first()).toBeVisible();
  const result=await collect(page);
  if(browserName==='chromium')result.renderedFonts=await renderedFonts(page);
  await info.attach('computed-typography',{body:JSON.stringify(result,null,2),contentType:'application/json'});
  await page.screenshot({path:info.outputPath(`route-${language}-${width}.png`),fullPage:route==='/transformation.html'});
  if(route==='/transformation.html')await page.locator('.career').screenshot({path:info.outputPath(`career-${language}-${width}.png`)});
  expect(result.elements.length,'route must produce measurable text').toBeGreaterThan(0);
  expect(result.deviations).toEqual([]);
  expect(result.unclassified,'text roles must be explicitly classified before a zero-deviation claim').toEqual([]);
  expect(result.overflow,'document horizontal overflow').toBe(false);
  if(result.renderedFonts){
   // Platform evidence catches a reintroduced serif/editor-specific face even
   // when font-family happens to contain the same fallback stack.
   const unexpected=result.renderedFonts.flatMap(s=>s.fonts.filter(f=>/Georgia|Times|Inter|Carlito|Calibri|Aptos Display/i.test(f.familyName)).map(f=>({selector:s.selector,...f})));
   expect(unexpected,'unexpected actual rendered font').toEqual([]);
   const probes=result.renderedFonts.filter(s=>s.selector.startsWith('#typography-probe-')&&!s.reference);
   expect(probes.length,'body normal, bold and italic probes').toBe(3);
   const probeFamilies=probes.map(s=>s.fonts.filter(f=>f.glyphCount>0).map(f=>f.familyName).sort().join(','));
   expect(probeFamilies.every(Boolean),'actual Latin font must be measurable').toBe(true);
   expect(new Set(probeFamilies).size,'normal, bold and italic body Latin probes use one effective family: '+JSON.stringify(probes)).toBe(1);
   // Windows reports Segoe UI Semibold as a separate familyName. Compare each
   // role to the approved stack at its own weight/style, without alias guessing.
   const signature=sample=>sample.fonts.filter(f=>f.glyphCount>0).map(f=>({familyName:f.familyName,postScriptName:f.postScriptName,isCustomFont:f.isCustomFont})).sort((a,b)=>a.postScriptName.localeCompare(b.postScriptName));
   const roleProbes=result.renderedFonts.filter(s=>s.reference);
   expect(roleProbes.length,'visible role probes').toBeGreaterThan(0);
   for(const sample of roleProbes){
    const reference=result.renderedFonts.find(s=>s.selector===sample.reference);
    expect(reference,'approved-stack reference for '+sample.selector).toBeDefined();
    expect(signature(sample).length,'measurable Latin role '+sample.selector).toBeGreaterThan(0);
    expect(signature(sample),'actual Latin role matches approved stack at same weight/style: '+JSON.stringify({sample,reference})).toEqual(signature(reference));
   }
  }
 });
}
test('journal geometry inventory records every sheet before enforcing fit',async({page},info)=>{
 const inventory=[];
 for(const width of [1366,1440]){
 await page.setViewportSize({width,height:900});
 for(const route of ['/journal.html','/journal-fr.html']){
  await page.goto(route);
  for(let n=1;n<=15;n++){
   await page.evaluate(index=>{location.hash='p'+index},n);await expect(page.locator('#p'+n)).toBeVisible();
   inventory.push(await page.locator('#p'+n).evaluate(e=>{
    const footer=e.querySelector('.paper-footer');return {route:location.pathname,viewportWidth:innerWidth,page:e.id,overflow:e.scrollHeight-e.clientHeight,overlap:footer.previousElementSibling.getBoundingClientRect().bottom-footer.getBoundingClientRect().top,width:e.clientWidth,height:e.clientHeight,children:[...e.querySelector('.paper-content').children].map(c=>({tag:c.tagName,classes:c.className,height:c.offsetHeight,width:c.offsetWidth,fontSize:getComputedStyle(c).fontSize,lineHeight:getComputedStyle(c).lineHeight}))};
   }));
  }
 }
 }
 await info.attach('all-journal-geometry',{body:JSON.stringify(inventory,null,2),contentType:'application/json'});
 console.log('JOURNAL_GEOMETRY '+JSON.stringify(inventory));
 expect(inventory.filter(p=>p.overflow>1||p.overlap>1)).toEqual([]);
});
test('legacy English language preference falls back without changing typography',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','en');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));});
 await page.goto('/transformation.html?lang=en');await expect(page.locator('html')).toHaveAttribute('lang','nl');
 expect((await collect(page)).deviations).toEqual([]);
});
for(const language of ['nl','fr'])test(`typography clamp boundaries ${language}`,async({page},info)=>{
 await page.addInitScript(lang=>{localStorage.setItem('avs-lang',lang);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));},language);
 await page.goto('/transformation.html');
 for(const width of [666,667,799,800,801,1349,1350,1351,1433,1434]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
  const result=await collect(page);await info.attach('boundary-'+width,{body:JSON.stringify(result,null,2),contentType:'application/json'});
  await page.screenshot({path:info.outputPath(`boundary-${language}-${width}.png`)});
  expect(result.deviations,'width '+width).toEqual([]);expect(result.overflow,'width '+width).toBe(false);
 }
});
test('explicit supporting roles and nested heading/prose resist component specificity',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()})));
 await page.goto('/transformation.html');
 await page.evaluate(()=>{
  const fixture=document.createElement('section');fixture.id='typography-regression-fixture';
  fixture.innerHTML='<h2><a class="btn"><strong>Nested heading</strong></a></h2><p>Ordinary <span>nested prose</span> <span data-typography-role="label">Label</span> <span data-typography-role="metadata">Metadata</span></p><ul><li>List <span data-typography-role="label">Label</span> <span data-typography-role="metadata">Metadata</span></li></ul>';
  fixture.innerHTML+='<p data-typography-role="label">Outer label <span id="nested-metadata" data-typography-role="metadata">Inner metadata <b>Nested emphasis</b></span></p><p data-typography-role="metadata">Outer metadata <span id="nested-label" data-typography-role="label">Inner label <b>Nested emphasis</b></span></p><button type="button">Control <span id="control-label" data-typography-role="label">Control label</span> <span id="control-metadata" data-typography-role="metadata">Control metadata</span></button><div data-typography-role="metadata">Supporting container <input id="nested-native-control" placeholder="Synthetic placeholder" aria-label="Synthetic control"></div>';
  document.querySelector('main').append(fixture);
 });
 const fixture=page.locator('#typography-regression-fixture');
 await expect(fixture.locator('[data-typography-role=label]')).toHaveCount(5);
 for(const label of await fixture.locator('[data-typography-role=label]').all())await expect(label).toHaveCSS('font-size','12px');
 for(const meta of await fixture.locator('[data-typography-role=metadata]').all())await expect(meta).toHaveCSS('font-size','14px');
 const size=await fixture.locator('h2').evaluate(e=>getComputedStyle(e).fontSize);
 await expect(fixture.locator('h2 strong')).toHaveCSS('font-size',size);
 await expect(fixture.locator('p>span').first()).toHaveCSS('font-size','17px');
 await expect(fixture.locator('#nested-metadata b')).toHaveCSS('font-size','14px');
 await expect(fixture.locator('#nested-label b')).toHaveCSS('font-size','12px');
 await expect(fixture.locator('#nested-native-control')).toHaveCSS('font-size','15px');
 const result=await collect(page);await info.attach('nested-role-computed-styles',{body:JSON.stringify(result,null,2),contentType:'application/json'});
 await page.screenshot({path:info.outputPath('nested-role-fixture.png')});
 expect(result.deviations).toEqual([]);
});
for(const language of ['nl','fr'])for(const width of [390,768,1366]){
 test(`typography radar five views ${language} ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:900});await page.goto('/executive-radar/index.html');
  await page.locator(`[data-language="${language}"]`).click();
  for(const view of ['overview','dashboard','radar','evidence','editorial']){
   await page.locator(`a[data-view="${view}"]`).click();
   await expect(page.locator(`#${view}`)).toBeVisible();
   const result=await collect(page);await info.attach(`radar-${view}`,{body:JSON.stringify(result,null,2),contentType:'application/json'});
   expect(result.language,view+' effective language').toBe(language+'-BE');
   expect(result.deviations,view).toEqual([]);expect(result.overflow,view).toBe(false);
  }
 });
 test(`typography journal every page and zoom ${language} ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:900});await page.goto(language==='nl'?'/journal.html':'/journal-fr.html');
  for(let n=1;n<=15;n++){
   await page.evaluate(index=>{location.hash='p'+index},n);await expect(page.locator('#p'+n)).toBeVisible();
   const result=await collect(page);await info.attach(`journal-page-${n}`,{body:JSON.stringify(result,null,2),contentType:'application/json'});
   expect(result.language,'page '+n+' effective language').toBe(language);
   expect(result.deviations,'page '+n).toEqual([]);
   const geometry=await page.locator('#p'+n).evaluate(e=>{const footer=e.querySelector('.paper-footer');return {overflow:e.scrollHeight-e.clientHeight,overlap:footer.previousElementSibling.getBoundingClientRect().bottom-footer.getBoundingClientRect().top};});
   expect(geometry.overflow,'page '+n+' internal overflow').toBeLessThanOrEqual(1);expect(geometry.overlap,'page '+n+' footer overlap').toBeLessThanOrEqual(1);
  }
  await page.locator('[data-bigger]').click();expect((await collect(page)).deviations).toEqual([]);
 });
 test(`typography open navigation and consent ${language} ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:900});
  await page.addInitScript(lang=>{localStorage.setItem('avs-lang',lang);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));},language);
  await page.goto('/transformation.html');
  if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
  for(const id of ['nav-coherence','nav-approach']){
   await page.locator(`[aria-controls="${id}"]`).click();await expect(page.locator('#'+id)).toBeVisible();
   const result=await collect(page);await info.attach(id,{body:JSON.stringify(result,null,2),contentType:'application/json'});expect(result.deviations).toEqual([]);
  }
  await page.locator('.open-consent').first().click();await expect(page.locator('#consent')).toBeVisible();
  const result=await collect(page);await info.attach('consent-open',{body:JSON.stringify(result,null,2),contentType:'application/json'});expect(result.deviations).toEqual([]);
 });
}
