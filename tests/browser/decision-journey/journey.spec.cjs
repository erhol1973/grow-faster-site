'use strict';
const {test,expect}=require('playwright/test');
const {AxeBuilder}=require('@axe-core/playwright');
const fs=require('node:fs/promises'),path=require('node:path');
const step=(page,n)=>page.locator('#journey button').nth(n);
test('first render is stable; no-JavaScript and failed-model states explain the limitation',async({page,browser,browserName})=>{
 await page.addInitScript(()=>{window.demoLayoutShifts=[];if(PerformanceObserver.supportedEntryTypes.includes('layout-shift'))new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.demoLayoutShifts.push(e.value);}).observe({type:'layout-shift',buffered:true});});
 await page.goto('/decision-journey/');await expect(page.locator('#stage-title')).toBeVisible();await expect(page.locator('body')).not.toHaveClass(/demo-initializing/);await expect(page.locator('#main')).not.toHaveAttribute('aria-busy','true');await page.waitForLoadState('networkidle');
 if(browserName==='chromium')expect(await page.evaluate(()=>window.demoLayoutShifts.reduce((a,b)=>a+b,0))).toBeLessThanOrEqual(.1);
 const disabled=await browser.newContext({javaScriptEnabled:false});try{const p=await disabled.newPage();await p.goto(new URL('/decision-journey/',process.env.TEST_BASE_URL||'http://127.0.0.1:4173').href);await expect(p.locator('.no-script')).toBeVisible();await expect(p.locator('.no-script')).toContainText('JavaScript is nodig');}finally{await disabled.close();}
 for(const module of ['model','value-review']){const failed=await browser.newContext();try{const p=await failed.newPage();await p.route('**/assets/'+module+'.js',r=>r.abort());await p.goto(new URL('/decision-journey/',process.env.TEST_BASE_URL||'http://127.0.0.1:4173').href);await expect(p.locator('#error-summary')).toContainText('niet starten');await expect(p.locator('#main')).toBeVisible();await expect(p.locator('body')).not.toHaveClass(/demo-initializing/);}finally{await failed.close();}}
});
async function open(page,lang='nl',kind='external'){
 await page.goto('/decision-journey/');await expect(page.locator('#stage-title')).toBeVisible();
 if(lang==='fr')await page.locator('[data-language="fr"]').click();
 if(kind==='internal')await page.locator('.case-card').nth(1).click();
}
async function diagnose(page){await step(page,1).click();await page.locator('#dimension-process').check();await page.locator('#dimension-governance').check();}
async function shot(page,info,name){
 const folder=path.resolve('reports/decision-journey/screenshots',info.project.name);await fs.mkdir(folder,{recursive:true});
 // WebKit limits physical image dimensions to32767; preserve the entire CSS page without resizing the device.
 const cssCapture=info.project.name==='mobile-webkit',size=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
 const png=await page.screenshot({path:path.join(folder,name+'.png'),fullPage:true,scale:cssCapture?'css':'device'});
 const actual={width:png.readUInt32BE(16),height:png.readUInt32BE(20)};
 if(cssCapture){expect(actual.width).toBe(size.width);expect(actual.height).toBe(size.height);await fs.writeFile(info.outputPath(name+'-full-capture.json'),JSON.stringify({scale:'css',viewportAndDeviceScaleUnchanged:true,expected:size,actual,fullPage:true},null,2));}
}
for(const lang of ['nl','fr'])for(const kind of ['external','internal'])test(`${kind} ${lang}: full signal-diagnosis-canvas-plan-report with local download`,async({page},info)=>{
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
 await open(page,lang,kind);await expect(page.locator('.prototype-notice')).toContainText(/ficti/i);await shot(page,info,kind+'-'+lang+'-signal');
 await diagnose(page);await expect(page.locator('#context')).toContainText('2');await expect(page.locator('#diagnostic-count')).toContainText('2');await page.locator('#dimension-strategy').check();await expect(page.locator('#diagnostic-count')).toContainText('3');await page.locator('#dimension-strategy').uncheck();await expect(page.locator('#diagnostic-count')).toContainText('2');await step(page,2).click();
 await expect(page.locator('#canvas-form textarea')).toHaveCount(8);await expect(page.locator('#field-owner')).not.toHaveValue('');
 await page.locator('#field-question').fill('Fictieve pilotvraag / question pilote fictive — '+kind);await page.locator('#option-wait').check();
 await shot(page,info,kind+'-'+lang+'-canvas');await step(page,5).click();const output=page.locator('#report-output');await expect(page.locator('#roadmap-report-output')).toContainText('90');await expect(output).toContainText('Fictieve pilotvraag');await expect(output).toContainText(/ficti/i);await expect(output).toContainText(lang==='nl'?'11.':'11.');
 const downloadEvent=page.waitForEvent('download');await page.locator('.report-tools button').first().click();const download=await downloadEvent;const destination=info.outputPath('report.md');await download.saveAs(destination);const text=await fs.readFile(destination,'utf8');expect(text).toContain('Fictieve pilotvraag');expect(text).toContain(lang==='nl'?'90-DAGENPLAN — FICTIEF VOORSTEL':'PLAN À 90 JOURS — PROPOSITION FICTIVE');expect(text).toMatch(/11[. ·]/);expect(download.suggestedFilename()).toContain(kind+'-'+lang);
 await expect(page.locator('#value-review-report-output')).toContainText(lang==='nl'?'Geen waarde ingevoerd':'Aucune valeur saisie');await shot(page,info,kind+'-'+lang+'-report');await page.emulateMedia({media:'print'});await expect(page.locator('.site-header')).toBeHidden();await expect(output).toBeVisible();await expect(page.locator('#roadmap-report-output')).toBeVisible();await expect(page.locator('#value-review-report-output')).toBeVisible();if(info.project.name==='chromium'&&kind==='external'&&lang==='nl')await page.pdf({path:'reports/decision-journey/sample-concept-report.pdf',format:'A4',printBackground:true});await page.emulateMedia({media:'screen'});await step(page,2).click();await expect(page.locator('#field-question')).toHaveValue('Fictieve pilotvraag / question pilote fictive — '+kind);await expect(page.locator('#option-wait')).toBeChecked();
 // Website integration adds only the shared, self-hosted type policy. Keep all
 // other requests within this exercise; same-origin Auth/CRM endpoints also fail.
 const origin=new URL(process.env.TEST_BASE_URL||'http://127.0.0.1:4173').origin;
 const shared=new Set(['/assets/typography.css','/assets/typography.js','/assets/hanken-grotesk-latin.woff2']);
 expect(errors).toEqual([]);expect(requests.filter(r=>{if(r.url.startsWith('blob:'))return false;const u=new URL(r.url);return u.origin!==origin||(!u.pathname.startsWith('/decision-journey/')&&!shared.has(u.pathname));})).toEqual([]);expect(requests.filter(r=>!['GET','HEAD'].includes(r.method))).toEqual([]);
 expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie}))).toEqual({local:0,session:0,cookie:''});
});
test('edited text and selections survive language/back navigation; draft is memory only',async({page})=>{
 await open(page);await diagnose(page);await step(page,2).click();await page.locator('#field-owner').fill('Fictieve eigenaar — Camille');await page.locator('#field-question').fill('Behoud deze vrije tekst.');await page.getByRole('button',{name:'Concept bewaren',exact:true}).click();await expect(page.getByRole('status')).toContainText('Herladen');
 await page.locator('[data-language="fr"]').click();await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page.locator('#field-question')).toHaveValue('Behoud deze vrije tekst.');await expect(page.getByRole('status')).toContainText('sans traduction automatique');await step(page,1).click();await expect(page.locator('#dimension-process')).toBeChecked();await step(page,2).click();await expect(page.locator('#field-owner')).toHaveValue('Fictieve eigenaar — Camille');
 page.once('dialog',d=>d.accept());await page.reload();await step(page,1).click();await expect(page.locator('#dimension-process')).not.toBeChecked();await page.locator('#dimension-process').check();await step(page,2).click();await expect(page.locator('#field-question')).not.toHaveValue('Behoud deze vrije tekst.');
});
test('empty diagnostic and Canvas validation focus errors; unsafe text remains inert',async({page})=>{
 await open(page);await step(page,5).click();await expect(page.locator('#error-summary')).toBeFocused();await expect(page.locator('#report-output')).toHaveCount(0);await page.locator('#error-summary a').first().click();await expect(page.locator('#dimension-strategy')).toBeFocused();await page.locator('#dimension-strategy').press('Space');await step(page,2).click();
 await page.locator('#field-owner').fill('');await step(page,5).click();await expect(page.locator('#error-summary')).toBeFocused();await expect(page.locator('#field-owner')).toHaveAttribute('aria-invalid','true');await page.locator('#error-summary a').first().click();await expect(page.locator('#field-owner')).toBeFocused();
 await page.locator('#field-owner').fill('Fictieve eigenaar');await expect(page.locator('#field-owner')).not.toHaveAttribute('aria-describedby',/error/);await page.locator('#field-question').fill('<img src=x onerror="window.demoInjected=1">');await step(page,5).click();await expect(page.locator('#report-output')).toContainText('img src=x');expect(await page.evaluate(()=>window.demoInjected)).toBeUndefined();await expect(page.locator('#report-output img')).toHaveCount(0);
});
test('changing case asks permission and resets only after confirmation',async({page})=>{
 await open(page);await diagnose(page);await step(page,2).click();await page.locator('#field-owner').fill('Gewijzigde fictieve eigenaar');await step(page,0).click();page.once('dialog',d=>d.dismiss());await page.locator('.case-card').nth(1).click();await expect(page.locator('.case-card').first()).toHaveAttribute('aria-pressed','true');
 page.once('dialog',d=>d.accept());await page.locator('.case-card').nth(1).click();await expect(page.locator('.case-card').nth(1)).toHaveAttribute('aria-pressed','true');await step(page,1).click();await expect(page.locator('#dimension-process')).not.toBeChecked();await page.locator('#dimension-process').check();await step(page,2).click();await expect(page.locator('#field-owner')).not.toHaveValue('Gewijzigde fictieve eigenaar');
});
test.describe('initial 320px viewport',()=>{
// Set the same narrow viewport before page creation: Firefox on Windows can hang resizing an empty target.
test.use({viewport:{width:320,height:850}});
for(const lang of ['nl','fr'])test(`${lang}: all six steps accessible and no horizontal overflow at320px`,async({page},info)=>{
 await open(page,lang);expect(await page.evaluate(()=>innerWidth)).toBe(320);
 for(let n=0;n<6;n++){
  if(n===1)await diagnose(page);if(n>1)await step(page,n).click();
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();await fs.writeFile(info.outputPath('axe-'+n+'.json'),JSON.stringify(results,null,2));expect(results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(x=>x.target)}))).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('#stage-title')).toBeVisible();
 }
});
});
