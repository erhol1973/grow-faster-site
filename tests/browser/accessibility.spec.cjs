const {test,expect}=require('playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const {routes,languageCases,prepareRoute,revealOffscreen}=require('../../scripts/typography-audit.cjs');
async function audit(page,info,label){
  // Render all offscreen chapters for a complete contrast audit.
  await page.addStyleTag({content:'*{content-visibility:visible!important}'});
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  await info.attach(label,{body:JSON.stringify(result,null,2),contentType:'application/json'});
  expect(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
}
test.beforeEach(async({page})=>{await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));localStorage.setItem('avs-lang','nl')})});
for(const route of routes())for(const {language,effectiveLanguage} of languageCases(route))test(`WCAG automatic scan ${route} ${language}`,async({page},info)=>{
 await prepareRoute(page,route,language);
 await expect(page.locator('html')).toHaveAttribute('lang',effectiveLanguage);
 await expect(page.locator('body')).toBeVisible();
 if(await page.locator('main').count())await expect(page.locator('main').first()).toBeVisible();
 // Keep the original footer/heading traversal where the route provides them.
 // Readers, journals and the standalone simulator have different landmarks.
 const footer=page.locator('footer:visible').last();if(await footer.count())await footer.scrollIntoViewIfNeeded();
 const heading=page.locator('h1:visible').first();if(await heading.count())await heading.scrollIntoViewIfNeeded();
 await page.screenshot({path:info.outputPath('wcag-'+language+'.png')});
 await audit(page,info,route+'-'+language);
});
test('consent dialog labels, focus cycle and WCAG checks',async({page},info)=>{
  await page.goto('/index.html');await page.locator('.open-consent').first().click();await audit(page,info,'consent');
  const buttons=page.locator('#consent button:visible');await buttons.last().focus();await page.keyboard.press('Tab');
  expect(await page.locator('#consent').evaluate(e=>e.contains(document.activeElement))).toBe(true);
});
test('standalone simulator has accessible labels and contrast',async({page},info)=>{await page.goto('/coherence-sim.html');await audit(page,info,'simulator')});

for(const lang of ['nl','fr'])test('ECA questions and result are accessible in '+lang,async({page},info)=>{await page.goto('/eca.html?lang='+lang);await audit(page,info,'eca-questions-'+lang);for(const prefix of ['S','O','D','T','C'])for(let n=1;n<=4;n++)await page.locator('input[name="'+prefix+n+'"][value="4"]').check();await page.locator('#ecaForm button[type="submit"]').click();await expect(page.locator('#results')).toBeVisible();await audit(page,info,'eca-results-'+lang)});
