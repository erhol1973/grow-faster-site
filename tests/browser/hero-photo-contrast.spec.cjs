const {test,expect}=require('playwright/test');

// Automated axe scans cannot establish contrast over a photographic background.
// Sample the rendered background under the complete headline/subtitle boxes.
// This deliberately conservative check uses a screenshot, not a duplicated CSS gradient.
test('photographic hero retains readable NL and FR text at four widths',async({page},info)=>{
  test.skip(info.project.name!=='chromium','Photographic pixel contrast is a dedicated Chromium rendering check; the existing hero layout cases cover all browser profiles');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()})));
  for(const language of ['nl','fr'])for(const width of [1440,1024,768,390]){
    await page.setViewportSize({width,height:1000});
    await page.goto('/index.html?lang='+language);
    await expect(page.locator('html')).toHaveAttribute('lang',language);
    await expect(page.locator('#consent')).toBeHidden();
    await expect(page.locator('#hero h1')).toBeVisible();
    await page.locator('#hero img').evaluate(image=>image.decode());
    await page.evaluate(()=>document.fonts.ready);
    const regions=await page.locator('#hero h1,#hero .sub').evaluateAll(elements=>elements.map(element=>{
      const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
      return {name:element.tagName==='H1'?'heading':'subtitle',x:rect.x,y:rect.y,width:rect.width,height:rect.height,color:style.color};
    }));
    for(const region of regions){expect(region.x).toBeGreaterThanOrEqual(0);expect(region.x+region.width).toBeLessThanOrEqual(width+1);expect(region.y+region.height).toBeLessThanOrEqual(1000)}
    await info.attach(`hero-${language}-${width}`,{body:await page.screenshot({animations:'disabled',scale:'css'}),contentType:'image/png'});
    const conceal=await page.addStyleTag({content:'#hero .hero-inner{visibility:hidden!important}'});
    let background;
    try{background=await page.screenshot({animations:'disabled',scale:'css'})}finally{await conceal.evaluate(element=>element.remove())}
    const samples=await page.evaluate(async({png,regions})=>{
      const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
      const luminance=rgb=>rgb.map(value=>{value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
      return regions.map(region=>{
        const x=Math.floor(region.x),y=Math.floor(region.y),width=Math.ceil(region.x+region.width)-x,height=Math.ceil(region.y+region.height)-y;
        const pixels=context.getImageData(x,y,width,height).data;
        const foreground=luminance(region.color.match(/[\d.]+/g).slice(0,3).map(Number));
        let minimum=Infinity;
        for(let index=0;index<pixels.length;index+=4){const background=luminance([pixels[index],pixels[index+1],pixels[index+2]]);minimum=Math.min(minimum,(Math.max(background,foreground)+.05)/(Math.min(background,foreground)+.05))}
        return {name:region.name,minimum};
      });
    },{png:background.toString('base64'),regions});
    await info.attach(`contrast-${language}-${width}`,{body:Buffer.from(JSON.stringify(samples,null,2)),contentType:'application/json'});
    for(const sample of samples)expect(sample.minimum,`${language} ${width}px ${sample.name} photo contrast`).toBeGreaterThanOrEqual(sample.name==='heading'?3:4.5);
  }
});
