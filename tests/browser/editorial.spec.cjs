const {test,expect}=require('playwright/test');

// Sprint 1 (22 Nov 2026): the customer hero has one pilot action (mailto) and one route to Orion.
for(const [language,heading,primary,secondary] of [
 ['nl','Sneller werken met AI en automatisering.','Plan een pilotgesprek','Zo werkt Orion'],
 ['fr','Travailler plus vite grâce à l’IA et à l’automatisation.','Planifier un entretien pilote','Comment fonctionne Orion']
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

// v2 (22 Nov 2026): the pyramid "Van fundament tot AI" replaces the offer cards on the homepage; the cards moved to oplossingen.html.
// Layers are a list in reading order from the foundation; CSS shows layer 1 at the bottom. Every layer links to its offer.
for(const [language,heading,result,layers,headings]of [
 ['nl','Van fundament tot AI','Winst in tijd en geld',['Enterprise coherentie','Procesanalyse','Automatisering','AI'],{'coherence.html':null,'automatisering.html':'Wat uw team overtypt, gebeurt voortaan vanzelf.','orion.html':'Uw klantvragenlijsten, ingevuld vanuit uw eigen documenten.'}],
 ['fr','Des fondations à l’IA','Gain de temps et d’argent',['Cohérence d’entreprise','Analyse des processus','Automatisation','IA'],{'coherence.html':null,'automatisering.html':'Ce que votre équipe ressaisit se fait désormais tout seul.','orion.html':'Vos questionnaires clients, remplis à partir de vos propres documents.'}]
])for(const page of ['index.html','oplossingen.html'])test(`pyramid builds from foundation to AI and routes to the offer on ${page} in ${language}`,async({page:browserPage},info)=>{
 const p=browserPage,errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},language);
 const widths=info.project.use.isMobile?[390,320]:[1366];
 for(const width of widths){
  await p.setViewportSize({width,height:900});await p.goto('/'+page);await expect(p.locator('html')).toHaveAttribute('lang',language);
  const section=p.locator('.pyr').locator('xpath=ancestor::section');await expect(section.locator('h2')).toHaveText(heading);
  await expect(p.locator('.pyr-shape')).toHaveText(layers);await expect(p.locator('.pyr-result strong')).toHaveText(result);
  await expect(p.locator('.pyr-layers > li')).toHaveCount(4);
  const ys=await p.locator('.pyr-shape').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return{y:r.y,w:r.width}}));
  for(let i=1;i<4;i++){expect(ys[i].y,'layer '+(i+1)+' sits above layer '+i).toBeLessThan(ys[i-1].y);expect(ys[i].w).toBeLessThan(ys[i-1].w)}
  const resultBox=await p.locator('.pyr-result').boundingBox();expect(resultBox.y+resultBox.height).toBeLessThanOrEqual(ys[3].y+1);
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 for(const [href,h1] of Object.entries(headings)){
  await p.locator('.pyr a[href="'+href+'"]').first().click();await expect(p).toHaveURL(new RegExp(href.replace('.','\\.')+'$'));await expect(p.locator('html')).toHaveAttribute('lang',language);if(h1)await expect(p.locator('h1')).toHaveText(h1);
  await p.goto('/'+page);
 }
 await p.goto('/'+page+'#final');await expect(p.locator('#fn-h')).toBeInViewport();
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
