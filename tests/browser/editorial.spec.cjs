const {test,expect}=require('playwright/test');

// Sprint 1 (22 Nov 2026): the customer hero has one pilot action (mailto) and one route to Orion.
for(const [language,heading,primary,secondary] of [
 ['nl','Minder tijd aan vragenlijsten. Meer tijd voor kwaliteit.','Plan een pilotgesprek','Zo werkt Orion'],
 ['fr','Moins de temps pour les questionnaires. Plus de temps pour la qualité.','Planifier un entretien pilote','Comment fonctionne Orion']
])test('minimal hero layout and Orion keyboard action in '+language,async({page})=>{
 await page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},language);
 for(const width of [390,768,1024,1440]){
  await page.setViewportSize({width,height:1000});await page.goto('/index.html');
  await expect(page.locator('#consent')).toBeHidden();await expect(page.locator('#hero h1')).toHaveText(heading);
  await expect(page.locator('#hero-pilot')).toContainText(primary);await expect(page.locator('#hero-pilot')).toHaveAttribute('href','mailto:erlendhollebosch@gmail.com?subject=Pilot%20Orion');await expect(page.locator('#hero-orion')).toContainText(secondary);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(await page.locator('#hero img').evaluate(async image=>{await image.decode();return image.naturalWidth>0})).toBe(true);
  const bounds=await page.locator('#hero h1,#hero .sub,#hero .btn').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,right:r.right,width:r.width,height:r.height,bottom:r.bottom}}));
  for(const r of bounds){expect(r.x).toBeGreaterThanOrEqual(0);expect(r.right).toBeLessThanOrEqual(width+1)}
  for(const r of bounds.slice(2)){expect(r.height).toBeGreaterThanOrEqual(44);expect(r.width).toBeGreaterThanOrEqual(44)}
 }
 await page.locator('#hero-orion').focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/orion\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',language);
});

// Replaces the former three editorial reading routes: the customer homepage offers three offer routes and a neutral confidentiality note.
for(const [language,heading,choices,headings]of [
 ['nl','Drie manieren om sneller te werken',['Product','Dienst en software','Begeleiding'],{'orion.html':'Uw klantvragenlijsten, ingevuld vanuit uw eigen documenten.','automatisering.html':'Workflow-automatisering'}],
 ['fr','Trois façons de travailler plus vite',['Produit','Service et logiciel','Accompagnement'],{'orion.html':'Vos questionnaires clients, remplis à partir de vos propres documents.','automatisering.html':'Automatisation des workflows'}]
])test(`customer home gives working offer routes in ${language}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(l=>{if(!localStorage.getItem('avs-lang'))localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},language);
  await page.goto('/index.html');await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+language+'"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang',language);await expect(page.locator('#aanbod h2')).toHaveText(heading);
  await expect(page.locator('#aanbod .eyebrow')).toHaveText(choices);await expect(page.locator('.lang-top [data-lang]')).toHaveCount(2);await expect(page.locator('[data-lang="de"], [lang="de"]')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  for(const [href,h1] of Object.entries(headings)){
   await page.locator('#aanbod a[href="'+href+'"]').click();await expect(page.locator('h1')).toHaveText(h1);await expect(page.locator('html')).toHaveAttribute('lang',language);
   await page.goto('/index.html');
  }
  await page.locator('#aanbod a[href="coherence.html"]').click();await expect(page).toHaveURL(/coherence\.html$/);await expect(page.locator('html')).toHaveAttribute('lang',language);
 await page.goto('/index.html#final');await expect(page.locator('#fn-h')).toBeInViewport();
 expect(errors).toEqual([]);
});
// The former "late book cover" scroll-anchoring regression is retired: the book covers and the selected-article link it
// guarded are no longer on the homepage (sprint 1). The scroll-anchoring CSS for .editorial-home is kept.

test('retired saved German migrates safely across pages and the simulation',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('avs-lang'))localStorage.setItem('avs-lang','de');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
 await page.goto('/index.html');await expect(page.locator('html')).toHaveAttribute('lang','nl');expect(await page.evaluate(()=>localStorage.getItem('avs-lang'))).toBe('nl');
 await expect(page.locator('[data-lang="de"], [lang="de"], meta[content="de_DE"]')).toHaveCount(0);
 await page.goto('/coherence.html');await expect(page.locator('html')).toHaveAttribute('lang','nl');await expect(page.locator('.lgx[lang="de"]')).toHaveCount(0);
 await page.goto('/coherence-sim.html?lang=de');await expect(page.locator('html')).toHaveAttribute('lang','nl');await page.locator('#b-step').click();await expect(page.locator('#b-reset')).toBeEnabled();
});
