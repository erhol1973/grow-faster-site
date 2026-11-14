'use strict';
const {test,expect}=require('playwright/test');
const {captureRouteScreenshots}=require('../../../scripts/typography-audit.cjs');
test.use({viewport:{width:768,height:1024}});
test('tablet768px retains all essential FR controls and readable shared type roles',async({page},info)=>{
 await page.goto('/decision-journey/');expect(await page.evaluate(()=>innerWidth)).toBe(768);await page.locator('[data-language="fr"]').click();await page.locator('.case-card').nth(1).click();
 for(let n=0;n<6;n++){
  await page.locator('#journey button').nth(n).click();if(n===1){await page.locator('#dimension-process').check();await page.locator('#dimension-data').check();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const sizes=await page.evaluate(()=>({body:parseFloat(getComputedStyle(document.body).fontSize),h1:parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),h2:parseFloat(getComputedStyle(document.querySelector('#stage-title')).fontSize)}));expect(sizes.body).toBe(17);expect(sizes.h1).toBeCloseTo(46.08,1);expect(sizes.h2).toBe(32);
  for(const b of await page.getByRole('button').all())if(await b.isVisible()){const box=await b.boundingBox();expect(box.width).toBeGreaterThanOrEqual(24);expect(box.height).toBeGreaterThanOrEqual(24);}
 }
 await expect(page.locator('#report-output')).toContainText('11.');await expect(page.locator('#roadmap-report-output')).toContainText('PLAN À 90 JOURS — PROPOSITION FICTIVE');
 // The integrated shared font can make this complete three-part dossier exceed
 // WebKit's32767-physical-pixel cap. Keep the native viewport/DPR and verify full
 // overlapping-tile coverage with the existing website screenshot helper.
 await captureRouteScreenshots(page,info,'tablet-fr-report',{fullPage:true});
});
