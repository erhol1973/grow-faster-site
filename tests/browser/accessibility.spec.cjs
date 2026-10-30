const {test,expect}=require('playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const routes=[...require('../navigation-cases.json'),'transformation.html'];
async function audit(page,info,label){
  // Render all offscreen chapters for a complete contrast audit.
  await page.addStyleTag({content:'*{content-visibility:visible!important}'});
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  await info.attach(label,{body:JSON.stringify(result,null,2),contentType:'application/json'});
  expect(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
}
test.beforeEach(async({page})=>{await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}));localStorage.setItem('avs-lang','nl')})});
for(const route of routes)test(`WCAG automatic scan ${route}`,async({page},info)=>{await page.goto('/'+route);await page.locator('footer').scrollIntoViewIfNeeded();await page.locator('h1').scrollIntoViewIfNeeded();await audit(page,info,route)});
test('consent dialog labels, focus cycle and WCAG checks',async({page},info)=>{
  await page.goto('/index.html');await page.locator('.open-consent').first().click();await audit(page,info,'consent');
  const buttons=page.locator('#consent button:visible');await buttons.last().focus();await page.keyboard.press('Tab');
  expect(await page.locator('#consent').evaluate(e=>e.contains(document.activeElement))).toBe(true);
});
test('standalone simulator has accessible labels and contrast',async({page},info)=>{await page.goto('/coherence-sim.html');await audit(page,info,'simulator')});
