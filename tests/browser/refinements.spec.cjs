const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{await page.addInitScript(()=>{localStorage.setItem('avs-lang','en');localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}))})});
test('home has a forward route and authors are credited in sources instead of promotional copy',async({page})=>{
 await page.goto('/index.html');await expect(page.locator('main')).not.toContainText('Jeanne Ross');await page.locator('.next-pg a').click();await expect(page).toHaveURL(/coherence\.html$/);
 await expect(page.locator('.book-foundation h3')).toHaveText('Research foundations');await expect(page.locator('.book-sources')).toContainText('Jeanne');
 await page.goto('/about.html');await expect(page.locator('#intellectual-foundation')).not.toContainText('Jeanne Ross');await expect(page.locator('#intellectual-foundation a')).toHaveAttribute('href','coherence.html#book-thesis');
});
test('10 and 20 percent expand with pointer or keyboard; 70 percent remains a fixed segment',async({page})=>{
 await page.goto('/coherence.html');const chart=page.locator('.lgx[lang="en"] .ec-split'),ten=chart.locator('.s10'),twenty=chart.locator('.s20');
 await expect(chart.locator('button')).toHaveCount(2);const before=await ten.boundingBox();await ten.click();await expect(ten).toHaveAttribute('aria-expanded','true');await expect(ten.locator('span')).toBeVisible();
 await expect.poll(async()=>Math.round((await ten.boundingBox()).width)).toBeGreaterThan(Math.round(before.width));
 await twenty.focus();await twenty.press('Enter');await expect(twenty).toHaveAttribute('aria-expanded','true');await expect(ten).toHaveAttribute('aria-expanded','false');await twenty.press('Escape');await expect(twenty).toHaveAttribute('aria-expanded','false');
 await expect(page.locator('.lgx[lang="en"] .ec-route')).toHaveCount(2);await expect(page.locator('.lgx[lang="en"] .ec-value-token')).toHaveCount(3);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('six insights have working multilingual deep links and history',async({page})=>{
 await page.goto('/insights.html');await expect(page.locator('.ins-list>.ins-card')).toHaveCount(6);
 for(const language of ['en','nl','fr']){if(language!=='en'){await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+language+'"]').click()}
 for(const id of ['design-the-exception','turn-time-into-value']){await page.locator('.ins-card[href="#'+id+'"]').click();await expect(page.locator('.ins-arts>.ins-art:visible')).toHaveCount(1);await expect(page.locator('#'+id+' [data-article-lang="'+language+'"]')).toBeVisible();}}
 await page.goBack();await expect(page.locator('#design-the-exception')).toBeVisible();
});
test('simulation current values share the same right alignment',async({page})=>{
 await page.goto('/coherence-sim.html?lang=nl');await expect(page.locator('.metric-current')).toHaveCount(6);
 const edges=await page.locator('.metric-current').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().right));expect(Math.max(...edges)-Math.min(...edges)).toBeLessThan(1);
 await page.locator('#b-step').click();await expect(page.locator('.metric-current')).toHaveCount(6);
});
