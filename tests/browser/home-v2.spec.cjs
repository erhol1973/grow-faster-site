const {test,expect}=require('playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {audit}=require('../support/axe-audit.cjs');
// Homepage redesign v2 (25 Nov 2026, docs/home-redesign/BRIEF.md). Structure and copy are unit-tested in tests/home-v2.test.cjs;
// these cases cover what only a browser shows: layout width, the runtime language switch and axe on the French rendering.
// The Dutch axe scan of index.html stays in accessibility.spec.cjs (navigation-cases pages).
// Sponsor decision 25 Nov 2026 10:11: #proof ("Ervaring uit de praktijk") and #final ("Test Orion op uw eigen vragenlijsten") removed from the homepage.
const ORDER=['hero','toepassingen','terugkerend','aanpak','fundament','kloof','vertrouwelijk'];
// Expected French = what i18n.js followed by i18n-home.js define (same order and context as index.html).
const I18N=(()=>{const dist=path.resolve(__dirname,'..','..','dist'),c={window:{}};for(const f of ['assets/i18n.js','assets/i18n-home.js'])vm.runInNewContext(fs.readFileSync(path.join(dist,f),'utf8'),c);return c.window.I18N})();
const init=async(page,lang='nl')=>page.addInitScript(l=>{localStorage.setItem('avs-lang',l);localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))},lang);
test('Orion leads the four applications and the pilot remains the first hero action',async({page},info)=>{
  await init(page);
  await page.goto('/index.html');
  const hero=page.locator('#hero');
  await hero.locator('#hero-pilot').focus();
  await page.keyboard.press('Tab');
  await expect(hero.locator('#hero-orion')).toBeFocused();
  const cards=page.locator('#toepassingen .toep-kaart');
  await expect(cards).toHaveCount(4);
  const orion=cards.first();
  await expect(cards.locator('.toep-part')).toHaveCount(12);
  await orion.scrollIntoViewIfNeeded();
  await expect(orion).toHaveAttribute('id','toep-kwaliteit');
  const demo=page.locator('.toep-demo');
  await expect(demo.locator('xpath=ancestor::a')).toHaveCount(0);
  await expect(orion).toHaveAccessibleName(/^Orion Kwaliteit in de voedingsproductie.*Zo werkt Orion$/);
  await expect(demo.locator('figcaption')).toHaveText('Orion · fictief voorbeeld');
  await expect(demo.locator('dt')).toHaveText(['Klantvraag','Voorstel van Orion','Bron','Goedkeuring']);
  await expect(demo.locator('dd').last()).toHaveText('Wacht op goedkeuring door het kwaliteitsteam.');
  const [lead,...related]=await cards.evaluateAll(items=>items.map(item=>{
    const {width,top}=item.closest('.toep-voorbeeld, .toep-casus').getBoundingClientRect();
    return {width,top};
  }));
  if(info.project.use.isMobile){
    expect(related.every(card=>Math.abs(card.width-lead.width)<1)).toBe(true);
    expect(related.every((card,index)=>card.top>(index===0?lead:related[index-1]).top)).toBe(true);
  }else{
    expect(lead.width).toBeGreaterThan(related.reduce((sum,card)=>sum+card.width,0));
    expect(related.every(card=>Math.abs(card.top-related[0].top)<1)).toBe(true);
  }
  await page.locator('#lang-btn-top').click();
  await page.locator('.lang-top [data-lang="fr"]').click();
  await expect(demo.locator('figcaption')).toHaveText('Orion · exemple fictif');
  await expect(demo.locator('dt')).toHaveText(['Question du client','Proposition d’Orion','Source','Validation']);
  await expect(demo.locator('dd').last()).toHaveText('En attente de validation par l’équipe qualité.');
  await expect(orion).toHaveAccessibleName(/^Orion Qualité dans la production alimentaire.*Comment fonctionne Orion$/);
  const galleries=page.locator('#toepassingen .toep-fotos');
  await expect(galleries).toHaveCount(4);
  for(const gallery of await galleries.all())await expect(gallery.locator('img[loading="lazy"]')).toHaveCount(3);
  await expect(galleries.first().locator('figcaption').first()).toHaveText('Contrôle qualité sur la ligne de conditionnement');
  await expect(page.locator('.toep-beeldnoot')).toHaveText('Les photos ont été générées à titre d’illustration.');
});
async function overflow(page){
  await page.addStyleTag({content:'*{content-visibility:visible!important}'});
  return page.evaluate(ids=>{const vw=document.documentElement.clientWidth,out=[];
    if(document.documentElement.scrollWidth>vw+1)out.push(`document ${document.documentElement.scrollWidth} > ${vw}`);
    for(const id of ids){const s=document.getElementById(id);if(!s)continue;
      for(const e of [s,...s.querySelectorAll('*')]){const st=getComputedStyle(e);if(st.display==='none'||st.visibility==='hidden'||e.closest('.sr,[hidden]'))continue;
        const r=e.getBoundingClientRect();if(r.width&&(r.right>vw+1||r.left<-1))out.push(`#${id} ${e.tagName.toLowerCase()}.${[...e.classList].join('.')} ${Math.round(r.left)}..${Math.round(r.right)} of ${vw}`)}}
    return out.slice(0,10)},ORDER);
}

