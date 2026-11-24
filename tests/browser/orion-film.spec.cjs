const {test,expect}=require('playwright/test');
// The Orion film follows the page language: French source and poster after switching, back to Dutch after switching back.
test('Orion film switches between the Dutch and French editions with the language',async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
  const films=[];page.on('request',r=>{if(/orion-werking-(nl|fr)\.mp4/.test(r.url()))films.push(r.url())});
  await page.goto('/index.html');
  const v=page.locator('#orion-film video');await v.scrollIntoViewIfNeeded();await expect(v).toBeVisible();
  await expect(v.locator('source')).toHaveAttribute('src','media/orion-werking-nl.mp4');
  await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();
  await expect(v.locator('source')).toHaveAttribute('src','media/orion-werking-fr.mp4');await expect(v).toHaveAttribute('poster','img/orion-werking-fr.webp');
  await expect(page.locator('#orion-film-text summary')).toHaveText('Texte à l’écran');
  await expect(page.locator('#orion-film-text strong').first()).toHaveText('Deux flux alimentent Orion.');
  await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="nl"]').click();
  await expect(v.locator('source')).toHaveAttribute('src','media/orion-werking-nl.mp4');
  expect(films,'no film is downloaded before the visitor presses play').toEqual([]);
  // Pressing play after a switch to French plays the French edition.
  await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();
  await v.evaluate(e=>e.play().catch(()=>{}));
  await expect.poll(()=>v.evaluate(e=>e.currentSrc)).toMatch(/orion-werking-fr\.mp4$/);
  const box=await v.boundingBox();expect(box.width).toBeGreaterThan(200);expect(Math.abs(box.width/box.height-16/9)).toBeLessThan(.05);
});
