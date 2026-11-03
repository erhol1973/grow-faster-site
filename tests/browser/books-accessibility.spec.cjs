const {test,expect}=require('playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
for(const language of ['en','nl','fr'])test('book catalogue is accessible in '+language,async({page},info)=>{
 await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}))},language);
 await page.goto('/books.html');await page.locator('.books-workshop').scrollIntoViewIfNeeded();await page.locator('h1').scrollIntoViewIfNeeded();
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();await info.attach('books-'+language,{body:JSON.stringify(result,null,2),contentType:'application/json'});
 expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
});
