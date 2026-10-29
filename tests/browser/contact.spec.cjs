const {test,expect}=require('playwright/test');
const fs=require('node:fs'),path=require('node:path');
test('Contact menus on every public page link to the top',async()=>{
  const root=path.resolve(__dirname,'../../dist');let pages=0;
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
    const html=fs.readFileSync(path.join(root,file),'utf8'),nav=html.match(/<nav\b[\s\S]*?<\/nav>/i);
    if(!nav)continue;pages++;
    expect(nav[0],file).toMatch(/class="[^"]*nav-cta[^"]*"[^>]*href="about\.html"/);
    expect(html,file).not.toContain('href="about.html#contact">Contact</a>');
  }
  expect(pages).toBe(12);
});
test('Contact opens at top from another page and from the scrolled About page',async({page})=>{await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}))});async function contact(){const link=page.locator('.nav .nav-cta');if(!await link.isVisible())await page.locator('#burger').click();await expect(link).toHaveAttribute('href','about.html');await link.click();await expect(page).toHaveURL(/\/about\.html$/);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(8)}await page.goto('/index.html');await contact();await page.goto('/about.html#contact');await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(100);await contact();});
