const {test,expect}=require('playwright/test');const AxeBuilder=require('@axe-core/playwright').default;
for(const lang of ['nl','en','fr'])test('expanded navigation has accessible labels, contrast and targets in '+lang,async({page},info)=>{
 await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},lang);await page.goto('/index.html');
 if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
 for(const id of ['nav-coherence','nav-approach']){
  await page.locator('[aria-controls="'+id+'"]').click();await expect(page.locator('#'+id)).toBeVisible();
  const result=await new AxeBuilder({page}).include('.nav').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();await info.attach(id+'-'+lang,{body:JSON.stringify(result,null,2),contentType:'application/json'});expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
});
