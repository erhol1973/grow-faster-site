const fs=require('node:fs'),{chromium}=require('playwright');
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
    if(await page.locator('#navlist a.l:not(.nav-work)').count()!==5)throw Error('Expected Home plus four primary navigation categories');
    if(await page.locator('#navlist a.nav-work[href="about.html"]').count()!==1)throw Error('Expected one Work with me action');
    if(await page.locator('#burger').isVisible())await page.locator('#burger').click();
    await page.locator('main a.btn[href="workshop.html"]').click();
    await page.waitForURL('https://grow-faster.be/workshop.html');
    if(new URL(page.url()).pathname!=='/workshop.html')throw Error('Home workshop link did not open the offer');
    for(const [lang,title]of [['nl','Van AI-pilot naar bedrijfswaarde'],['en','From AI pilot to business value'],['fr','Du pilote IA à la valeur pour l’entreprise']]){
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
    for(const [lang,label]of [['fr','Lire l’aperçu pour les dirigeants'],['nl','Lees de executive preview'],['en','Read the executive preview']]){
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
    if(!await journal.getByText('Monthly Executive Journal',{exact:true}).isVisible())throw Error('Monthly Journal entry unavailable');
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
    if(errors.length)throw Error(errors.join('\n'));fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/production-smoke.json',JSON.stringify({results,errors,at:new Date().toISOString()},null,2));
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
