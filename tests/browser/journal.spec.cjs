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
test('complete Dutch and French editions fit every landscape sheet without truncation',async({page})=>{
 await page.setViewportSize({width:1366,height:900});
 for(const route of ['/journal.html','/journal-fr.html']){
  await page.goto(route);
  for(let n=1;n<=15;n++){
   await page.evaluate(index=>{location.hash='p'+index},n);
   const sheet=page.locator('#p'+n);
   await expect(sheet).toBeVisible();
   const layout=await sheet.evaluate(e=>{
    const footer=e.querySelector('.paper-footer');
    const content=footer.previousElementSibling;
    return {overflow:e.scrollHeight-e.clientHeight,overlap:content.getBoundingClientRect().bottom-footer.getBoundingClientRect().top};
   });
   expect(layout.overflow,route+' page '+n+' overflows').toBeLessThanOrEqual(1);
   expect(layout.overlap,route+' page '+n+' overlaps its footer').toBeLessThanOrEqual(1);
  }
 }
});

test('cover chart retains source colours, common year scale and editorial reading order',async({page})=>{
 for(const route of ['/journal.html','/journal-fr.html']){
  await page.goto(route);
  const chart=page.locator('.timeline-plot');
  const result=await chart.evaluate(e=>{
   const colour=s=>getComputedStyle(e.querySelector(s)).backgroundColor;
   const plot=e.getBoundingClientRect(), marker=e.querySelector('.departure-marker').getBoundingClientRect();
   return {grace:colour('.grace'),window:colour('.ceo-window'),stages:[...e.querySelectorAll('.stages>span')].map(s=>getComputedStyle(s).backgroundColor),position:(marker.left-plot.left)/plot.width,graceWidth:e.querySelector('.grace').getBoundingClientRect().width/plot.width,tenureWidth:e.querySelector('.ceo-window').getBoundingClientRect().right-plot.left};
  });
  expect(result.grace).toBe('rgb(248, 187, 64)');
  expect(result.window).toBe('rgb(232, 242, 252)');
  expect(new Set(result.stages).size).toBe(4);
  expect(result.position).toBeCloseTo(.71,2);
  expect(result.graceWidth).toBeCloseTo(.20,2);
  await page.goto(route+'#p2');
  const order=await page.locator('#p2 .paper-content').evaluate(e=>[...e.children].slice(1,4).map(x=>x.className||x.tagName));
  expect(order).toEqual(['deck','byline','H2']);
 }
});

test('journal promotion follows selected language and return link restores it',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 for(const [lang,title,cta,route] of [['nl','De Maandelijkse Executive Journal','Lees editie 01','journal.html'],['fr','Le Journal Exécutif Mensuel','Lire le numéro 01','journal-fr.html']]){
  await page.goto('/insights.html?lang='+lang+'#executive-journal');
  const promo=page.locator('#executive-journal');
  await expect(promo.getByText(title,{exact:true})).toBeVisible();
  await expect(promo.locator('[data-article-lang]:visible')).toHaveCount(1);
  await expect(promo.locator('a:visible')).toHaveCount(1);
  await promo.getByRole('link',{name:cta}).click();
  await expect(page).toHaveURL(new RegExp(route+'$'));
  await page.locator('.return-link').click();
  await expect(page).toHaveURL(new RegExp('insights.html\\?lang='+lang+'#executive-journal$'));
  await expect(promo.getByText(title,{exact:true})).toBeInViewport();
 }
});

test('side arrows frame the page and text magnification stays usable',async({page})=>{
 for(const viewport of [{width:1366,height:900},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  await page.goto('/journal.html#p2');
  const prev=page.locator('[data-prev]'),next=page.locator('[data-next]');
  await expect(prev).toBeInViewport({ratio:1});await expect(next).toBeInViewport({ratio:1});
  const left=await prev.boundingBox(),right=await next.boundingBox(),paper=await page.locator('#p2').boundingBox();
  expect(left.x+left.width).toBeLessThanOrEqual(paper.x+1);
  expect(right.x).toBeGreaterThanOrEqual(paper.x+paper.width-1);
  const before=await page.locator('#p2 .deck').boundingBox();
  await page.locator('[data-bigger]').click();await page.locator('[data-bigger]').click();
  const after=await page.locator('#p2 .deck').boundingBox();
  expect(after.height).toBeGreaterThan(before.height);
  await expect(page.locator('.return-link')).toBeInViewport({ratio:1});
  await expect(page.locator('.signup')).toBeInViewport({ratio:1});
  await next.click();await expect(page.locator('#p3')).toBeVisible();
  await page.locator('[data-zoom]').click();await expect(page.locator('[data-zoom]')).toHaveAttribute('aria-pressed','false');
 }
});