for(const width of [360,1440])for(const lang of ['nl','fr'])test(`homepage has no horizontal overflow at ${width}px (${lang})`,async({browser},info)=>{
  test.skip(info.project.use.isMobile,'explicit viewport widths; the mobile project runs the language case below');
  const ctx=await browser.newContext({viewport:{width,height:900}});const page=await ctx.newPage();await init(page,lang);
  await page.goto('/index.html');await expect(page.locator('html')).toHaveAttribute('lang',lang);
  for(const id of ORDER)await expect(page.locator('#'+id),`#${id} is rendered`).toBeVisible();
  expect(await overflow(page)).toEqual([]);
  await ctx.close();
});

// Review finding 25 Nov 2026: the running-text reading width (68ch) must not narrow the pyramid rows, or the layers wrap unevenly.
test('pyramid rows keep their full width at 1440px',async({browser},info)=>{
  test.skip(info.project.use.isMobile,'desktop layout only');
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();await init(page,'nl');
  await page.goto('/index.html');
  const pyramid=page.locator('#fundament .pyr');
  await pyramid.scrollIntoViewIfNeeded();
  await expect(pyramid.locator('.pyr-l').first()).toHaveCSS('animation-name','none');
  const widths=await page.locator('#fundament .pyr-l').evaluateAll(rows=>rows.map(r=>r.getBoundingClientRect().width));
  expect(widths).toHaveLength(4);for(const w of widths)expect(w).toBeGreaterThanOrEqual(900);
  await ctx.close();
});

test('the French switch translates every new heading, eyebrow, card label and the calculation label',async({page})=>{
  await init(page);await page.goto('/index.html');
  const sel=ORDER.slice(1).map(id=>`#${id} h2, #${id} h3, #${id} .eyebrow, #${id} [class*="-eyebrow"]`).join(', ')+', #toepassingen [data-cms*="-label-"], [data-cms="home-v2-rec-calc-label"], [data-cms="home-v2-hero-reassure"]';
  const nl=await page.locator(sel).evaluateAll(els=>els.filter(e=>!e.querySelector('a,[data-notr]')&&!e.closest('[data-notr]')).map(e=>e.textContent.replace(/\s+/g,' ').trim()).filter(Boolean));
  const expected=nl.filter(t=>I18N[t]);
  expect(nl.length,'new homepage headings found').toBeGreaterThanOrEqual(20);
  expect(nl.filter(t=>!I18N[t]),'headings and labels without a translation key').toEqual([]);
  await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang','fr');
  const fr=await page.locator(sel).evaluateAll(els=>els.filter(e=>!e.querySelector('a,[data-notr]')&&!e.closest('[data-notr]')).map(e=>e.textContent.replace(/\s+/g,' ').trim()).filter(Boolean));
  const norm=s=>s.replace(/[  ]/g,' ');
  expect(fr.map(norm)).toEqual(nl.map(t=>norm(I18N[t]?.[1]||t)));
  expect(expected.length).toBe(nl.length);
  // Sample headings named explicitly so a failure reads as content, not as a selector problem.
  await expect(page.locator('#terugkerend h2')).toHaveText(/^Quel travail répétitif coûte du temps à votre équipe\s\?$/);
  await expect(page.locator('#aanpak h2')).toHaveText('Notre façon de démarrer');
  await expect(page.locator('[data-cms="home-v2-rec-calc-label"]')).toHaveText('Exemple de calcul');
  // Switching back restores Dutch without a reload.
  await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="nl"]').click();
  await expect(page.locator('#aanpak h2')).toHaveText('Zo starten we');
});

test('French homepage passes the automatic WCAG scan at 360px',async({browser},info)=>{
  test.skip(info.project.use.isMobile,'explicit viewport width');
  const ctx=await browser.newContext({viewport:{width:360,height:800}});const page=await ctx.newPage();await init(page,'fr');
  await page.goto('/index.html');await expect(page.locator('html')).toHaveAttribute('lang','fr');
  await page.locator('footer').scrollIntoViewIfNeeded();await page.locator('h1').scrollIntoViewIfNeeded();
  await audit(page,info,'home-v2-fr-360');
  await ctx.close();
});
