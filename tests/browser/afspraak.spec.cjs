const {test,expect}=require('playwright/test');
// Appointment page (23 Nov 2026): topic first (preselected from the calling page), then the Google booking page in a new window.
test.beforeEach(async({page})=>{await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))})});
test('the menu action opens the appointment page with a general question selected',async({page},info)=>{
 await page.goto('/index.html');if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
 await page.locator('#navlist .nav-work').click();await expect(page).toHaveURL(/\/afspraak\.html$/);
 await expect(page.locator('input[value="algemeen"]')).toBeChecked();await expect(page.locator('#gekozen-onderwerp')).toHaveText('Algemene vraag');
 await expect(page.locator('#boek')).toHaveAttribute('href','https://calendar.app.google/VGYG8kHB7tkqJcYp9');await expect(page.locator('#boek')).toHaveAttribute('target','_blank');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('a topic from an offer page is preselected, can be changed and follows the language',async({page})=>{
 await page.goto('/orion.html');await page.locator('#hero-pilot').click();await expect(page).toHaveURL(/\/afspraak\.html\?onderwerp=vragenlijsten$/);
 await expect(page.locator('input[value="vragenlijsten"]')).toBeChecked();await expect(page.locator('#gekozen-onderwerp')).toHaveText('Vragenlijsten automatisch invullen met AI');
 await page.locator('label').filter({hasText:'Training'}).click();await expect(page.locator('#gekozen-onderwerp')).toHaveText('Training');
 await page.locator('input[value="workflow"]').focus();await page.keyboard.press('Space');await expect(page.locator('#gekozen-onderwerp')).toHaveText('Workflow-automatisering');
 await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();
 await expect(page.locator('#gekozen-onderwerp')).toHaveText('Automatisation des workflows');await expect(page.locator('#boek')).toContainText('Choisir un créneau');
});
