const {test,expect}=require('playwright/test');const AxeBuilder=require('@axe-core/playwright').default;
for(const lang of ['nl','fr'])test('expanded navigation has accessible labels, contrast and targets in '+lang,async({page},info)=>{
 await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},lang);await page.goto('/index.html');
 if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
 for(const id of ['nav-coherence','nav-approach']){
  await page.locator('[aria-controls="'+id+'"]').click();await expect(page.locator('#'+id)).toBeVisible();
  const result=await new AxeBuilder({page}).include('.nav').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();await info.attach(id+'-'+lang,{body:JSON.stringify(result,null,2),contentType:'application/json'});expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
});

test('opening the mobile menu changes text colours without low-contrast intermediate frames',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/index.html');
 await page.locator('#burger').click();
 const frames=await page.locator('#navlist a.cur').evaluate(async e=>{
  const frames=[];
  for(let n=0;n<5;n++){
   frames.push({colour:getComputedStyle(e).color,transition:getComputedStyle(e).transitionDuration});
   await new Promise(requestAnimationFrame);
  }
  return frames;
 });
 for(const frame of frames){expect(frame.transition).toBe('0s');expect(frame.colour).toBe('rgb(0, 106, 156)')}
});
