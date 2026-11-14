const fs=require('node:fs'),{chromium}=require('playwright');
async function getRadarPublicPayload(request,url,origin){
  const base=new URL(origin).origin,target=new URL(url);
  if(target.origin!==base||target.username||target.password)throw Error('Unexpected external Radar payload URL');
  // Never follow a script redirect: even a subsequently rejected foreign response
  // would already have sent a request outside the verified publication origin.
  const response=await request.get(target.href,{maxRedirects:0});
  if(new URL(response.url()).origin!==base)throw Error('Unexpected external Radar payload response');
  if(response.status()!==200)throw Error('Radar public payload unavailable (HTTP '+response.status()+'): '+target.pathname);
  return response;
}
async function verifyRadarPublicSurface(page,origin='https://grow-faster.be'){
  const policy=require('./baies-dev-public-policy.cjs'),base=new URL(origin).origin,scriptCache=new Map(),results=[],writes=[];
  const requestListener=request=>{if(!['GET','HEAD'].includes(request.method()))writes.push(request.method()+' '+new URL(request.url()).pathname);};page.on('request',requestListener);
  try{
    for(const route of ['executive-radar','baies-dev'])for(const lang of ['nl','fr']){
      const response=await page.goto(base+'/'+route+'/?lang='+lang+'#about');if(!response||response.status()!==200)throw Error('Radar public route unavailable: '+route+' '+lang);
      if(new URL(response.url()).origin!==base)throw Error('Unexpected external Radar page response');
      const raw=await response.text(),findings=policy.inspectPublicText(route+'/index.html',raw);if(findings.length)throw Error(findings.join('\n'));
      const scripts=[...raw.matchAll(/<script\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)].map(match=>new URL(policy.decodePolicyText(match[1]||match[2]||match[3]),response.url()));
      if(!scripts.length)throw Error('Radar runtime scripts missing: '+route);
      for(const script of scripts){if(script.origin!==base)throw Error('Unexpected external Radar script');if(!scriptCache.has(script.href)){
        const payload=await getRadarPublicPayload(page.request,script.href,base);
        const text=await payload.text(),violations=policy.inspectPublicText(script.pathname,text);if(violations.length)throw Error(violations.join('\n'));
        scriptCache.set(script.href,{path:script.pathname+script.search,sha256:require('node:crypto').createHash('sha256').update(text).digest('hex')});
      }}
      const current=new URL(page.url());if(current.pathname!=='/'+route+'/'||current.searchParams.get('lang')!==lang||current.hash!=='#overview')throw Error('Removed Radar About route did not safely preserve locale: '+route+' '+lang);
      if(await page.locator('html').getAttribute('lang')!==lang+'-BE'||!await page.locator('article[data-language="'+lang+'"]').isVisible())throw Error('Radar featured signal unavailable: '+route+' '+lang);
      if(await page.locator('#about,#heading-about,[data-view=about],[href="#about"],[id^=signup-],#dashboard,#radar,#evidence,#editorial').count())throw Error('Private or removed Radar DOM remains public');
      if(!await page.locator('meta[name="radar-template"]').count()||!await page.locator('meta[name="radar-edition"]').count())throw Error('Protected Radar edition integrity markers missing');
      if(await page.locator('.site-header .identity').getAttribute('href')!=='../index.html?lang='+lang)throw Error('Radar website return lost locale');
      results.push({route:route+'/',language:lang,internalAboutAbsent:true,legacyHashFallback:'overview',memberContentProtected:true,featuredSignalAvailable:true,rawSha256:require('node:crypto').createHash('sha256').update(raw).digest('hex')});
    }
    if(writes.length)throw Error('Unexpected Radar write request: '+writes.join(', '));
    return {routes:results,scripts:[...scriptCache.values()],readOnly:true,writes:0};
  }finally{page.off('request',requestListener);}
}

