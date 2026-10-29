const fs=require('node:fs'),{chromium}=require('playwright');
async function main(){
  const browser=await chromium.launch({headless:true,...(process.env.TEST_BROWSER_EXECUTABLE?{executablePath:process.env.TEST_BROWSER_EXECUTABLE}:{})});
  try{
    const page=await browser.newPage();await page.addInitScript(()=>{localStorage.setItem('avs-lang','nl');localStorage.setItem('avs-consent',JSON.stringify({v:3,ext:false,ana:false,ts:Date.now()}))});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
    for(const route of ['index.html','coherence.html','insights.html']){
      const response=await page.goto('https://grow-faster.be/'+route);if(response.status()!==200)throw Error(route+': HTTP '+response.status());
      await page.locator('.nav .nav-cta').click();await page.waitForURL('https://grow-faster.be/about.html');
      if(await page.evaluate(()=>scrollY)>8)throw Error('Contact scrolled from '+route);results.push({route,contactTop:true});
    }
    if(errors.length)throw Error(errors.join('\n'));fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/production-smoke.json',JSON.stringify({results,errors,at:new Date().toISOString()},null,2));
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
