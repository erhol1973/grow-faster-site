const {test,expect}=require('playwright/test');
async function seed(page,c={v:3,ext:false,ana:false,ts:Date.now()}){await page.addInitScript(c=>{localStorage.setItem('avs-lang','nl');if(c)localStorage.setItem('avs-consent',JSON.stringify(c));else localStorage.removeItem('avs-consent')},c)}
async function stubs(page){
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.route('https://gc.zgo.at/count.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:`window.__analyticsLoaded=(window.__analyticsLoaded||0)+1;window.goatcounter.count=function(){window.__counts=(window.__counts||0)+1};if(!window.goatcounter.no_onload)window.goatcounter.count();`}));
}
test('actual language switching persists between pages and selected article',async({page})=>{
  await seed(page);await page.goto('/insights.html');
  for(const [language,label]of Object.entries({fr:'FR-BE',en:'EN',nl:'NL-BE'})){
    await page.locator('#lang-btn-top').click();await page.locator('.lang-top .lang-menu [data-lang="'+language+'"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('#lang-btn-top .lang-cur')).toHaveText(label);
    await expect(page.locator('#ai-pilot [data-article-lang="'+language+'"]')).toBeVisible();
  }
  const contact=page.locator('.nav a[href="about.html"]');if(!await contact.isVisible())await page.locator('#burger').click();await contact.click();await expect(page.locator('html')).toHaveAttribute('lang','nl');
});
test('partial consent loads fonts only and rejection stops optional resources',async({page})=>{
  await seed(page,null);await stubs(page);await page.goto('/index.html');await page.locator('#c-cust').click();
  await page.locator('label[for="c-ext"]').click();await expect(page.locator('#c-ext')).toBeChecked();await page.locator('#c-save').click();await expect(page.locator('#gf')).toHaveCount(1);await expect(page.locator('#gc')).toHaveCount(0);
  await page.locator('.open-consent').first().click();await page.locator('#c-none').click();await expect(page.locator('#gf')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__analyticsLoaded||0)).toBe(0);await expect(page.locator('body')).not.toHaveClass(/locked/);
});
test('accept, withdraw and accept analytics again without leaving active trackers',async({page})=>{
  await seed(page,null);await stubs(page);await page.goto('/index.html');await page.locator('#c-all').click();
  await expect.poll(()=>page.evaluate(()=>window.__counts||0)).toBe(1);
  await page.locator('.open-consent').first().click();await page.locator('#c-none').click();
  await page.evaluate(()=>{window.goatcounter.count();document.dispatchEvent(new MouseEvent('click',{bubbles:true}));window.dispatchEvent(new Event('hashchange'))});
  expect(await page.evaluate(()=>window.__counts)).toBe(1);await expect(page.locator('#gc')).toHaveCount(0);
  await page.locator('.open-consent').first().click();await page.locator('#c-all').click();await expect.poll(()=>page.evaluate(()=>window.__counts)).toBe(2);
});
test('withdrawal during a delayed analytics download never records a pageview',async({page})=>{
  await seed(page,null);let release;const wait=new Promise(r=>release=r);let requested=false;
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.route('https://gc.zgo.at/count.js',async r=>{requested=true;await wait;await r.fulfill({status:200,contentType:'text/javascript',body:`window.goatcounter.count=function(){window.__counts=(window.__counts||0)+1};if(!window.goatcounter.no_onload)window.goatcounter.count()`}).catch(()=>{})});
  await page.goto('/index.html');await page.locator('#c-all').click();await expect.poll(()=>requested).toBe(true);
  await page.locator('.open-consent').first().click();await page.locator('#c-none').click();release();
  await expect(page.locator('#gc')).toHaveCount(0);expect(await page.evaluate(()=>window.__counts||0)).toBe(0);
});
for(const [name,change]of Object.entries({future:{ts:Date.now()+864e5},wrongBoolean:{ana:'false'}}))test(`invalid ${name} consent is not silently accepted`,async({page})=>{
  await seed(page,{v:3,ext:false,ana:false,ts:Date.now(),...change});const optional=[];page.on('request',r=>{if(/gc\.zgo|googleapis/.test(r.url()))optional.push(r.url())});await page.goto('/index.html');await expect(page.locator('#consent')).toBeVisible();expect(optional).toEqual([]);
});
test('tablet viewport and 200 percent text retain readable navigation and content',async({page},info)=>{
  test.skip(info.project.name!=='chromium','Tablet/text review is a dedicated Chromium viewport scenario');
  await seed(page);await page.setViewportSize({width:768,height:1024});await page.goto('/insights.html');
  await page.addStyleTag({content:'html{font-size:200%!important}'});await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
  const contact=page.locator('.nav .nav-cta');if(!await contact.isVisible())await page.locator('#burger').click();await contact.click();await expect(page).toHaveURL(/about\.html$/);
});
test('calculator displays the independently specified full-coherence capacity fixture',async({page})=>{
  await seed(page);await page.goto('/approach.html');for(let i=0;i<8;i++)await page.locator(`#dg-rows button[data-i="${i}"][data-v="5"]`).click();
  for(const [key,value]of Object.entries({vol:'1200',time:'60',cost:'60',cycle:'10',rout:'50',auto:'50',red:'50',gen:'20',ov:'10',cyc:'50'})){
    const input=page.locator('#i-'+key);if(await input.getAttribute('type')==='range')await input.evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},value);else await input.fill(value);
  }
  const values=await page.locator('#scen .metric > b').allTextContents();expect(values[0]).toMatch(/240/);expect(values.join(' ')).toMatch(/450/);expect(values.join(' ')).toMatch(/810/);
  await page.locator('#i-vol').fill('0');await expect(page.locator('#scen')).not.toContainText(/NaN|Infinity/);
});
test('keyboard reaches the footer through deferred Home chapters',async({page})=>{
  await seed(page);await page.goto('/index.html');let reached=false;
  for(let i=0;i<130;i++){await page.keyboard.press('Tab');reached=await page.evaluate(()=>!!document.activeElement?.closest('footer'));if(reached)break}
  expect(reached).toBe(true);
});