async function main(){
  const browser=await chromium.launch({headless:true,...(process.env.TEST_BROWSER_EXECUTABLE?{executablePath:process.env.TEST_BROWSER_EXECUTABLE}:{})});
  try{
    const page=await browser.newPage();await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:4,ext:false,ana:false,ts:Date.now()}))});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
    for(const route of ['index.html','coherence.html','insights.html']){
      const response=await page.goto('https://grow-faster.be/'+route);if(response.status()!==200)throw Error(route+': HTTP '+response.status());
      if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
      await page.locator('.nav a[href="about.html"]').click();await page.waitForURL('https://grow-faster.be/about.html');
      if(await page.evaluate(()=>scrollY)>8)throw Error('Contact scrolled from '+route);results.push({route,contactTop:true});
    }
    await page.goto('https://grow-faster.be/index.html');
    if(await page.locator('#navlist a.l:not(.nav-work)').count()!==6)throw Error('Expected Home plus five primary navigation categories');
    if(await page.locator('#navlist a.nav-work[href="about.html"]').count()!==1)throw Error('Expected one Work with me action');
    if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
    await page.locator('main a.btn[href="workshop.html"]').click();
    await page.waitForURL('https://grow-faster.be/workshop.html');
    if(new URL(page.url()).pathname!=='/workshop.html')throw Error('Home workshop link did not open the offer');
    for(const [lang,title]of [['nl','Van AI-pilot naar bedrijfswaarde'],['fr','Du pilote IA à la valeur pour l’entreprise']]){
      if(await page.locator('html').getAttribute('lang')!==lang){await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+lang+'"]').click()}
      if(!(await page.locator('h1').innerText()).includes(title))throw Error('Workshop heading mismatch: '+lang);
      if(!await page.locator('#request-form').isVisible())throw Error('Workshop request unavailable: '+lang);
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Workshop overflow: '+lang);
      results.push({route:'workshop.html',language:lang,requestAvailable:true});
    }
    await page.goto('https://grow-faster.be/index.html');
    if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
    await page.locator('[aria-controls="nav-coherence"]').click();
    await page.locator('[aria-controls="nav-approach"]').click();
    if(!await page.locator('#nav-coherence').isHidden())throw Error('Only one navigation group may be expanded');
    await page.locator('#nav-approach a[href="eca.html"]').click();await page.waitForURL('https://grow-faster.be/eca.html');
    if(!await page.locator('#assessment').isVisible())throw Error('Anonymous ECA unavailable from navigation');
    results.push({route:'index.html',groupedEcaRoute:true});
    await page.goto('https://grow-faster.be/approach.html');
    const workshopEntry=page.locator('#approach-workshop-cta');
    const entry=await workshopEntry.boundingBox();
    if(!entry||entry.y<0||entry.y+entry.height>await page.evaluate(()=>innerHeight))throw Error('Approach workshop entry is not fully visible without scrolling');
    await workshopEntry.click();await page.waitForURL('https://grow-faster.be/workshop.html');
    results.push({route:'approach.html',workshopAboveFold:true});
    await page.goto('https://grow-faster.be/index.html');
    if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
    await page.locator('[aria-controls="nav-coherence"]').click();
    await page.locator('#nav-coherence a[href="books.html"]').click();await page.waitForURL('https://grow-faster.be/books.html');
    for(const [lang,label]of [['fr','Lire l’aperçu pour les dirigeants'],['nl','Lees de executive preview']]){
      if(await page.locator('html').getAttribute('lang')!==lang){await page.locator('#lang-btn-top').click();await page.locator('.lang-top [data-lang="'+lang+'"]').click()}
      if(!(await page.locator('.book-download').innerText()).includes(label))throw Error('Book download language mismatch: '+lang);
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Book overflow: '+lang);
      results.push({route:'books.html',language:lang,freeDownloadAvailable:true});
    }
    await page.goto('https://grow-faster.be/index.html');
    if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
    await page.locator('#navlist a[href="insights.html"]').click();
    await page.waitForURL('https://grow-faster.be/insights.html');
    const journal=page.locator('#executive-journal');
    if(!await journal.getByText('De Maandelijkse Executive Journal',{exact:true}).isVisible())throw Error('Monthly Journal entry unavailable');
    await journal.locator('a[href="journal.html"]').click();
    await page.waitForURL('https://grow-faster.be/journal.html');
    if(await page.locator('html').getAttribute('lang')!=='nl'||!await page.locator('#p1:visible').count())throw Error('Dutch Journal unavailable');
    await page.locator('[data-next]').click();
    await page.locator('[data-alternate]').click();
    await page.waitForURL('https://grow-faster.be/journal-fr.html#p2');
    if(await page.locator('html').getAttribute('lang')!=='fr'||!await page.locator('#p2:visible').count())throw Error('French Journal or preserved page unavailable');
    results.push({route:'journal.html',monthlyIssue:1,languages:['nl','fr'],pagePreserved:true});
    const publication=require('../tests/book-publication.json');
    const pdf=await page.request.get('https://grow-faster.be/'+publication.file);
    if(pdf.status()!==200||!pdf.headers()['content-type']?.startsWith('application/pdf'))throw Error('Public book PDF unavailable');
    const bytes=await pdf.body();if(bytes.length!==publication.bytes||require('node:crypto').createHash('sha256').update(bytes).digest('hex')!==publication.sha256)throw Error('Public PDF differs from approved publication');if((await page.request.get('https://grow-faster.be/books/design-for-coherence.pdf')).status()!==404)throw Error('Full book PDF must not be public');
    results.push({route:publication.file,bytes:bytes.length,sha256:publication.sha256});
    const radar=await verifyRadarPublicSurface(page);results.push({radarPublicContent:radar});
    if(errors.length)throw Error(errors.join('\n')); fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/production-smoke.json',JSON.stringify({results,errors,at:new Date().toISOString()},null,2));
  }finally{await browser.close()}
}
module.exports={verifyRadarPublicSurface,getRadarPublicPayload};
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
