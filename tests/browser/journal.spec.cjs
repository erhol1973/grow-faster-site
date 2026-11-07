const {test,expect}=require('playwright/test');

test('monthly journal opens from its menu and preserves page when switching language',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/index.html');
 const burger=page.locator('#burger');
 if(await burger.isVisible())await burger.click();
 await page.locator('#navlist a[href="insights.html"]').click();
 await expect(page).toHaveURL(/insights\.html$/);
 await page.getByRole('link',{name:'Lees editie 01'}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','nl');
 await expect(page.locator('.sheet:visible')).toHaveAttribute('id','p1');
 await page.getByRole('button',{name:/Volgende/}).click();
 await expect(page.locator('.sheet:visible')).toHaveAttribute('id','p2');
 await page.getByRole('link',{name:'Français'}).click();
 await expect(page.locator('html')).toHaveAttribute('lang','fr');
 await expect(page.locator('.sheet:visible')).toHaveAttribute('id','p2');
 await page.keyboard.press('ArrowRight');
 await expect(page.locator('.sheet:visible')).toHaveAttribute('id','p3');
 await page.locator('#p3 a[href="#source-1"]').first().click();
 await expect(page.locator('.sheet:visible')).toHaveAttribute('id','p15');
 await expect(page.getByRole('button',{name:/Suivante/})).toBeDisabled();
 await page.getByRole('button',{name:/Précédente/}).click();
 await expect(page.locator('#p14 figure img')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});


test('journal uses a portrait A4 page on desktop',async({page})=>{
 await page.setViewportSize({width:1366,height:900});
 for(const route of ['/journal.html','/journal-fr.html']){
  await page.goto(route);
  const box=await page.locator('#p1').boundingBox();
  expect(box.width).toBeCloseTo(210*96/25.4,0);
  expect(box.height/box.width).toBeCloseTo(297/210,2);
  await page.locator('a[href="#p15"]').first().click();
  await expect(page.locator('#p15')).toBeVisible();
  const sources=await page.locator('#p15').boundingBox();
  expect(sources.height).toBeGreaterThan(sources.width);
 }
});

