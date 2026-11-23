const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))) });
// Coherence for kmo's (23 Nov 2026): coherence.html ends with its own call to action instead of a next-page link.
test('Coherence ends with the conversation call to action and no next-page link',async({page})=>{await page.goto('/coherence.html?lang=fr');await expect(page.locator('html')).toHaveAttribute('lang','fr');await expect(page.locator('.next-pg')).toHaveCount(0);await expect(page.locator('#contact-gesprek')).toHaveAttribute('href','mailto:erlendhollebosch@gmail.com?subject=Coherentie');});
for(const lang of ['nl','fr']){
 test(`left alignment and requested next-page route (${lang})`,async({page})=>{
  for(const route of ['transformation.html','operating-model.html','eca.html']){
   await page.goto('/'+route+'?lang='+lang);await expect(page.locator('html')).toHaveAttribute('lang',lang);
   const points=await page.evaluate(()=>{const selectors=location.pathname.includes('transformation')?['.practice-intro h1',...Array.from(document.querySelectorAll('.practice-prose>h2')).map(e=>'#'+e.id)]:location.pathname.includes('operating')?['#operating h2','.shift[data-ih="shift"]','.shift[data-ih="drights"]']:['.eca h1','.eca-toolbar'];return selectors.map(s=>document.querySelector(s).getBoundingClientRect().left)});expect(Math.max(...points)-Math.min(...points)).toBeLessThan(2);
  }
  // Sprint 1: the customer homepage ends with the pilot call to action; the remaining three next-page steps stay covered.
  await page.goto('/index.html?lang='+lang);await expect(page.locator('.next-pg')).toHaveCount(0);
  for(const [route,dest]of Object.entries({'insights.html':'coherence.html','approach.html':'about.html'})){await page.goto('/'+route+'?lang='+lang);await expect(page.locator('html')).toHaveAttribute('lang',lang);await expect(page.locator('.next-pg a')).toHaveAttribute('href',dest);await page.locator('.next-pg a').click();await expect(page).toHaveURL(new RegExp('/'+dest.replace('.','\\.')+'$'))}
 });
}

// Release 1: the 44-second commercial and its per-language/playback/schema cases were removed from coherence.html by owner decision;
// the essentie film cases below cover language, lazy loading, playback, poster and the text alternative.
// Release 1: the blue Enterprise Coherence essentie film (NL/FR from closed PR #84) sits after the website argument on coherence.html.
for(const [lang,src,poster,summary] of [['nl','media/enterprise-coherence-essentie-nl.mp4','img/enterprise-coherence-essentie.webp','Tekst in beeld'],['fr','media/enterprise-coherence-essentie-fr.mp4','img/enterprise-coherence-essentie-fr.webp','Texte à l’écran']])test(`Enterprise Coherence film uses the ${lang} edition, plays on request and offers its text`,async({page})=>{
 await page.goto('/coherence.html?lang='+lang);await expect(page.locator('html')).toHaveAttribute('lang',lang);
 const video=page.locator('#home-film video');await expect(video).toHaveAttribute('preload','none');await expect(video).toHaveAttribute('poster',poster);await expect(video.locator('source')).toHaveAttribute('src',src);
 expect(await video.evaluate(v=>v.paused&&!v.autoplay)).toBe(true);await expect(video).toHaveAccessibleName('Enterprise Coherence');
 await video.scrollIntoViewIfNeeded();await video.evaluate(v=>v.play());await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(0);await video.evaluate(v=>v.pause());
 const text=page.locator('#ec-film-text');await expect(text.locator('summary')).toHaveText(summary);await text.locator('summary').click();await expect(text.locator('li')).toHaveCount(5);await expect(text.locator('li').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('Enterprise Coherence film switches edition with the language without reloading the page',async({page})=>{
 await page.goto('/coherence.html?lang=nl');const video=page.locator('#home-film video');await expect(video.locator('source')).toHaveAttribute('src','media/enterprise-coherence-essentie-nl.mp4');
 await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="fr"]').click();await expect(page.locator('html')).toHaveAttribute('lang','fr');
 await expect(video.locator('source')).toHaveAttribute('src','media/enterprise-coherence-essentie-fr.mp4');await expect(video).toHaveAttribute('poster','img/enterprise-coherence-essentie-fr.webp');await expect(page.locator('#ec-film-h')).toHaveText('Pas de valeur de l’IA sans cohérence');
});
for(const [lang,label] of [['nl','Bekijk de film'],['fr','Voir le film']])test(`workshop and ECA film links open the essentie film in ${lang}`,async({page})=>{
 for(const route of ['workshop.html','eca.html']){await page.goto('/'+route+'?lang='+lang);const link=page.locator('[data-film-link]');await expect(link).toHaveText(label);await expect(link).toHaveAttribute('href','coherence.html?lang='+lang+'#ec-film');
  await link.click();await expect(page).toHaveURL(new RegExp('/coherence\\.html\\?lang='+lang+'#ec-film$'));await expect(page.locator('#ec-film')).toBeInViewport();await expect(page.locator('#home-film video source')).toHaveAttribute('src','media/enterprise-coherence-essentie-'+lang+'.mp4')}
});
