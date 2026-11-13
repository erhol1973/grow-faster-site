const {test,expect}=require('playwright/test');
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))) });
test('Coherence implicit route scrolling settles before pointer activation',async({page})=>{await page.goto('/coherence.html?lang=fr');await expect(page.locator('html')).toHaveAttribute('lang','fr');const visible=await page.locator('.next-pg a').evaluate(el=>{el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight});expect(visible).toBe(true);await page.locator('.next-pg a').click();await expect(page).toHaveURL(/\/approach\.html$/);});
for(const lang of ['nl','fr']){
 test(`left alignment and requested next-page route (${lang})`,async({page})=>{
  for(const route of ['transformation.html','operating-model.html','eca.html']){
   await page.goto('/'+route+'?lang='+lang);await expect(page.locator('html')).toHaveAttribute('lang',lang);
   const points=await page.evaluate(()=>{const selectors=location.pathname.includes('transformation')?['.practice-intro h1',...Array.from(document.querySelectorAll('.practice-prose>h2')).map(e=>'#'+e.id)]:location.pathname.includes('operating')?['#operating h2','.shift[data-ih="shift"]','.shift[data-ih="drights"]']:['.eca h1','.eca-toolbar'];return selectors.map(s=>document.querySelector(s).getBoundingClientRect().left)});expect(Math.max(...points)-Math.min(...points)).toBeLessThan(2);
  }
  for(const [route,dest]of Object.entries({'index.html':'insights.html','insights.html':'coherence.html','coherence.html':'approach.html','approach.html':'about.html'})){await page.goto('/'+route+'?lang='+lang);await expect(page.locator('html')).toHaveAttribute('lang',lang);await expect(page.locator('.next-pg a')).toHaveAttribute('href',dest);await page.locator('.next-pg a').click();await expect(page).toHaveURL(new RegExp('/'+dest.replace('.','\\.')+'$'))}
 });
 test(`film language, lazy loading, playback and poster (${lang})`,async({page})=>{
  await page.goto('/coherence.html?lang='+lang);const video=page.locator('#coherence-film video');await expect(video).toHaveAttribute('src','media/grow-faster-commercial-final-44s.mp4');await expect(video).toHaveAttribute('poster','img/grow-faster-commercial.webp');await expect(video.locator('track')).toHaveCount(0);await expect(video).toHaveAttribute('preload','none');expect(await video.evaluate(v=>v.paused&&!v.autoplay)).toBe(true);await video.evaluate(v=>v.play());await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(0);await video.evaluate(v=>v.pause());const x=await page.locator('#coherence-film h2').evaluate(e=>e.getBoundingClientRect().left);expect(Math.abs((await video.boundingBox()).x-x)).toBeLessThan(2);expect((await video.boundingBox()).width).toBeLessThanOrEqual(840);const schema=JSON.parse(await page.locator('#coherence-video-schema').textContent());expect(schema.inLanguage).toBe('en');expect(schema.duration).toBe('PT44S');expect(schema.contentUrl).toContain('grow-faster-commercial-final-44s.mp4');
 });
}

test('44-second commercial plays to the end without subtitles',async({page})=>{test.setTimeout(70000);await page.goto('/coherence.html?lang=nl');const video=page.locator('#coherence-film video');await video.evaluate(v=>v.play());await expect.poll(()=>video.evaluate(v=>v.duration)).toBe(44);await expect.poll(()=>video.evaluate(v=>v.ended),{timeout:55000}).toBe(true);expect(await video.evaluate(v=>v.currentTime)).toBe(44);expect(await video.evaluate(v=>v.error)).toBeNull();expect(await video.evaluate(v=>v.textTracks.length)).toBe(0);await expect(video.locator('track')).toHaveCount(0)});

for(const lang of ['nl','fr'])test('Coherence simulator resize cannot move an active next-page pointer target ('+lang+')',async({page})=>{
  await page.goto('/coherence.html?lang='+lang);
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
  const frame=page.frameLocator('#ec-sim');
  await page.locator('#ec-sim').scrollIntoViewIfNeeded();
  await frame.locator('body').waitFor();
  await frame.locator('body').evaluate(()=>document.fonts.ready);
  const link=page.locator('.next-pg a');
  await link.scrollIntoViewIfNeeded();
  const before=await link.boundingBox();
  const height=await page.locator('#ec-sim').evaluate(el=>el.getBoundingClientRect().height);
  await page.mouse.move(before.x+before.width/2,before.y+before.height/2);
  await page.mouse.down();
  try{
    // A real same-origin child message arrives while the mouse button is held.
    // Observe delivery after the production listener, without adding a delay.
    await page.evaluate(h=>{window.__coherenceHeightMessage=new Promise(resolve=>{function received(event){if(event.source===document.getElementById('ec-sim').contentWindow&&event.origin===location.origin&&event.data?.type==='ec-sim-h'&&event.data.h===h){window.removeEventListener('message',received);resolve();}}window.addEventListener('message',received);});},height+600);
    await frame.locator('body').evaluate((_,h)=>parent.postMessage({type:'ec-sim-h',h},location.origin),height+600);
    await page.evaluate(()=>window.__coherenceHeightMessage);
    const held=await link.boundingBox();
    expect(Math.abs(held.y-before.y)).toBeLessThan(1);
    await page.mouse.up();
    await expect(page).toHaveURL(/\/approach\.html$/);
  }finally{await page.mouse.up();}
});

test('Coherence simulator height resumes after an outer pointer is released inside its iframe',async({page})=>{
  await page.goto('/coherence.html?lang=fr');
  await page.locator('#ec-sim').scrollIntoViewIfNeeded();
  const child=page.frameLocator('#ec-sim').locator('body');
  await child.waitFor();
  await child.evaluate(()=>document.fonts.ready);
  const box=await page.locator('#ec-sim').boundingBox();
  const y=Math.max(120,Math.min(page.viewportSize().height-120,box.y+box.height/2));
  const height=await page.locator('#ec-sim').evaluate(el=>el.getBoundingClientRect().height);
  expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,{x:box.x/2,y})).not.toBe('IFRAME');
  await page.mouse.move(box.x/2,y);
  await page.mouse.down();
  try{
    expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,{x:box.x+80,y})).toBe('IFRAME');
    await page.mouse.move(box.x+80,y);await page.mouse.up();
  }
  finally{await page.mouse.up();}
  await child.evaluate((_,h)=>parent.postMessage({type:'ec-sim-h',h},location.origin),height+300);
  await expect.poll(()=>page.locator('#ec-sim').evaluate(el=>parseFloat(el.style.height))).toBe(height+300);
});
