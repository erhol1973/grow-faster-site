const {test,expect}=require('playwright/test');
const routes=require('../navigation-cases.json');
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}));
  });
});
async function clickMenu(page,route,keyboard=false){
  const link=page.locator(`.nav a.l[href="${route}"]`);
  if(!await link.isVisible())await page.locator('#burger').click();
  if(keyboard){await link.focus();await link.press('Enter')}
  else await link.click();
}
async function expectTop(page){
  await expect(page).toHaveURL(/\/about\.html$/);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(8);
  await expect(page.locator('h1')).toBeInViewport();
}
for(const route of routes)for(const position of ['top','bottom']){
  test(`${route} → Contact, source ${position}`,async({page})=>{
    await page.addInitScript(()=>localStorage.setItem('avs-lang','nl'));
    await page.goto('/about.html');await clickMenu(page,route);
    await expect(page).toHaveURL(new RegExp('/'+route.replace('.','\\.')+'$'));
    if(position==='bottom'){
      await page.locator('body').press('End');
      await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(100);
    }
    await clickMenu(page,'about.html');await expectTop(page);
    await page.goto('/about.html#contact');
    await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(100);
    await clickMenu(page,'about.html');await expectTop(page);
  });
}
for(const language of ['nl','fr','en','de']){
  test(`keyboard, history and footer Contact preserve ${language}`,async({page,browserName})=>{
    await page.addInitScript(l=>localStorage.setItem('avs-lang',l),language);
    await page.goto('/insights.html#who-decides');await clickMenu(page,'about.html',true);
    await expectTop(page);await expect(page.locator('html')).toHaveAttribute('lang',language);
    await page.goBack();await expect(page).toHaveURL(/\/insights\.html#who-decides$/);
    await clickMenu(page,'about.html');await expectTop(page);
    await page.goto('/coherence.html');
    // In WebKit the simulator must finish its initial layout before a footer
    // click. Do not scroll it into view here: that would hide lazy-load races.
    if(browserName==='webkit')await expect(page.frameLocator('#ec-sim').locator('#b-play')).toBeAttached();
    await page.locator('footer .fcol').last().locator('a[href="about.html"]').click();
    await expectTop(page);await expect(page.locator('html')).toHaveAttribute('lang',language);
  });
}
