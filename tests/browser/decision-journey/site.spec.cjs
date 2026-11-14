'use strict';
const {test,expect}=require('playwright/test');
const {headingReferenceCSS,contract}=require('../../../scripts/typography-audit.cjs');

for(const lang of ['nl','fr'])test(`${lang}: website entry and return preserve language and disclose the exercise boundary`,async({page})=>{
 await page.goto('/approach.html?lang='+lang);
 await expect(page.locator('#consent')).toBeVisible();
 await page.locator('#c-none').click();
 await expect(page.locator('#consent')).toBeHidden();
 const entry=page.locator('#decision-journey-entry'),open=entry.locator('#decision-journey-open');
 await expect(entry).toBeVisible();
 await expect(open).toHaveAttribute('href','decision-journey/?lang='+lang);
 await open.click();
 await expect(page).toHaveURL(new RegExp('/decision-journey/\\?lang='+lang+'$'));
 // A click can return at navigation commit. Deferred application scripts run
 // before DOMContentLoaded, matching the original direct-visit readiness.
 await page.waitForLoadState('domcontentloaded');
 await expect(page.locator('html')).toHaveAttribute('lang',lang);
 await expect(page.locator('#stage-title')).toBeVisible();
 await expect(page.locator('.prototype-notice')).toContainText(/ficti/i);
 // The standalone exercise must not bootstrap member, CMS or marketing clients.
 expect(await page.evaluate(()=>({member:typeof window.GFMember,cms:typeof window.GFCms,config:typeof window.GF_CMS_CONFIG,hs:typeof window.hbspt,forms:typeof window.HubSpotFormsV4}))).toEqual({member:'undefined',cms:'undefined',config:'undefined',hs:'undefined',forms:'undefined'});
 const other=lang==='nl'?'fr':'nl';
 await page.locator('[data-language="'+other+'"]').click();
 await expect(page.locator('#site-return')).toHaveAttribute('href','../approach.html?lang='+other+'#decision-journey-entry');
 await page.locator('#site-return').click();
 await expect(page).toHaveURL(new RegExp('/approach\\.html\\?lang='+other+'#decision-journey-entry$'));
 await page.waitForLoadState('domcontentloaded');
 await expect(page.locator('html')).toHaveAttribute('lang',other);
 await expect(page.locator('#decision-journey-entry')).toBeVisible();
});

test('the six exercise steps use the approved website type roles at the unchanged device viewport',async({page})=>{
 const expressions=Object.fromEntries(Object.entries(contract.headings).map(([level,spec])=>[level,headingReferenceCSS(spec)]));
 await page.goto('/decision-journey/');
 await expect(page.locator('#stage-title')).toBeVisible();
 for(let stage=0;stage<6;stage++){
  await page.locator('#journey button').nth(stage).click();
  if(stage===1)await page.locator('#dimension-process').check();
  const roles=await page.evaluate(expressions=>{
   const size=e=>parseFloat(getComputedStyle(e).fontSize);
   // Use the existing independent numeric contract through the engine's native
   // CSS resolver. InnerWidth rounding must not change the meaning of vw units.
   const reference=document.createElement('span');reference.textContent='Hg';reference.style.cssText='position:fixed;visibility:hidden;display:block';reference.style.setProperty('transition','none','important');reference.style.setProperty('animation','none','important');document.body.append(reference);
   const expected={};for(const [level,expression]of Object.entries(expressions)){reference.style.setProperty('font-size',expression,'important');expected[level]=size(reference);}reference.remove();
   return {expected,body:size(document.body),family:getComputedStyle(document.body).fontFamily,
    headings:[...document.querySelectorAll('h1,h2,h3,h4')].filter(e=>e.getClientRects().length).map(e=>({level:Number(e.tagName[1]),size:size(e)})),
    controls:[...document.querySelectorAll('button,input,select,textarea,label')].filter(e=>e.getClientRects().length).map(e=>({tag:e.tagName,size:size(e)}))};
  },expressions);
  // Independent sponsor-approved role values, not derived from component CSS.
  expect(roles.body).toBe(17);
  expect(roles.family.replaceAll('"','').replaceAll(' ','').toLowerCase()).toBe('aptos,hankengrotesk,segoeui,helvetica,arial,sans-serif');
  expect(roles.headings.length).toBeGreaterThan(0);
  for(const heading of roles.headings)expect(Math.abs(heading.size-roles.expected[heading.level])).toBeLessThanOrEqual(.06);
  expect(roles.controls.length).toBeGreaterThan(0);
  expect(roles.controls.filter(c=>c.size!==15)).toEqual([]);
 }
});
