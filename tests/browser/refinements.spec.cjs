const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))})});
// Sprint 1: the customer homepage ends with the pilot action. Release 2: Insights ends with its own contact block, so Coherentie is opened directly.
test('home has a forward route and authors are credited in sources instead of promotional copy',async({page})=>{
 await page.goto('/index.html');await expect(page.locator('main')).not.toContainText('Jeanne Ross');await expect(page.locator('#final a[href^="afspraak.html"]')).toHaveCount(1);await expect(page.locator('#final a[href^="mailto:"]')).toHaveCount(0);await page.goto('/coherence.html');
 // Coherence for kmo's (23 Nov 2026): the research foundations left Coherentie; its figures credit their authors in the source line.
 await expect(page.locator('.book-foundation')).toHaveCount(0);await expect(page.locator('#cijfers .bron').first()).toContainText('Sull');
 // Release 1.1: About no longer has the intellectual-foundations block; it must not name researchers in promotional copy either.
 await page.goto('/about.html');await expect(page.locator('main')).not.toContainText('Jeanne Ross');await expect(page.locator('#intellectual-foundation')).toHaveCount(0);
});
// Coherence for kmo's (23 Nov 2026): the research chart (10/20/70 percent) left coherence.html with the approved text.
// Release 2 (23 Nov 2026): Insights for kmo's shows three articles as sections; language switching keeps the reader at the article.
test('Insights articles have working anchors in both languages and history',async({page})=>{
 await page.goto('/insights.html');await expect(page.locator('.art-list>a')).toHaveCount(3);
 for(const language of ['nl','fr']){if(language!=='nl'){await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+language+'"]').click()}
 for(const id of ['design-the-exception','turn-time-into-value']){await page.locator('.art-list a[href="#'+id+'"]').click();await expect(page).toHaveURL(new RegExp('#'+id+'$'));await expect(page.locator('#'+id+'-h')).toBeInViewport();}}
 await expect(page.locator('#turn-time-into-value-h')).toHaveText('Vous gagnez du temps grâce à l’IA. Qu’en faites-vous ?');
 await page.goBack();await expect(page).toHaveURL(/#design-the-exception$/);
});
test('simulation current values share the same right alignment',async({page})=>{
 await page.goto('/coherence-sim.html?lang=nl');await expect(page.locator('.metric-current')).toHaveCount(6);
 const edges=await page.locator('.metric-current').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().right));expect(Math.max(...edges)-Math.min(...edges)).toBeLessThan(1);
 await page.locator('#b-step').click();await expect(page.locator('.metric-current')).toHaveCount(6);
});
