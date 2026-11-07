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



test('reader keeps controls and subscription visible around a landscape page',async({page})=>{
 for(const viewport of [{width:1366,height:900},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  for(const route of ['/journal.html','/journal-fr.html']){
   await page.goto(route);
   await expect(page.locator('.toolbar')).toBeVisible();
   await expect.poll(async()=>{
    const box=await page.locator('#p1').boundingBox();
    return Math.abs(box.width/box.height-297/210);
   }).toBeLessThan(.01);
   for(const target of ['#p1','#p2','#p14','#p15']){
    await page.goto(route+target);
    await expect(page.locator(target)).toBeVisible();
    for(const selector of ['.toolbar','.reader-links','.signup']){
     await expect(page.locator(selector)).toBeInViewport({ratio:1});
    }
    const sheet=await page.locator(target).boundingBox();
    const footer=await page.locator('.signup').boundingBox();
    expect(sheet.y+sheet.height).toBeLessThanOrEqual(footer.y+1);
   }
   await page.locator('[data-zoom]').click();
   await expect(page.locator('[data-zoom]')).toHaveAttribute('aria-pressed','true');
   await expect(page.locator('.toolbar')).toBeInViewport({ratio:1});
   await expect(page.locator('.signup')).toBeInViewport({ratio:1});
  }
 }
});
