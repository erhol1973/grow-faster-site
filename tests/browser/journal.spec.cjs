const {test,expect}=require('playwright/test');
// Release 2 (23 Nov 2026, owner decision): the Maandelijks Magazine for kmo's replaces the Executive Journal reader (Monthly Issue 01,
// page navigation and HubSpot subscription). Coverage moves to the new page, its menu item, language switch and old French address.
test.beforeEach(async({page})=>{await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))})});
test('Maandelijks Magazine opens from the menu and switches language without losing the page',async({page},info)=>{
 await page.goto('/index.html');if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
 await page.locator('#navlist a.l[href="journal.html"]').click();await expect(page).toHaveURL(/\/journal\.html$/);
 await expect(page.locator('h1')).toHaveText('Grow Faster Magazine');await expect(page.locator('#navlist a.l[href="journal.html"]')).toHaveAttribute('aria-current','page');
 await expect(page.locator('#editie-1 h2')).toHaveText('Overtypen, de verspilling die niemand ziet');
 await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();
 await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page).toHaveURL(/\/journal\.html$/);
 await expect(page.locator('#editie-1 h2')).toHaveText('La ressaisie, le gaspillage que personne ne voit');
 await expect(page.locator('#hero-abo')).toHaveAttribute('href','mailto:info@grow-faster.be?subject=Magazine');
 await expect(page.locator('main form')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('the old French Executive Journal address lands on the Maandelijks Magazine in French',async({page})=>{
 await page.goto('/journal-fr.html');await expect(page).toHaveURL(/\/journal\.html\?lang=fr$/);await expect(page.locator('html')).toHaveAttribute('lang','fr');
 await expect(page.locator('h1')).toHaveText('Grow Faster Magazine');
});
