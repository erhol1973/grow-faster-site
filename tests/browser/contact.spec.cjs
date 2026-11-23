const {test,expect}=require('playwright/test');
const navigation=require('../navigation-cases.json'),routes=navigation.pages;
// Release 2 (23 Nov 2026): flat menu without dropdowns; Over (About) moved to the footer. Menu pages are opened via the menu,
// other pages directly; every page still returns to About at the top through its footer Contact link.
async function open(page,route){if(navigation.primary.includes(route))return clickMenu(page,route);if(route===navigation.home)return page.locator('.nav .brand').click();await page.goto('/'+route);}
async function clickContact(page,keyboard=false){const link=page.locator('footer a[href="about.html"]').last();await link.scrollIntoViewIfNeeded();if(keyboard){await link.focus();await link.press('Enter')}else await link.click();}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}));
  });
});
async function clickMenu(page,route,keyboard=false){
  const link=page.locator(`#navlist a[href="${route}"]`);
  if(!await link.isVisible()&&await page.locator('#burger').isVisible()&&!await page.locator('#navlist').isVisible())await page.locator('#burger').click();
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
    await page.goto('/about.html');await open(page,route);
    await expect(page).toHaveURL(new RegExp('/'+route.replace('.','\\.')+'$'));
    if(position==='bottom'){
      await page.locator('body').press('End');
      await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(100);
    }
    await clickContact(page);await expectTop(page);
    await page.goto('/about.html#contact');
    await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(100);
    await clickContact(page);await expectTop(page);
  });
}
for(const language of ['nl','fr']){
  test(`keyboard, history and footer Contact preserve ${language}`,async({page,browserName})=>{
    await page.addInitScript(l=>localStorage.setItem('avs-lang',l),language);
    await page.goto('/insights.html#design-the-exception');await clickContact(page,true);
    await expectTop(page);await expect(page.locator('html')).toHaveAttribute('lang',language);
    await page.goBack();await expect(page).toHaveURL(/\/insights\.html#design-the-exception$/);
    await clickContact(page);await expectTop(page);
    await page.goto('/coherence.html');
    // Coherence for kmo's (23 Nov 2026): the page no longer embeds the simulator and uses the customer footer.
    await page.locator('footer .fcol').last().locator('a[href="about.html"]').click();
    await expectTop(page);await expect(page.locator('html')).toHaveAttribute('lang',language);
    // The new customer footer: its Contact column (last) opens About at the top as well.
    await page.goto('/orion.html');await page.locator('footer .fcol').last().locator('a[href="about.html"]').click();
    await expectTop(page);await expect(page.locator('html')).toHaveAttribute('lang',language);
  });
}
