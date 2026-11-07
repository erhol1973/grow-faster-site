const {test,expect}=require('playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
for(const lang of ['nl','fr'])test('expanded workshop and request are accessible in '+lang,async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()})));
 await page.goto('/workshop.html?lang='+lang);await expect(page.locator('html')).toHaveAttribute('lang',lang);
 if(!await page.locator('#voorbeeldplan').evaluate(e=>e.open))await page.locator('#voorbeeldplan>summary').click();
 for(const summary of await page.locator('.ws-faq>summary').all())await summary.click();
 await page.evaluate(()=>document.addEventListener('click',e=>{if(e.target.closest('a[href^="mailto:"]'))e.preventDefault()},true));
 await page.locator('#request-question').fill('AI application: review and ownership');await page.locator('#request-form button[type="submit"]').click();
 await page.locator('#draft-details>summary').click();await page.addStyleTag({content:'*{content-visibility:visible!important}'});
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
 await info.attach('workshop-'+lang,{body:JSON.stringify(result,null,2),contentType:'application/json'});
 expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
});
